/**
 * Portal Sync Actions
 * 
 * Server actions for syncing data between Master Database and TCN Member Portal
 */
'use server';

import prisma from '@/lib/prisma';
import {
  testConnection,
  pullFromPortal,
  batchSyncToPortal,
  pushMember,
  markMemberDeceased,
  isSyncConfigured,
} from './client';
import type { SyncItem, PulledProfile, PulledFamily, SyncLog } from './types';

// ==================== AGE FILTER HELPER ====================

/**
 * Calculate age from birthdate
 */
function calculateAge(birthdate: Date): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check if member is 18 years or older (eligible for portal sync)
 */
function isEligibleForSync(birthdate: Date): boolean {
  return calculateAge(birthdate) >= 18;
}

// ==================== STATUS & CONNECTION ====================

export async function checkSyncStatus() {
  if (!isSyncConfigured()) {
    return {
      configured: false,
      connected: false,
      message: 'Portal sync not configured. Add PORTAL_API_KEY and PORTAL_API_URL to environment.',
    };
  }

  const result = await testConnection();
  return {
    configured: true,
    connected: result.connected,
    message: result.message,
    portalStats: result.portalStats,
  };
}

// ==================== PUSH TO PORTAL ====================

/**
 * Push a single member to the portal
 */
export async function syncMemberToPortal(memberId: string) {
  const member = await prisma.fnmember.findUnique({
    where: { id: memberId },
    include: {
      profile: true,
      barcode: true,
      family: true,
    },
  });

  if (!member) {
    return { success: false, error: 'Member not found' };
  }

  // Only sync members 18 years or older
  if (!isEligibleForSync(member.birthdate)) {
    return { 
      success: false, 
      error: `Member ${member.first_name} ${member.last_name} is under 18 and not eligible for portal sync` 
    };
  }

  const profile = member.profile[0];
  const family = member.family[0];
  const barcode = member.barcode[0];

  const syncData = {
    id: member.id,
    created: member.created.toISOString(),
    updated: member.updated.toISOString(),
    birthdate: member.birthdate.toISOString(),
    first_name: member.first_name,
    last_name: member.last_name,
    t_number: member.t_number,
    deceased: member.deceased,
    activated: member.activated,
    ...(profile && {
      profile: {
        id: profile.id,
        created: profile.created.toISOString(),
        updated: profile.updated.toISOString(),
        gender: profile.gender,
        o_r_status: profile.o_r_status,
        community: profile.community,
        address: profile.address,
        phone_number: profile.phone_number,
        email: profile.email,
        image_url: profile.image_url,
      },
    }),
    ...(barcode && {
      barcode: {
        id: barcode.id,
        created: barcode.created.toISOString(),
        updated: barcode.updated.toISOString(),
        barcode: barcode.barcode,
        activated: barcode.activated,
      },
    }),
    ...(family && {
      family: {
        id: family.id,
        created: family.created.toISOString(),
        updated: family.updated.toISOString(),
        spouse_fname: family.spouse_fname,
        spouse_lname: family.spouse_lname,
        dependents: family.dependents,
      },
    }),
  };

  return pushMember(syncData);
}

/**
 * Push multiple members to portal via batch sync
 */
