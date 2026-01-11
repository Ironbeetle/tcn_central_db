#!/usr/bin/env tsx
/**
 * Council Member Import Script
 * 
 * This script imports council members from the council_memberlist.csv file
 * and populates the Council_Member table in the governance schema.
 * 
 * IMPORTANT: Before running this script, ensure a Current_Council record exists.
 * The user should create the Current_Council entry manually through the UI first,
 * then run this script to import members linked to that council.
 * 
 * CSV Format:
 * position,first_name,last_name,portfolios,email,phone,bio,image_url
 * 
 * Usage: npx tsx scripts/import-council-members.ts
 * 
 * Note: Run `npx prisma generate` and `npx prisma db push` first to ensure
 * the Council_Member table exists in the database.
 */

import { PrismaClient, Positions, Portfolios } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

// Valid positions and portfolios for validation
const VALID_POSITIONS: Positions[] = ['CHIEF', 'COUNCILLOR']
const VALID_PORTFOLIOS: Portfolios[] = [
  'TREATY',
  'HEALTH',
  'EDUCATION',
  'HOUSING',
  'ECONOMIC_DEVELOPMENT',
  'ENVIRONMENT',
  'PUBLIC_SAFETY',
  'LEADERSHIP'
]

interface CouncilMemberCSV {
  position: string
  first_name: string
  last_name: string
  portfolios: string
  email: string
  phone: string
  bio: string
  image_url: string
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

function parsePortfolios(portfolioStr: string): Portfolios[] {
  // Handle format: [TREATY,HEALTH,EDUCATION] or TREATY,HEALTH,EDUCATION
  const cleaned = portfolioStr.replace(/^\[/, '').replace(/\]$/, '').trim()
  
  if (!cleaned) return []
  
  const portfolios = cleaned.split(',').map(p => p.trim()) as Portfolios[]
  
  // Validate each portfolio
  const validPortfolios = portfolios.filter(p => VALID_PORTFOLIOS.includes(p))
  
  if (validPortfolios.length !== portfolios.length) {
    const invalid = portfolios.filter(p => !VALID_PORTFOLIOS.includes(p))
    console.warn(`   ⚠️  Invalid portfolios ignored: ${invalid.join(', ')}`)
  }
  
  return validPortfolios
}

function validatePosition(position: string): Positions | null {
  const upperPosition = position.toUpperCase() as Positions
  if (VALID_POSITIONS.includes(upperPosition)) {
    return upperPosition
  }
  return null
}

async function importCouncilMembers() {
  try {
    console.log('🔌 Connecting to database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!\n')
    
    // Check for existing Current_Council
    console.log('📋 Checking for existing Current_Council...')
    const currentCouncil = await prisma.current_Council.findFirst({
      orderBy: { council_start: 'desc' }
    })
    
    if (!currentCouncil) {
      console.log('\n❌ No Current_Council found!')
      console.log('   Please create a Current_Council entry through the UI first.')
      console.log('   Go to: Chief & Council Portal → Council Profile Editor → Create Council Term')
      console.log('\n   After creating the council term, run this script again.')
      return
    }
    
    console.log(`✅ Found Current_Council: ${currentCouncil.id}`)
    console.log(`   Term: ${currentCouncil.council_start.toISOString().split('T')[0]} to ${currentCouncil.council_end.toISOString().split('T')[0]}\n`)
    
    // Read CSV file
    const csvPath = join(process.cwd(), 'council_memberlist.csv')
    console.log(`📄 Reading CSV file: council_memberlist.csv`)
    
    let fileContent: string
    try {
      fileContent = await readFile(csvPath, 'utf-8')
    } catch (error) {
      console.log('\n❌ Could not read council_memberlist.csv')
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
    
    // Check for existing members to avoid duplicates
    const existingMembers = await prisma.council_Member.findMany({
      where: { councilId: currentCouncil.id },
      select: { email: true, first_name: true, last_name: true }
    })
    const existingEmails = new Set(existingMembers.map(m => m.email.toLowerCase()))
    console.log(`📊 Found ${existingMembers.length} existing members in this council\n`)
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const values = parseCSVLine(row)
      
      // Map to object
      const member: CouncilMemberCSV = {
        position: values[0] || '',
        first_name: values[1] || '',
        last_name: values[2] || '',
        portfolios: values[3] || '',
        email: values[4] || '',
        phone: values[5] || '',
        bio: values[6] || '',
        image_url: values[7] || ''
      }
      
      const displayName = `${member.first_name} ${member.last_name}`
      console.log(`👤 Processing: ${displayName}`)
      
      // Validate required fields
      if (!member.first_name || !member.last_name) {
        console.log(`   ❌ Skipping - missing name`)
        errorCount++
        continue
      }
      
      if (!member.email) {
        console.log(`   ❌ Skipping - missing email`)
        errorCount++
        continue
      }
      
      // Check for duplicate
      if (existingEmails.has(member.email.toLowerCase())) {
        console.log(`   ⏭️  Skipping - already exists (${member.email})`)
        skipCount++
        continue
      }
      
      // Validate position
      const position = validatePosition(member.position)
      if (!position) {
        console.log(`   ❌ Skipping - invalid position: ${member.position}`)
        errorCount++
        continue
      }
      
      // Parse portfolios
      const portfolios = parsePortfolios(member.portfolios)
      
      // Create the council member
      try {
        await prisma.council_Member.create({
          data: {
            position: position,
            first_name: member.first_name.trim(),
            last_name: member.last_name.trim(),
            portfolios: portfolios,
            email: member.email.trim().toLowerCase(),
            phone: member.phone.trim(),
            bio: member.bio?.trim() || null,
            image_url: member.image_url?.trim() || null,
            councilId: currentCouncil.id
          }
        })
        
        console.log(`   ✅ Created: ${displayName} (${position})`)
        console.log(`      Portfolios: ${portfolios.length > 0 ? portfolios.join(', ') : 'None'}`)
        successCount++
        existingEmails.add(member.email.toLowerCase()) // Prevent duplicates within same run
        
      } catch (error) {
        console.log(`   ❌ Error creating member: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errorCount++
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary')
    console.log('='.repeat(50))
    console.log(`   ✅ Successfully created: ${successCount}`)
    console.log(`   ⏭️  Skipped (duplicates): ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📋 Total processed: ${dataRows.length}`)
    console.log('='.repeat(50))
    
    if (successCount > 0) {
      console.log('\n🎉 Import completed! Council members have been added to the database.')
      console.log('   You can view them in the Council Profile Editor.')
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed.')
  }
}

// Run the import
importCouncilMembers()
