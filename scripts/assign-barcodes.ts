#!/usr/bin/env tsx
/**
 * Barcode Assignment Script
 * 
 * This script assigns available barcodes to fnmembers who don't have one.
 * 
 * Barcode.activated values:
 *   1 = Available (not assigned to any member)
 *   2 = Assigned (linked to an fnmember)
 * 
 * Usage: npx tsx scripts/assign-barcodes.ts
 * 
 * Options:
 *   --dry-run    Preview assignments without making changes
 *   --limit=N    Limit the number of assignments (e.g., --limit=100)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function assignBarcodes() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitArg = args.find(arg => arg.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

  try {
    console.log('🔌 Connecting to database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!\n')

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }

    // Get members without barcodes
    console.log('📊 Finding members without barcodes...')
    const membersWithoutBarcodes = await prisma.fnmember.findMany({
      where: {
        barcode: {
          none: {}
        }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        t_number: true
      },
      orderBy: { created: 'asc' }
    })

    console.log(`   Found ${membersWithoutBarcodes.length} members without barcodes\n`)

    // Get available barcodes (activated = 1 and not assigned)
    console.log('📊 Finding available barcodes...')
    const availableBarcodes = await prisma.barcode.findMany({
      where: {
        activated: 1,
        fnmemberId: null
      },
      select: {
        id: true,
        barcode: true
      },
      orderBy: { barcode: 'asc' }
    })

    console.log(`   Found ${availableBarcodes.length} available barcodes\n`)

    if (membersWithoutBarcodes.length === 0) {
      console.log('✅ All members already have barcodes assigned!')
      return
    }

    if (availableBarcodes.length === 0) {
      console.log('❌ No available barcodes to assign!')
      console.log('   Import more barcodes using: npm run import-barcodes')
      return
    }

    // Determine how many to assign
    const membersToAssign = limit 
      ? membersWithoutBarcodes.slice(0, limit)
      : membersWithoutBarcodes
    
    const assignmentCount = Math.min(membersToAssign.length, availableBarcodes.length)
    
    console.log(`📋 Will assign ${assignmentCount} barcodes to members`)
    if (membersToAssign.length > availableBarcodes.length) {
      console.log(`   ⚠️  ${membersToAssign.length - availableBarcodes.length} members will remain without barcodes (not enough available)`)
    }
    console.log('')

    let successCount = 0
    let errorCount = 0

    // Process assignments
    console.log('Processing assignments...\n')

    for (let i = 0; i < assignmentCount; i++) {
      const member = membersToAssign[i]
      const barcode = availableBarcodes[i]
      const displayName = `${member.first_name} ${member.last_name}`

      if (dryRun) {
        console.log(`   ${i + 1}. 🔍 Would assign barcode ${barcode.barcode} to ${displayName} (T#: ${member.t_number})`)
        successCount++
        continue
      }

      try {
        // Update barcode: set fnmemberId and change activated to 2
        await prisma.barcode.update({
          where: { id: barcode.id },
          data: {
            fnmemberId: member.id,
            activated: 2
          }
        })

        console.log(`   ${i + 1}. ✅ Assigned barcode ${barcode.barcode} to ${displayName} (T#: ${member.t_number})`)
        successCount++

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.log(`   ${i + 1}. ❌ Error assigning to ${displayName}: ${errorMsg}`)
        errorCount++
      }

      // Progress indicator for large batches
      if ((i + 1) % 100 === 0) {
        console.log(`\n   ... ${i + 1}/${assignmentCount} processed ...\n`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Assignment Summary')
    console.log('='.repeat(50))
    if (dryRun) {
      console.log('   🔍 DRY RUN - No changes were made')
      console.log(`   📋 Would assign: ${successCount} barcodes`)
    } else {
      console.log(`   ✅ Successfully assigned: ${successCount}`)
      console.log(`   ❌ Errors: ${errorCount}`)
    }
    console.log(`   📋 Members still without barcodes: ${membersWithoutBarcodes.length - successCount}`)
    console.log(`   📋 Remaining available barcodes: ${availableBarcodes.length - successCount}`)
    console.log('='.repeat(50))

    if (successCount > 0 && !dryRun) {
      console.log('\n🎉 Barcode assignment completed!')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed.')
  }
}

// Run the script
assignBarcodes()
