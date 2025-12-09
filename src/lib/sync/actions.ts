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

  const items: SyncItem[] = members.map((member) => {
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

  return batchSyncToPortal(items);
}

/**
 * Push all members to portal (full sync)
 * Note: Portal has rate limit of 10 requests/minute for batch endpoint
 */
export async function fullPushToPortal(batchSize: number = 100) {
  const totalMembers = await prisma.fnmember.count();
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  let batchCount = 0;

  // Helper to delay between batches (rate limit: 10 req/min = 1 req per 6 seconds)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Process in batches
  for (let skip = 0; skip < totalMembers; skip += batchSize) {
    // Add delay between batches to respect rate limit (7 seconds to be safe)
    if (batchCount > 0) {
      await delay(7000);
    }
    batchCount++;

    const members = await prisma.fnmember.findMany({
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
      ? `Full sync completed: ${processed} members synced successfully`
      : `Full sync completed: ${processed} synced, ${failed} failed`,
    data: { processed, failed, total: totalMembers, errors },
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
  const [
    totalMembers,
    activatedMembers,
    pendingMembers,
    deceasedMembers,
    totalProfiles,
    totalBarcodes,
    totalFamilies,
  ] = await Promise.all([
    prisma.fnmember.count(),
    prisma.fnmember.count({ where: { activated: 'ACTIVATED' } }),
    prisma.fnmember.count({ where: { activated: 'PENDING' } }),
    prisma.fnmember.count({ where: { deceased: 'yes' } }),
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