export async function batchPushMembersToPortal(memberIds: string[]) {
  const members = await prisma.fnmember.findMany({
    where: { id: { in: memberIds } },
    include: {
      profile: true,
      barcode: true,
      family: true,
    },
  });

  // Filter to only include members 18 years or older
  const eligibleMembers = members.filter(member => isEligibleForSync(member.birthdate));
  const excludedCount = members.length - eligibleMembers.length;

  if (eligibleMembers.length === 0) {
    return {
      success: false,
      error: 'No eligible members to sync (all members are under 18)',
      data: { processed: 0, failed: 0, excluded: excludedCount },
    };
  }

  const items: SyncItem[] = eligibleMembers.map((member) => {
    const profile = member.profile[0];
    const family = member.family[0];
    const barcode = member.barcode[0];

    return {
      operation: 'UPSERT',
      model: 'fnmember',
      data: {
        id: member.id,
        created: member.created.toISOString(),
        updated: member.updated.toISOString(),
        birthdate: member.birthdate.toISOString(),
        first_name: member.first_name,
        last_name: member.last_name,
        t_number: member.t_number,
        deceased: member.deceased,
        activated: member.activated,
        profile: profile ? {
          id: profile.id,
          created: profile.created.toISOString(),
          updated: profile.updated.toISOString(),
          gender: profile.gender,
          o_r_status: profile.o_r_status,
          community: profile.community,
          address: profile.address,
          phone_number: profile.phone_number,
          email: profile.email,
          image_url: profile.image_url,
        } : undefined,
        family: family ? {
          id: family.id,
          created: family.created.toISOString(),
          updated: family.updated.toISOString(),
          spouse_fname: family.spouse_fname,
          spouse_lname: family.spouse_lname,
          dependents: family.dependents,
        } : undefined,
        barcode: barcode ? {
          id: barcode.id,
          created: barcode.created.toISOString(),
          updated: barcode.updated.toISOString(),
          barcode: barcode.barcode,
          activated: barcode.activated,
        } : undefined,
      },
    };
  });

  const result = await batchSyncToPortal(items);
  
  // Add excluded count to the result
  if (result.data) {
    result.data.excluded = excludedCount;
  }
  if (excludedCount > 0) {
    result.message = `${result.message || 'Batch sync completed'}. ${excludedCount} member(s) under 18 excluded from sync.`;
  }
  
  return result;
}

/**
 * Push all members to portal (full sync)
 * Note: Portal has rate limit of 10 requests/minute for batch endpoint
 */
export async function fullPushToPortal(batchSize: number = 100) {
  // Calculate the date 18 years ago for filtering
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  // Count only eligible members (18+)
  const totalEligibleMembers = await prisma.fnmember.count({
    where: {
      birthdate: { lte: eighteenYearsAgo }
    }
  });
  
  const totalAllMembers = await prisma.fnmember.count();
  const excludedUnder18 = totalAllMembers - totalEligibleMembers;

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  let batchCount = 0;

  // Helper to delay between batches (rate limit: 10 req/min = 1 req per 6 seconds)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Process in batches - only members 18 years or older
  for (let skip = 0; skip < totalEligibleMembers; skip += batchSize) {
    // Add delay between batches to respect rate limit (7 seconds to be safe)
    if (batchCount > 0) {
      await delay(7000);
    }
    batchCount++;

    const members = await prisma.fnmember.findMany({
      where: {
        birthdate: { lte: eighteenYearsAgo }
      },
      skip,
      take: batchSize,
      include: {
        profile: true,
        barcode: true,
        family: true,
      },
    });

    const items: SyncItem[] = members.map((member) => ({
      operation: 'UPSERT',
      model: 'fnmember',
      data: {
        id: member.id,
        created: member.created.toISOString(),
        updated: member.updated.toISOString(),
        birthdate: member.birthdate.toISOString(),
        first_name: member.first_name,
        last_name: member.last_name,
        t_number: member.t_number,
        deceased: member.deceased,
        activated: member.activated,
        profile: member.profile[0] ? {
          id: member.profile[0].id,
          created: member.profile[0].created.toISOString(),
          updated: member.profile[0].updated.toISOString(),
          gender: member.profile[0].gender,
          o_r_status: member.profile[0].o_r_status,
          community: member.profile[0].community,
          address: member.profile[0].address,
          phone_number: member.profile[0].phone_number,
          email: member.profile[0].email,
          image_url: member.profile[0].image_url,
        } : undefined,
        family: member.family[0] ? {
          id: member.family[0].id,
          created: member.family[0].created.toISOString(),
          updated: member.family[0].updated.toISOString(),
          spouse_fname: member.family[0].spouse_fname,
          spouse_lname: member.family[0].spouse_lname,
          dependents: member.family[0].dependents,
        } : undefined,
        barcode: member.barcode[0] ? {
          id: member.barcode[0].id,
          created: member.barcode[0].created.toISOString(),
          updated: member.barcode[0].updated.toISOString(),
          barcode: member.barcode[0].barcode,
          activated: member.barcode[0].activated,
        } : undefined,
      },
    }));

    const result = await batchSyncToPortal(items);

    if (result.success && result.data) {
      processed += result.data.processed;
      failed += result.data.failed;
      // Capture individual item errors from the portal response
      if (result.data.errors && result.data.errors.length > 0) {
        for (const err of result.data.errors) {
          const member = members[err.index];
          errors.push(`Member ${member?.first_name} ${member?.last_name} (${member?.t_number}): ${err.error}`);
        }
      }
    } else {
      failed += items.length;
      errors.push(result.error || 'Unknown error');
    }
  }

  return {
    success: processed > 0, // Success if any members were synced
    message: failed === 0 
      ? `Full sync completed: ${processed} members (18+) synced successfully. ${excludedUnder18} members under 18 excluded.`
      : `Full sync completed: ${processed} synced, ${failed} failed. ${excludedUnder18} members under 18 excluded.`,
    data: { processed, failed, total: totalEligibleMembers, excluded: excludedUnder18, errors },
  };
}

