import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateExistingMembers() {
  try {
    // Get all members that have a profile (meaning they're complete)
    const membersWithProfiles = await prisma.fnmember.findMany({
      where: {
        profile: {
          some: {} // Has at least one profile
        },
        activated: 'NONE' // Currently not activated
      },
      include: {
        profile: true
      }
    });

    console.log(`Found ${membersWithProfiles.length} members with profiles to activate...`);

    // Update all of them to ACTIVATED
    const result = await prisma.fnmember.updateMany({
      where: {
        profile: {
          some: {}
        },
        activated: 'NONE'
      },
      data: {
        activated: 'ACTIVATED'
      }
    });

    console.log(`✅ Successfully activated ${result.count} members!`);

    // Verify the update
    const activatedCount = await prisma.fnmember.count({
      where: {
        activated: 'ACTIVATED'
      }
    });

    console.log(`Total activated members: ${activatedCount}`);

  } catch (error) {
    console.error('Error activating members:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateExistingMembers();
