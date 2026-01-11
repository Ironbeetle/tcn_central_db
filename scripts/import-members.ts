#!/usr/bin/env tsx
/**
 * FN Member Import Script
 * 
 * This script imports First Nation members from the memberlistNEW.csv file
 * and populates the fnmember table in the fnmemberlist schema.
 * 
 * CSV Format:
 * id,created,updated,birthdate,first_name,last_name,t_number,activated,deceased
 * 
 * Usage: npx tsx scripts/import-members.ts
 * 
 * Options:
 *   --use-csv-ids    Use the IDs from the CSV file instead of generating new ones
 *   --dry-run        Preview what would be imported without making changes
 * 
 * Note: Run `npx prisma generate` and `npx prisma db push` first to ensure
 * the fnmember table exists in the database.
 */

import { PrismaClient, ActivationStatus } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

// Valid activation statuses
const VALID_ACTIVATION_STATUS: ActivationStatus[] = ['NONE', 'PENDING', 'ACTIVATED']

interface MemberCSV {
  id: string
  created: string
  updated: string
  birthdate: string
  first_name: string
  last_name: string
  t_number: string
  activated: string
  deceased: string
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  
  return result
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  // Handle various date formats
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return null
  }
  return date
}

function parseActivationStatus(status: string): ActivationStatus {
  const upperStatus = status?.toUpperCase() as ActivationStatus
  if (VALID_ACTIVATION_STATUS.includes(upperStatus)) {
    return upperStatus
  }
  return 'NONE' // Default
}

function parseDeceased(deceased: string): string | null {
  if (!deceased || deceased.toLowerCase() === 'no' || deceased === '') {
    return null
  }
  return deceased
}

