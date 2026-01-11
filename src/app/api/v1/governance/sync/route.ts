/**
 * Governance Sync API - Bulk Sync Endpoint
 * 
 * POST /api/v1/governance/sync - Bulk sync council and members from VPS
 * 
 * This endpoint allows the VPS to push the entire council at once,
 * creating/updating the council and all its members
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';
import { SyncCouncilRequestSchema } from '@/lib/validations/governance-schemas';
import type { Positions, Portfolios } from '@prisma/client';

interface SyncResult {
  council: {
    id: string;
    action: 'created' | 'updated';
  } | null;
  members: {
    created: number;
    updated: number;
    deleted: number;
  };
  errors: Array<{ source_id?: string; error: string }>;
}

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
    timestamps: {
      created: member.created.toISOString(),
      updated: member.updated.toISOString(),
    },
  };
}

// Transform council for API response
function transformCouncil(council: any) {
  return {
    id: council.id,
    source_id: council.sourceId,
    council_start: council.council_start.toISOString(),
    council_end: council.council_end.toISOString(),
    members: council.members?.map(transformCouncilMember) || [],
    member_count: council.members?.length || 0,
    timestamps: {
      created: council.created.toISOString(),
      updated: council.updated.toISOString(),
    },
  };
}

// POST - Bulk sync council and members
async function handleSyncCouncil(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const parsed = SyncCouncilRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createAPIResponse(null, 'Validation error', { errors: parsed.error.flatten() }),
        { status: 400 }
      );
    }

    const { council: councilData, members: membersData } = parsed.data;
    const result: SyncResult = {
      council: null,
      members: { created: 0, updated: 0, deleted: 0 },
      errors: [],
    };

    // Start a transaction for atomicity
    const syncedCouncil = await prisma.$transaction(async (tx) => {
      let council;

      // If council data provided, upsert the council
      if (councilData) {
        const existingCouncil = await tx.current_Council.findUnique({
          where: { sourceId: councilData.source_id },
        });

        if (existingCouncil) {
          council = await tx.current_Council.update({
            where: { id: existingCouncil.id },
            data: {
              council_start: councilData.council_start,
              council_end: councilData.council_end,
            },
          });
          result.council = { id: council.id, action: 'updated' };
        } else {
          council = await tx.current_Council.create({
            data: {
              council_start: councilData.council_start,
              council_end: councilData.council_end,
              sourceId: councilData.source_id,
            },
          });
          result.council = { id: council.id, action: 'created' };
        }
      } else {
        // Get or create current council
        council = await tx.current_Council.findFirst({
          orderBy: { council_start: 'desc' },
        });

        if (!council) {
          // Create a default council if none exists
          const now = new Date();
          const endDate = new Date(now.getFullYear() + 4, now.getMonth(), now.getDate());
          council = await tx.current_Council.create({
            data: {
              council_start: now,
              council_end: endDate,
            },
          });
          result.council = { id: council.id, action: 'created' };
        }
      }

      // Get existing members for this council to track what needs to be deleted
      const existingMembers = await tx.council_Member.findMany({
        where: { councilId: council.id },
      });
      const existingMemberEmails = new Set(existingMembers.map(m => m.email.toLowerCase()));
      const syncedMemberEmails = new Set<string>();

      // Process each member
      for (const memberData of membersData) {
        try {
          const email = memberData.email.trim().toLowerCase();
          syncedMemberEmails.add(email);

          // Find existing member by email within this council
          const existingMember = existingMembers.find(
            m => m.email.toLowerCase() === email
          );

          if (existingMember) {
            // Update existing member
            await tx.council_Member.update({
              where: { id: existingMember.id },
              data: {
                position: memberData.position,
                first_name: memberData.first_name.trim(),
                last_name: memberData.last_name.trim(),
                portfolios: [...new Set(memberData.portfolios || [])],
                phone: memberData.phone.trim(),
                bio: memberData.bio || null,
                image_url: memberData.image_url || null,
              },
            });
            result.members.updated++;
          } else {
            // Create new member
            await tx.council_Member.create({
              data: {
                position: memberData.position,
                first_name: memberData.first_name.trim(),
                last_name: memberData.last_name.trim(),
                portfolios: [...new Set(memberData.portfolios || [])],
                email,
                phone: memberData.phone.trim(),
                bio: memberData.bio || null,
                image_url: memberData.image_url || null,
                councilId: council.id,
              },
            });
            result.members.created++;
          }
        } catch (memberError) {
          console.error(`Error processing member ${memberData.source_id}:`, memberError);
          result.errors.push({
            source_id: memberData.source_id,
            error: 'Failed to process member',
          });
        }
      }

      // Optionally delete members not in sync (commented out for safety - enable if needed)
      // const membersToDelete = existingMembers.filter(
      //   m => !syncedMemberEmails.has(m.email.toLowerCase())
      // );
      // for (const member of membersToDelete) {
      //   await tx.council_Member.delete({ where: { id: member.id } });
      //   result.members.deleted++;
      // }

      // Return the updated council with members
      return tx.current_Council.findUnique({
        where: { id: council.id },
        include: {
          members: {
            orderBy: [{ position: 'asc' }, { last_name: 'asc' }],
          },
        },
      });
    });

    return NextResponse.json(
      createAPIResponse(
        {
          council: syncedCouncil ? transformCouncil(syncedCouncil) : null,
          sync_result: result,
        },
        undefined,
        {
          action: 'sync',
          has_errors: result.errors.length > 0,
        }
      ),
      { status: result.errors.length > 0 && result.members.created + result.members.updated === 0 ? 400 : 200 }
    );
  } catch (error) {
    console.error('Error syncing council:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to sync council'),
      { status: 500 }
    );
  }
}

export const POST = withAPIMiddleware(handleSyncCouncil);