/**
 * Incremental sync - only push members updated since a given date
 * This is much faster than full sync and won't duplicate profile/family data
 * 
 * @param since - Only sync members updated after this date
 * @param includeRelations - Whether to include profile/family/barcode data (default: false for member-only sync)
 * @param batchSize - Number of members per batch (default: 100)
 */
export async function incrementalPushToPortal(
  since: Date,
  includeRelations: boolean = false,
  batchSize: number = 100
) {
  // Calculate the date 18 years ago for filtering
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  // Find members updated since the given date who are 18+
  const updatedMembers = await prisma.fnmember.findMany({
    where: {
      birthdate: { lte: eighteenYearsAgo },
      updated: { gt: since }
    },
    include: includeRelations ? {
      profile: true,
      barcode: true,
      family: true,
    } : undefined,
    orderBy: { updated: 'asc' },
  });

  if (updatedMembers.length === 0) {
    return {
      success: true,
      message: 'No members have been updated since the specified date.',
      data: { processed: 0, failed: 0, total: 0 },
    };
  }

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  let batchCount = 0;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Process in batches
  for (let i = 0; i < updatedMembers.length; i += batchSize) {
    if (batchCount > 0) {
      await delay(7000); // Rate limit
    }
    batchCount++;

    const batch = updatedMembers.slice(i, i + batchSize);

    const items: SyncItem[] = batch.map((member) => {
      // Base member data (always included)
      const data: Record<string, any> = {
        id: member.id,
        created: member.created.toISOString(),
        updated: member.updated.toISOString(),
        birthdate: member.birthdate.toISOString(),
        first_name: member.first_name,
        last_name: member.last_name,
        t_number: member.t_number,
        deceased: member.deceased,
        activated: member.activated,
      };

      // Only include relations if requested (to avoid duplicating portal-edited data)
      if (includeRelations && member.profile) {
        const profile = (member.profile as any)[0];
        if (profile) {
          data.profile = {
            id: profile.id,
            fnmemberId: member.id, // Include fnmemberId for proper upsert on portal
            created: profile.created.toISOString(),
            updated: profile.updated.toISOString(),
            gender: profile.gender,
            o_r_status: profile.o_r_status,
            community: profile.community,
            address: profile.address,
            phone_number: profile.phone_number,
            email: profile.email,
            image_url: profile.image_url,
          };
        }
      }

      if (includeRelations && member.barcode) {
        const barcode = (member.barcode as any)[0];
        if (barcode) {
          data.barcode = {
            id: barcode.id,
            fnmemberId: member.id,
            created: barcode.created.toISOString(),
            updated: barcode.updated.toISOString(),
            barcode: barcode.barcode,
            activated: barcode.activated,
          };
        }
      }

      if (includeRelations && member.family) {
        const family = (member.family as any)[0];
        if (family) {
          data.family = {
            id: family.id,
            fnmemberId: member.id,
            created: family.created.toISOString(),
            updated: family.updated.toISOString(),
            spouse_fname: family.spouse_fname,
            spouse_lname: family.spouse_lname,
            dependents: family.dependents,
          };
        }
      }

      return {
        operation: 'UPSERT' as const,
        model: 'fnmember' as const,
        data,
      };
    });

    const result = await batchSyncToPortal(items);

    if (result.success && result.data) {
      processed += result.data.processed;
      failed += result.data.failed;
      if (result.data.errors && result.data.errors.length > 0) {
        for (const err of result.data.errors) {
          const member = batch[err.index];
          errors.push(`Member ${member?.first_name} ${member?.last_name} (${member?.t_number}): ${err.error}`);
        }
      }
    } else {
      failed += items.length;
      errors.push(result.error || 'Unknown error');
    }
  }

  return {
    success: processed > 0,
    message: failed === 0
      ? `Incremental sync completed: ${processed} updated members synced successfully.`
      : `Incremental sync completed: ${processed} synced, ${failed} failed.`,
    data: { processed, failed, total: updatedMembers.length, errors },
  };
}

