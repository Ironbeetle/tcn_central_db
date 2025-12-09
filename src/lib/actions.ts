'use server';
import { revalidatePath } from 'next/cache';
import  prisma  from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Simplified schema - only fnmember core fields
// Profile and Family are updated by members via portal
const CreateMemberSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birthdate: z.coerce.date(), // coerce handles string -> Date conversion
  t_number: z.string().min(1, "T-number is required"),
  deceased: z.string().optional().nullable(),
});

const UpdateMemberSchema = CreateMemberSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateMemberData = z.infer<typeof CreateMemberSchema>;
export type UpdateMemberData = z.infer<typeof UpdateMemberSchema>;

export async function createFnMember(data: CreateMemberData) {
  try {
    const validatedData = CreateMemberSchema.parse(data);
    
    const result = await prisma.$transaction(async (tx) => {
      // Create the member
      const member = await tx.fnmember.create({
        data: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          birthdate: validatedData.birthdate,
          t_number: validatedData.t_number,
          deceased: validatedData.deceased || null,
        },
      });

      // Auto-assign first available barcode
      const availableBarcode = await tx.barcode.findFirst({
        where: {
          activated: 1, // Available
          fnmemberId: null, // Not assigned
        },
        orderBy: { created: 'asc' }, // Oldest first
      });

      if (availableBarcode) {
        await tx.barcode.update({
          where: { id: availableBarcode.id },
          data: {
            fnmemberId: member.id,
            activated: 2, // Mark as assigned
          },
        });
      }

      // Return the complete member with barcode
      return await tx.fnmember.findUnique({
        where: { id: member.id },
        include: {
          profile: true,
          barcode: true,
          family: true,
        },
      });
    });

    console.log('Member created with ID:', result?.id, 'Barcode assigned:', result?.barcode?.[0]?.barcode || 'None available');
    
    revalidatePath('/editor');
    revalidatePath('/Editor');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating member:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.issues };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'T-number already exists' };
      }
    }
    return { success: false, error: 'Failed to create member' };
  }
}

// Simplified update - only fnmember core fields
// Profile and Family updates come from portal sync
export async function updateFnMember(id: string, data: Partial<UpdateMemberData>) {
  try {
    const validatedData = UpdateMemberSchema.partial().parse({ ...data, id });
    
    const result = await prisma.$transaction(async (tx) => {
      // Update only fnmember fields
      const memberUpdateData: Prisma.fnmemberUpdateInput = {};
      if (validatedData.first_name !== undefined) memberUpdateData.first_name = validatedData.first_name;
      if (validatedData.last_name !== undefined) memberUpdateData.last_name = validatedData.last_name;
      if (validatedData.birthdate !== undefined) memberUpdateData.birthdate = validatedData.birthdate;
      if (validatedData.t_number !== undefined) memberUpdateData.t_number = validatedData.t_number;
      if (validatedData.deceased !== undefined) memberUpdateData.deceased = validatedData.deceased;
      memberUpdateData.updated = new Date();

      await tx.fnmember.update({
        where: { id },
        data: memberUpdateData,
      });

      // Return the updated member with relations
      return await tx.fnmember.findUnique({
        where: { id },
        include: {
          profile: true,
          barcode: true,
          family: true,
        },
      });
    });

    revalidatePath('/editor');
    revalidatePath('/Editor');
    
    return { 
      success: true, 
      data: result
    };
  } catch (error) {
    console.error('Error updating member:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.issues };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'T-number already exists' };
      }
      if (error.code === 'P2025') {
        return { success: false, error: 'Member not found' };
      }
    }
    return { success: false, error: 'Failed to update member' };
  }
}

export async function getFnMembers(searchTerm: string = '') {
  try {
    const where = searchTerm ? {
      OR: [
        { first_name: { contains: searchTerm, mode: 'insensitive' as const } },
        { last_name: { contains: searchTerm, mode: 'insensitive' as const } },
        { t_number: { contains: searchTerm, mode: 'insensitive' as const } },
        { 
          profile: { 
            some: {
              OR: [
                { email: { contains: searchTerm, mode: 'insensitive' as const } },
                { community: { contains: searchTerm, mode: 'insensitive' as const } },
              ]
            }
          }
        },
      ]
    } : {};

    const members = await prisma.fnmember.findMany({
      where,
      include: {
        profile: true,
        barcode: true,
        family: true,
      },
      orderBy: {
        created: 'desc'
      },
    });

    return {
      success: true,
      data: members
    };
  } catch (error) {
    console.error('Error fetching members:', error);
    return { success: false, error: 'Failed to fetch members' };
  }
}

export async function deleteFnMember(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // First, deactivate any barcodes assigned to this member
      await tx.barcode.updateMany({
        where: { fnmemberId: id },
        data: { 
          fnmemberId: null,
          activated: 1 // Reset to available state
        }
      });

      // Delete the member (profiles and family will cascade delete)
      await tx.fnmember.delete({
        where: { id }
      });
    });
    
    revalidatePath('/editor');
    return { success: true };
  } catch (error) {
    console.error('Error deleting member:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Member not found' };
      }
    }
    return { success: false, error: 'Failed to delete member' };
  }
}

export async function getUnassignedBarcodes() {
  try {
    const barcodes = await prisma.barcode.findMany({
      where: {
        activated: 1, // Available barcodes
        fnmemberId: null
      },
      orderBy: {
        created: 'desc'
      }
    });

    return {
      success: true,
      data: barcodes
    };
  } catch (error) {
    console.error('Error fetching unassigned barcodes:', error);
    return { success: false, error: 'Failed to fetch barcodes' };
  }
}

export async function getMemberById(id: string) {
  try {
    const member = await prisma.fnmember.findUnique({
      where: { id },
      include: {
        profile: true,
        barcode: true,
        family: true,
      },
    });

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    return {
      success: true,
      data: member
    };
  } catch (error) {
    console.error('Error fetching member:', error);
    return { success: false, error: 'Failed to fetch member' };
  }
}