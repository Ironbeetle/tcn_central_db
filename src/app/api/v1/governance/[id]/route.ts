/**
 * Governance API - Single Council Member Endpoints
 * 
 * GET /api/v1/governance/[id] - Get a council member by ID
 * PATCH /api/v1/governance/[id] - Update a council member
 * DELETE /api/v1/governance/[id] - Delete a council member
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';
import { CouncilMemberUpdateSchema } from '@/lib/validations/governance-schemas';
import type { Portfolios } from '@prisma/client';

// Transform council member for API response
function transformCouncilMember(member: any) {
  return {
    id: member.id,
    council_id: member.councilId,
    position: member.position,
    first_name: member.first_name,
    last_name: member.last_name,
    full_name: `${member.first_name} ${member.last_name}`,
    portfolios: member.portfolios,
    contact: {
      email: member.email,
      phone: member.phone,
    },
    bio: member.bio,
    image_url: member.image_url,
    council: member.Current_Council ? {
      id: member.Current_Council.id,
      council_start: member.Current_Council.council_start.toISOString(),
      council_end: member.Current_Council.council_end.toISOString(),
    } : null,
    timestamps: {
      created: member.created.toISOString(),
      updated: member.updated.toISOString(),
    },
  };
}

// GET - Fetch a single council member
async function handleGetCouncilMember(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      createAPIResponse(null, 'Council member ID is required'),
      { status: 400 }
    );
  }

  try {
    const member = await prisma.council_Member.findUnique({
      where: { id },
      include: { Current_Council: true },
    });

    if (!member) {
      return NextResponse.json(
        createAPIResponse(null, 'Council member not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(createAPIResponse(transformCouncilMember(member)));
  } catch (error) {
    console.error('Error fetching council member:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to fetch council member'),
      { status: 500 }
    );
  }
}

// PATCH - Update a council member
async function handleUpdateCouncilMember(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      createAPIResponse(null, 'Council member ID is required'),
      { status: 400 }
    );
  }

  try {
    const member = await prisma.council_Member.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json(
        createAPIResponse(null, 'Council member not found'),
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = CouncilMemberUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        createAPIResponse(null, 'Validation error', { errors: parsed.error.flatten() }),
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (parsed.data.position !== undefined) {
      updateData.position = parsed.data.position;
    }
    if (parsed.data.first_name !== undefined) {
      updateData.first_name = parsed.data.first_name.trim();
    }
    if (parsed.data.last_name !== undefined) {
      updateData.last_name = parsed.data.last_name.trim();
    }
    if (parsed.data.portfolios !== undefined) {
      updateData.portfolios = [...new Set(parsed.data.portfolios)];
    }
    if (parsed.data.email !== undefined) {
      updateData.email = parsed.data.email.trim().toLowerCase();
    }
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone.trim();
    }
    if (parsed.data.bio !== undefined) {
      updateData.bio = parsed.data.bio || null;
    }
    if (parsed.data.image_url !== undefined) {
      updateData.image_url = parsed.data.image_url || null;
    }
    if (parsed.data.councilId !== undefined) {
      updateData.councilId = parsed.data.councilId || null;
    }

    const updatedMember = await prisma.council_Member.update({
      where: { id: member.id },
      data: updateData,
      include: { Current_Council: true },
    });

    return NextResponse.json(
      createAPIResponse(transformCouncilMember(updatedMember), undefined, {
        action: 'updated',
      })
    );
  } catch (error) {
    console.error('Error updating council member:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to update council member'),
      { status: 500 }
    );
  }
}

// DELETE - Delete a council member
async function handleDeleteCouncilMember(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(
      createAPIResponse(null, 'Council member ID is required'),
      { status: 400 }
    );
  }

  try {
    const member = await prisma.council_Member.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json(
        createAPIResponse(null, 'Council member not found'),
        { status: 404 }
      );
    }

    await prisma.council_Member.delete({
      where: { id: member.id },
    });

    return NextResponse.json(
      createAPIResponse({ deleted: true, id: member.id }, undefined, {
        action: 'deleted',
      })
    );
  } catch (error) {
    console.error('Error deleting council member:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to delete council member'),
      { status: 500 }
    );
  }
}

export const GET = withAPIMiddleware(handleGetCouncilMember);
export const PATCH = withAPIMiddleware(handleUpdateCouncilMember);
export const DELETE = withAPIMiddleware(handleDeleteCouncilMember);
