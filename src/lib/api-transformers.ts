import { differenceInYears } from 'date-fns';
import type { FnMemberWithRelations } from '@/hooks/useFnMembers';
import type { APIMemberData, APIStatsData } from './api-types';

export function transformMemberForAPI(member: FnMemberWithRelations): APIMemberData {
  const profile = member.profile?.[0];
  const family = member.family?.[0];
  
  // Calculate age
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
    barcodes: member.barcode?.map(barcode => ({
      id: barcode.id,
      barcode: barcode.barcode,
      status: barcode.activated === 2 ? 'active' : 'available',
      assigned_date: barcode.created.toISOString(),
    })) || [],
    timestamps: {
      created: member.created.toISOString(),
      updated: member.updated.toISOString(),
    },
  };
}

export function generateStatsData(members: FnMemberWithRelations[]): APIStatsData {
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.deceased !== 'yes').length;
  const deceasedMembers = totalMembers - activeMembers;
  
  // Reserve status counts
  const onReserveCount = members.filter(m => 
    m.profile?.[0]?.o_r_status === 'onreserve'
  ).length;
  const offReserveCount = totalMembers - onReserveCount;
  
  // Community distribution
  const communityCounts = members.reduce((acc, member) => {
    const community = member.profile?.[0]?.community || 'Unknown';
    acc[community] = (acc[community] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const communities = Object.entries(communityCounts).map(([name, count]) => ({
    name,
    member_count: count,
    percentage: Math.round((count / totalMembers) * 100 * 100) / 100, // 2 decimal places
  })).sort((a, b) => b.member_count - a.member_count);
  
  // Age distribution
  const ageGroups = {
    '0-17': 0,
    '18-25': 0,
    '26-35': 0,
    '36-45': 0,
    '46-55': 0,
    '56-65': 0,
    '65+': 0
  };
  
  members.forEach(member => {
    if (member.birthdate) {
      const age = differenceInYears(new Date(), new Date(member.birthdate));
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
    percentage: Math.round((count / totalMembers) * 100 * 100) / 100,
  }));
  
  // Recent additions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentAdditions = members.filter(m => 
    new Date(m.created) > thirtyDaysAgo
  ).length;
  
  // Barcode stats
  const totalBarcodesAssigned = members.reduce((total, member) => 
    total + (member.barcode?.length || 0), 0
  );
  
  return {
    total_members: totalMembers,
    active_members: activeMembers,
    deceased_members: deceasedMembers,
    on_reserve_count: onReserveCount,
    off_reserve_count: offReserveCount,
    communities,
    age_distribution: ageDistribution,
    recent_additions: recentAdditions,
    total_barcodes_assigned: totalBarcodesAssigned,
    available_barcodes: 0, // This would need to be fetched separately
    last_updated: new Date().toISOString(),
  };
}