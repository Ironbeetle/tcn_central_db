#!/usr/bin/env tsx
/**
 * Barcode Import Script
 * 
 * This script imports barcodes from CSV files in the BARCODE_REFERENCE folder
 * and populates the Barcode table in the fnmemberlist schema.
 * 
 * CSV files should contain one barcode number per line (no headers).
 * 
 * Usage: npx tsx scripts/import-barcodes.ts
 * 
 * Note: Run `npx prisma db push` or `npx prisma migrate dev` first to ensure
 * the Barcode table exists in the database.
 */

import { PrismaClient } from '@prisma/client'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

async function importBarcodes() {
  try {
    console.log('🔌 Connecting to database...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!\n')
    
    const barcodeRefDir = join(process.cwd(), 'BARCODE_REFERENCE')
    
    console.log('📂 Reading CSV files from BARCODE_REFERENCE folder...\n')
    
    // Get all CSV files in the directory
    const files = await readdir(barcodeRefDir)
    const csvFiles = files.filter(file => file.endsWith('.csv')).sort()
    
    if (csvFiles.length === 0) {
      console.log('❌ No CSV files found in BARCODE_REFERENCE folder!')
      return
    }
    
    console.log(`Found ${csvFiles.length} CSV files: ${csvFiles.join(', ')}\n`)
    
    // Get existing barcodes to avoid duplicates
    console.log('📊 Fetching existing barcodes from database...')
    const existingBarcodes = await prisma.barcode.findMany({
      select: { barcode: true }
    })
    const existingSet = new Set(existingBarcodes.map(b => b.barcode))
    console.log(`   Found ${existingSet.size} existing barcodes in database\n`)
    
    let totalBarcodes = 0
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    // Process each CSV file
    for (const csvFile of csvFiles) {
      const filePath = join(barcodeRefDir, csvFile)
      console.log(`\n📄 Processing ${csvFile}...`)
      
      const fileContent = await readFile(filePath, 'utf-8')
      
      // Parse barcodes - one per line, trim whitespace, filter empty lines
      const barcodes = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
      
      console.log(`   Found ${barcodes.length} barcodes in ${csvFile}`)
      totalBarcodes += barcodes.length
      
      // Filter out existing barcodes and prepare for batch insert
      const newBarcodes = barcodes.filter(b => !existingSet.has(b))
      const skippedInFile = barcodes.length - newBarcodes.length
      skipCount += skippedInFile
      
      if (skippedInFile > 0) {
        console.log(`   ⏭️  Skipping ${skippedInFile} barcodes (already exist)`)
      }
      
      if (newBarcodes.length === 0) {
        console.log(`   ✅ All barcodes from ${csvFile} already in database`)
        continue
      }
      
      // Process barcodes in batches using createMany for better performance
      const batchSize = 500
      for (let i = 0; i < newBarcodes.length; i += batchSize) {
        const batch = newBarcodes.slice(i, i + batchSize)
        
        try {
          const result = await prisma.barcode.createMany({
            data: batch.map(barcodeNumber => ({
              barcode: barcodeNumber,
              activated: 1, // 1 = available/not assigned
              fnmemberId: null
            })),
            skipDuplicates: true
          })
          
          successCount += result.count
          
          // Add to existing set to prevent duplicates in subsequent files
          batch.forEach(b => existingSet.add(b))
        } catch (error) {
          console.error(`   ❌ Error importing batch:`, error)
          errorCount += batch.length
        }
        
        // Progress indicator
        const processed = Math.min(i + batchSize, newBarcodes.length)
        process.stdout.write(`\r   Progress: ${processed}/${newBarcodes.length} new barcodes`)
      }
      
      console.log() // New line after progress
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary:')
    console.log('='.repeat(50))
    console.log(`   Total barcodes in CSV files: ${totalBarcodes}`)
    console.log(`   ✅ Successfully imported: ${successCount}`)
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(50))
    
    // Show total count in database
    const dbCount = await prisma.barcode.count()
    console.log(`\n📈 Total barcodes now in database: ${dbCount}`)
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importBarcodes()
