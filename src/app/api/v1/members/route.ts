import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';
import { transformMemberForAPI } from '@/lib/api-transformers';
import { API_CONFIG } from '@/lib/api-config';
import type { PaginationMeta } from '@/lib/api-types';
import { differenceInYears } from 'date-fns';

// Optimized transformer for selected fields only
function transformMemberForAPIOptimized(member: any) {
  const profile = member.profile?.[0];
  const family = member.family?.[0];
  const age = member.birthdate ? differenceInYears(new Date(), new Date(member.birthdate)) : 0;
  
  return {
    id: member.id,
    personal_info: {
      first_name: member.first_name,
      last_name: member.last_name,
      birthdate: new Date(member.birthdate).toISOString(),
      age,
      t_number: member.t_number,
      gender: profile?.gender || undefined,
      deceased: member.deceased === 'yes',
      activated: member.activated,
    },
    contact_info: {
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
      address: profile?.address || '',
      community: profile?.community || '',
      reserve_status: profile?.o_r_status === 'onreserve' ? 'on_reserve' : 'off_reserve',
      image_url: profile?.image_url || undefined,
    },
    family_info: {
      spouse: family?.spouse_fname ? {
        first_name: family.spouse_fname,
        last_name: family.spouse_lname || undefined,
      } : undefined,
      dependents: family?.dependents || 0,
    },
    barcodes: member.barcode?.map((barcode: any) => ({
      id: barcode.id,
      barcode: barcode.barcode,
      status: barcode.activated === 2 ? 'active' : 'available',
      assigned_date: barcode.created.toISOString(),
    })) || [],
    timestamps: {
      created: member.created.toISOString(),
      updated: member.updated.toISOString(),
    },
    audit_info: {
      created_at: member.created.toISOString(),
      updated_at: member.updated.toISOString(),
    },
  };
}

async function handleGetMembers(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json(
      createAPIResponse(null, 'Method not allowed'),
      { status: 405 }
    );
  }
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
      API_CONFIG.MAX_MEMBERS_PER_REQUEST,
      Math.max(1, parseInt(searchParams.get('limit') || API_CONFIG.DEFAULT_PAGE_SIZE.toString()))
    );
    const search = searchParams.get('search') || '';
    const community = searchParams.get('community') || '';
    const reserveStatus = searchParams.get('reserve_status') || '';
    const includeDeceased = searchParams.get('include_deceased') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { t_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!includeDeceased) {
      // Include living members - explicitly allow null, "no", or anything except "yes"
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { deceased: null },
          { deceased: { not: 'yes' } }
        ]
      });
    }

    if (community) {
      where.profile = {
        some: {
          community: { contains: community, mode: 'insensitive' }
        }
      };
    }

    if (reserveStatus && ['on_reserve', 'off_reserve'].includes(reserveStatus)) {
      const status = reserveStatus === 'on_reserve' ? 'onreserve' : 'offreserve';
      where.profile = {
        ...where.profile,
        some: {
          ...where.profile?.some,
          o_r_status: status
        }
      };
    }

    // Parallel execution for better performance
    const [totalCount, members] = await Promise.all([
      prisma.fnmember.count({ where }),
      prisma.fnmember.findMany({
        where,
        select: {
          id: true,
          created: true,
          updated: true,
          birthdate: true,
          first_name: true,
          last_name: true,
          t_number: true,
          deceased: true,
          activated: true,
          profile: {
            select: {
              gender: true,
              email: true,
              phone_number: true,
              address: true,
              community: true,
              o_r_status: true,
              image_url: true,
            },
            take: 1,
          },
          barcode: {
            select: {
              id: true,
              barcode: true,
              activated: true,
              created: true,
            },
            orderBy: { created: 'desc' },
            take: 3, // Limit barcodes for performance
          },
          family: {
            select: {
              spouse_fname: true,
              spouse_lname: true,
              dependents: true,
            },
            take: 1,
          },
        },
        orderBy: { created: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    const transformed = members.map(member => transformMemberForAPIOptimized(member));

    const pagination: PaginationMeta = {
      page,
      limit,
      total_pages: totalPages,
      total_count: totalCount,
      has_next: page < totalPages,
      has_previous: page > 1,
    };

    return NextResponse.json(
      createAPIResponse(transformed, undefined, { pagination, total_count: totalCount })
    );
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to fetch members'),
      { status: 500 }
    );
  }
}

export const GET = withAPIMiddleware(handleGetMembers);