/**
 * Push only member core data (no profile/family) to avoid overwriting portal edits
 * Useful for syncing newly added members or member field updates only
 */
export async function pushMemberOnlyToPortal(batchSize: number = 100) {
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  const totalEligibleMembers = await prisma.fnmember.count({
    where: { birthdate: { lte: eighteenYearsAgo } }
  });

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  let batchCount = 0;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let skip = 0; skip < totalEligibleMembers; skip += batchSize) {
    if (batchCount > 0) {
      await delay(7000);
    }
    batchCount++;

    const members = await prisma.fnmember.findMany({
      where: { birthdate: { lte: eighteenYearsAgo } },
      skip,
      take: batchSize,
      include: {
        barcode: true, // Include barcode since it's managed by master DB
      },
    });

    const items: SyncItem[] = members.map((member) => ({
      operation: 'UPSERT',
      model: 'fnmember',
      data: {
        id: member.id,
        created: member.created.toISOString(),
        updated: member.updated.toISOString(),
        birthdate: member.birthdate.toISOString(),
        first_name: member.first_name,
        last_name: member.last_name,
        t_number: member.t_number,
        deceased: member.deceased,
        activated: member.activated,
        // Include barcode since it's assigned by master DB
        barcode: member.barcode[0] ? {
          id: member.barcode[0].id,
          fnmemberId: member.id,
          created: member.barcode[0].created.toISOString(),
          updated: member.barcode[0].updated.toISOString(),
          barcode: member.barcode[0].barcode,
          activated: member.barcode[0].activated,
        } : undefined,
        // Explicitly NOT including profile and family - those are managed by portal
      },
    }));

    const result = await batchSyncToPortal(items);

    if (result.success && result.data) {
      processed += result.data.processed;
      failed += result.data.failed;
      if (result.data.errors && result.data.errors.length > 0) {
        for (const err of result.data.errors) {
          const member = members[err.index];
          errors.push(`Member ${member?.first_name} ${member?.last_name} (${member?.t_number}): ${err.error}`);
        }
      }
    } else {
      failed += items.length;
      errors.push(result.error || 'Unknown error');
    }
  }

  return {
    success: processed > 0,
    message: failed === 0
      ? `Member-only sync completed: ${processed} members synced (profile/family excluded).`
      : `Member-only sync completed: ${processed} synced, ${failed} failed.`,
    data: { processed, failed, total: totalEligibleMembers, errors },
  };
}

// ==================== PULL FROM PORTAL ====================

/**
 * Pull and apply profile updates from portal
 */