async function importMembers() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const useCSVIds = args.includes('--use-csv-ids')
  const dryRun = args.includes('--dry-run')
  
  try {
    console.log('🔌 Connecting to database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!\n')
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }
    
    if (useCSVIds) {
      console.log('📋 Using IDs from CSV file\n')
    }
    
    // Read CSV file
    const csvPath = join(process.cwd(), 'memberlistNEW.csv')
    console.log(`📄 Reading CSV file: memberlistNEW.csv`)
    
    let fileContent: string
    try {
      fileContent = await readFile(csvPath, 'utf-8')
    } catch (error) {
      console.log('\n❌ Could not read memberlistNEW.csv')
      console.log('   Make sure the file exists in the project root directory.')
      return
    }
    
    // Parse CSV
    const lines = fileContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      console.log('❌ CSV file is empty or has no data rows.')
      return
    }
    
    // Get headers
    const headers = parseCSVLine(lines[0])
    console.log(`   Headers: ${headers.join(', ')}`)
    
    // Parse data rows
    const dataRows = lines.slice(1)
    console.log(`   Found ${dataRows.length} member rows\n`)
    
    // Check for existing members to avoid duplicates (by t_number which is unique)
    console.log('📊 Fetching existing members from database...')
    const existingMembers = await prisma.fnmember.findMany({
      select: { t_number: true, id: true }
    })
    const existingTNumbers = new Set(existingMembers.map(m => m.t_number))
    const existingIds = new Set(existingMembers.map(m => m.id))
    console.log(`   Found ${existingMembers.length} existing members in database\n`)
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    // Process each row
    console.log('Processing members...\n')
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row.trim()) continue
      
      const values = parseCSVLine(row)
      
      // Map values to headers
      const member: MemberCSV = {
        id: values[0] || '',
        created: values[1] || '',
        updated: values[2] || '',
        birthdate: values[3] || '',
        first_name: values[4] || '',
        last_name: values[5] || '',
        t_number: values[6] || '',
        activated: values[7] || '',
        deceased: values[8] || ''
      }
      
      const displayName = `${member.first_name} ${member.last_name}`
      const rowNum = i + 2 // +2 because of header and 0-index
      
      // Validate required fields
      if (!member.first_name || !member.last_name) {
        console.log(`   Row ${rowNum}: ❌ Skipping - missing name`)
        errors.push(`Row ${rowNum}: Missing name`)
        errorCount++
        continue
      }
      
      if (!member.t_number) {
        console.log(`   Row ${rowNum}: ❌ Skipping ${displayName} - missing t_number`)
        errors.push(`Row ${rowNum}: ${displayName} - Missing t_number`)
        errorCount++
        continue
      }
      
      if (!member.birthdate) {
        console.log(`   Row ${rowNum}: ❌ Skipping ${displayName} - missing birthdate`)
        errors.push(`Row ${rowNum}: ${displayName} - Missing birthdate`)
        errorCount++
        continue
      }
      
      // Parse birthdate
      const birthdate = parseDate(member.birthdate)
      if (!birthdate) {
        console.log(`   Row ${rowNum}: ❌ Skipping ${displayName} - invalid birthdate: ${member.birthdate}`)
        errors.push(`Row ${rowNum}: ${displayName} - Invalid birthdate: ${member.birthdate}`)
        errorCount++
        continue
      }
      
      // Check for duplicate t_number
      if (existingTNumbers.has(member.t_number)) {
        console.log(`   Row ${rowNum}: ⏭️  Skipping ${displayName} - t_number ${member.t_number} already exists`)
        skipCount++
        continue
      }
      
      // Check for duplicate ID if using CSV IDs
      if (useCSVIds && member.id && existingIds.has(member.id)) {
        console.log(`   Row ${rowNum}: ⏭️  Skipping ${displayName} - ID ${member.id} already exists`)
        skipCount++
        continue
      }
      
      // Prepare data
      const activationStatus = parseActivationStatus(member.activated)
      const deceased = parseDeceased(member.deceased)
      
      // Parse created/updated dates or use current time
      const created = parseDate(member.created) || new Date()
      const updated = parseDate(member.updated) || new Date()
      
      if (dryRun) {
        console.log(`   Row ${rowNum}: 🔍 Would create: ${displayName} (T#: ${member.t_number})`)
        successCount++
        existingTNumbers.add(member.t_number) // Track within run
        continue
      }
      
      // Create the member
      try {
        const createData: any = {
          first_name: member.first_name.trim(),
          last_name: member.last_name.trim(),
          t_number: member.t_number.trim(),
          birthdate: birthdate,
          activated: activationStatus,
          deceased: deceased,
          created: created,
          updated: updated
        }
        
        // Optionally use CSV ID
        if (useCSVIds && member.id) {
          createData.id = member.id
        }
        
        await prisma.fnmember.create({
          data: createData
        })
        
        console.log(`   Row ${rowNum}: ✅ Created: ${displayName} (T#: ${member.t_number})`)
        successCount++
        existingTNumbers.add(member.t_number) // Prevent duplicates within same run
        if (useCSVIds && member.id) {
          existingIds.add(member.id)
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.log(`   Row ${rowNum}: ❌ Error creating ${displayName}: ${errorMsg}`)
        errors.push(`Row ${rowNum}: ${displayName} - ${errorMsg}`)
        errorCount++
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary')
    console.log('='.repeat(50))
    if (dryRun) {
      console.log('   🔍 DRY RUN - No changes were made')
      console.log(`   📋 Would create: ${successCount}`)
    } else {
      console.log(`   ✅ Successfully created: ${successCount}`)
    }
    console.log(`   ⏭️  Skipped (duplicates): ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📋 Total processed: ${dataRows.length}`)
    console.log('='.repeat(50))
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n❌ Error Details:')
      errors.forEach(err => console.log(`   • ${err}`))
    } else if (errors.length > 10) {
      console.log(`\n❌ ${errors.length} errors occurred. First 10:`)
      errors.slice(0, 10).forEach(err => console.log(`   • ${err}`))
      console.log(`   ... and ${errors.length - 10} more`)
    }
    
    if (successCount > 0 && !dryRun) {
      console.log('\n🎉 Import completed! Members have been added to the database.')
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed.')
  }
}

// Run the import
importMembers()
