/**
 * Governance API - Council & Member Endpoints
 * 
 * GET /api/v1/governance - Get current council with members
 * POST /api/v1/governance - Create a new council or add member to council
 * 
 * This API allows the VPS Governance section to sync Chief & Council profiles
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';
import { CouncilMemberCreateSchema, CurrentCouncilCreateSchema } from '@/lib/validations/governance-schemas';
import type { Positions, Portfolios } from '@prisma/client';

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
    member_count: council.members?.length || council._count?.members || 0,
    timestamps: {
      created: council.created.toISOString(),
      updated: council.updated.toISOString(),
    },
  };
}

// GET - Fetch current council with members or all councils
async function handleGetCouncil(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const councilId = searchParams.get('council_id');
    const position = searchParams.get('position') as Positions | null;

    // If requesting all councils
    if (all) {
      const councils = await prisma.current_Council.findMany({
        orderBy: { council_start: 'desc' },
        include: {
          members: {
            orderBy: [{ position: 'asc' }, { last_name: 'asc' }],
          },
          _count: { select: { members: true } },
        },
      });

      return NextResponse.json(
        createAPIResponse(councils.map(transformCouncil), undefined, {
          total: councils.length,
        })
      );
    }

    // If requesting specific council
    if (councilId) {
      const council = await prisma.current_Council.findUnique({
        where: { id: councilId },
        include: {
          members: {
            where: position ? { position } : {},
            orderBy: [{ position: 'asc' }, { last_name: 'asc' }],
          },
        },
      });

      if (!council) {
        return NextResponse.json(
          createAPIResponse(null, 'Council not found'),
          { status: 404 }
        );
      }

      return NextResponse.json(createAPIResponse(transformCouncil(council)));
    }

    // Default: Get current (most recent) council
    const council = await prisma.current_Council.findFirst({
      orderBy: { council_start: 'desc' },
      include: {
        members: {
          where: position ? { position } : {},
          orderBy: [{ position: 'asc' }, { last_name: 'asc' }],
        },
      },
    });

    if (!council) {
      return NextResponse.json(
        createAPIResponse(null, 'No council found'),
        { status: 404 }
      );
    }

    return NextResponse.json(createAPIResponse(transformCouncil(council)));
  } catch (error) {
    console.error('Error fetching council:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to fetch council'),
      { status: 500 }
    );
  }
}

// POST - Create a new council or add a member
async function handleCreateCouncil(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if creating a council or a member
    if (body.council_start && body.council_end) {
      // Creating a new council
      const parsed = CurrentCouncilCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          createAPIResponse(null, 'Validation error', { errors: parsed.error.flatten() }),
          { status: 400 }
        );
      }

      const council = await prisma.current_Council.create({
        data: {
          council_start: parsed.data.council_start,
          council_end: parsed.data.council_end,
          sourceId: parsed.data.sourceId || null,
        },
        include: { members: true },
      });

      return NextResponse.json(
        createAPIResponse(transformCouncil(council), undefined, { action: 'council_created' }),
        { status: 201 }
      );
    }

    // Creating a new member
    const parsed = CouncilMemberCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createAPIResponse(null, 'Validation error', { errors: parsed.error.flatten() }),
        { status: 400 }
      );
    }

    // If no councilId provided, assign to current council
    let councilId = parsed.data.councilId;
    if (!councilId) {
      const currentCouncil = await prisma.current_Council.findFirst({
        orderBy: { council_start: 'desc' },
      });
      councilId = currentCouncil?.id || null;
    }

    const member = await prisma.council_Member.create({
      data: {
        position: parsed.data.position,
        first_name: parsed.data.first_name.trim(),
        last_name: parsed.data.last_name.trim(),
        portfolios: [...new Set(parsed.data.portfolios)],
        email: parsed.data.email.trim().toLowerCase(),
        phone: parsed.data.phone.trim(),
        bio: parsed.data.bio || null,
        image_url: parsed.data.image_url || null,
        councilId,
      },
    });

    return NextResponse.json(
      createAPIResponse(transformCouncilMember(member), undefined, { action: 'member_created' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating council/member:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to create council/member'),
      { status: 500 }
    );
  }
}

export const GET = withAPIMiddleware(handleGetCouncil);
export const POST = withAPIMiddleware(handleCreateCouncil);
