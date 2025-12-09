import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';

async function handleGetCommunities(req: NextRequest) {
  try {
    const communities = await prisma.profile.groupBy({
      by: ['community'],
      _count: {
        community: true,
      },
      where: {
        community: {
          not: "",
        },
      },
      orderBy: {
        _count: {
          community: 'desc',
        },
      },
    });
    
    const formattedCommunities = communities.map(community => ({
      name: community.community,
      member_count: community._count.community,
    }));
    
    return NextResponse.json(
      createAPIResponse(formattedCommunities)
    );
    
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to fetch communities'),
      { status: 500 }
    );
  }
}

export const GET = withAPIMiddleware(handleGetCommunities);