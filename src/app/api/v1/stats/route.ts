import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';
import { generateStatsData } from '@/lib/api-transformers';

async function handleGetStats(req: NextRequest) {
  try {
    // Use aggregation queries for better performance
    const [
      totalMembers,
      deceasedMembers, 
      onReserveMembers,
      communityStats,
      ageStats,
      recentAdditions,
      totalBarcodes,
      availableBarcodes
    ] = await Promise.all([
      // Total members
      prisma.fnmember.count(),
      
      // Deceased members  
      prisma.fnmember.count({
        where: { deceased: 'yes' }
      }),
      
      // On reserve members
      prisma.fnmember.count({
        where: {
          profile: {
            some: { o_r_status: 'onreserve' }
          }
        }
      }),
      
      // Community distribution
      prisma.profile.groupBy({
        by: ['community'],
        _count: { community: true },
        where: { community: { not: '' } },
        orderBy: { _count: { community: 'desc' } }
      }),
      
      // Age distribution - fetch birthdates for calculation
      prisma.fnmember.findMany({
        select: { birthdate: true }
      }),
      
      // Recent additions (last 30 days)
      prisma.fnmember.count({
        where: {
          created: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total barcodes assigned
      prisma.barcode.count({
        where: { fnmemberId: { not: null } }
      }),
      
      // Available barcodes
      prisma.barcode.count({
        where: {
          activated: 1,
          fnmemberId: null,
        }
      })
    ]);
    
    // Process community stats
    const communities = communityStats.map(stat => ({
      name: stat.community,
      member_count: stat._count.community,
      percentage: Math.round((stat._count.community / totalMembers) * 100 * 100) / 100
    }));
    
    // Process age distribution
    const ageGroups = {
      '0-17': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56-65': 0, '65+': 0
    };
    
    const now = new Date();
    ageStats.forEach(({ birthdate }) => {
      if (birthdate) {
        const age = Math.floor((now.getTime() - new Date(birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age <= 17) ageGroups['0-17']++;
        else if (age <= 25) ageGroups['18-25']++;
        else if (age <= 35) ageGroups['26-35']++;
        else if (age <= 45) ageGroups['36-45']++;
        else if (age <= 55) ageGroups['46-55']++;
        else if (age <= 65) ageGroups['56-65']++;
        else ageGroups['65+']++;
      }
    });
    
    const ageDistribution = Object.entries(ageGroups).map(([range, count]) => ({
      age_range: range,
      count,
      percentage: Math.round((count / totalMembers) * 100 * 100) / 100
    }));
    
    const stats = {
      total_members: totalMembers,
      active_members: totalMembers - deceasedMembers,
      deceased_members: deceasedMembers,
      on_reserve_count: onReserveMembers,
      off_reserve_count: totalMembers - onReserveMembers,
      communities,
      age_distribution: ageDistribution,
      recent_additions: recentAdditions,
      total_barcodes_assigned: totalBarcodes,
      available_barcodes: availableBarcodes,
      last_updated: new Date().toISOString()
    };
    
    return NextResponse.json(
      createAPIResponse(stats)
    );
    
  } catch (error) {
    console.error('Error generating stats:', error);
    return NextResponse.json(
      createAPIResponse(null, 'Failed to generate statistics'),
      { status: 500 }
    );
  }
}

export const GET = withAPIMiddleware(handleGetStats);