export async function pullAndApplyProfileUpdates(since?: Date) {
  const result = await pullFromPortal({ models: ['Profile'], since, limit: 500 });

  if (!result.success || !result.data?.profiles) {
    return { success: false, error: result.error, updated: 0 };
  }

  let updated = 0;
  const errors: string[] = [];

  for (const profile of result.data.profiles) {
    try {
      await applyProfileUpdate(profile);
      updated++;
    } catch (error) {
      errors.push(`Profile ${profile.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    message: `Applied ${updated} profile updates`,
    data: { updated, failed: errors.length, errors },
    hasMore: result.data.pagination.hasMore,
  };
}

/**
 * Apply a single profile update from portal to master
 */
async function applyProfileUpdate(profile: PulledProfile) {
  // Find existing profile by fnmemberId
  const existingProfile = await prisma.profile.findFirst({
    where: { fnmemberId: profile.fnmemberId },
  });

  if (existingProfile) {
    // Update existing profile
    await prisma.profile.update({
      where: { id: existingProfile.id },
      data: {
        gender: profile.gender,
        o_r_status: profile.o_r_status,
        community: profile.community,
        address: profile.address,
        phone_number: profile.phone_number,
        email: profile.email,
        image_url: profile.image_url,
        updated: new Date(),
      },
    });
  } else {
    // Create new profile
    await prisma.profile.create({
      data: {
        gender: profile.gender,
        o_r_status: profile.o_r_status,
        community: profile.community,
        address: profile.address,
        phone_number: profile.phone_number,
        email: profile.email,
        image_url: profile.image_url,
        fnmemberId: profile.fnmemberId,
      },
    });
  }
}

/**
 * Pull and apply family updates from portal
 */
export async function pullAndApplyFamilyUpdates(since?: Date) {
  const result = await pullFromPortal({ models: ['Family'], since, limit: 500 });

  if (!result.success || !result.data?.families) {
    return { success: false, error: result.error, updated: 0 };
  }

  let updated = 0;
  const errors: string[] = [];

  for (const family of result.data.families) {
    try {
      await applyFamilyUpdate(family);
      updated++;
    } catch (error) {
      errors.push(`Family ${family.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    message: `Applied ${updated} family updates`,
    data: { updated, failed: errors.length, errors },
    hasMore: result.data.pagination.hasMore,
  };
}

/**
 * Apply a single family update from portal to master
 */
async function applyFamilyUpdate(family: PulledFamily) {
  const existingFamily = await prisma.family.findFirst({
    where: { fnmemberId: family.fnmemberId },
  });

  if (existingFamily) {
    await prisma.family.update({
      where: { id: existingFamily.id },
      data: {
        spouse_fname: family.spouse_fname,
        spouse_lname: family.spouse_lname,
        dependents: family.dependents,
        updated: new Date(),
      },
    });
  } else {
    await prisma.family.create({
      data: {
        spouse_fname: family.spouse_fname,
        spouse_lname: family.spouse_lname,
        dependents: family.dependents,
        fnmemberId: family.fnmemberId,
      },
    });
  }
}

/**
 * Pull and apply all member data updates from portal
 */
export async function pullAndApplyAllUpdates(since?: Date) {
  const profileResult = await pullAndApplyProfileUpdates(since);
  const familyResult = await pullAndApplyFamilyUpdates(since);

  return {
    success: profileResult.success && familyResult.success,
    message: `Sync complete: ${profileResult.data?.updated || 0} profiles, ${familyResult.data?.updated || 0} families updated`,
    data: {
      profiles: profileResult.data,
      families: familyResult.data,
    },
  };
}

// ==================== MARK DECEASED ====================

/**
 * Mark a member as deceased and sync to portal
 */
export async function markMemberDeceasedAndSync(
  memberId: string,
  deceasedDate: string
) {
  // Update locally first
  const member = await prisma.fnmember.update({
    where: { id: memberId },
    data: { deceased: deceasedDate },
  });

  // Sync to portal
  const syncResult = await markMemberDeceased(
    { memberId: member.id, t_number: member.t_number },
    deceasedDate
  );

  return {
    success: syncResult.success,
    message: syncResult.success
      ? 'Member marked deceased and synced to portal'
      : `Member marked deceased locally, but sync failed: ${syncResult.error}`,
    data: { member, syncResult },
  };
}

// ==================== SYNC STATISTICS ====================

/**
 * Get local sync statistics
 */
export async function getLocalSyncStats() {
  // Calculate the date 18 years ago for filtering
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  const [
    totalMembers,
    activatedMembers,
    pendingMembers,
    deceasedMembers,
    membersOver18,
    totalProfiles,
    totalBarcodes,
    totalFamilies,
  ] = await Promise.all([
    prisma.fnmember.count(),
    prisma.fnmember.count({ where: { activated: 'ACTIVATED' } }),
    prisma.fnmember.count({ where: { activated: 'PENDING' } }),
    prisma.fnmember.count({ where: { deceased: 'yes' } }),
    prisma.fnmember.count({ where: { birthdate: { lte: eighteenYearsAgo } } }),
    prisma.profile.count(),
    prisma.barcode.count(),
    prisma.family.count(),
  ]);

  const lastUpdatedMember = await prisma.fnmember.findFirst({
    orderBy: { updated: 'desc' },
    select: { updated: true },
  });

  const lastUpdatedProfile = await prisma.profile.findFirst({
    orderBy: { updated: 'desc' },
    select: { updated: true },
  });

  return {
    members: {
      total: totalMembers,
      activated: activatedMembers,
      pending: pendingMembers,
      notActivated: totalMembers - activatedMembers - pendingMembers,
      deceased: deceasedMembers,
      over18: membersOver18,
      under18: totalMembers - membersOver18,
    },
    profiles: totalProfiles,
    barcodes: totalBarcodes,
    families: totalFamilies,
    lastUpdated: {
      member: lastUpdatedMember?.updated?.toISOString() || null,
      profile: lastUpdatedProfile?.updated?.toISOString() || null,
    },
  };
}
