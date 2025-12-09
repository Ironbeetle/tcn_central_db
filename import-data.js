const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function importCSV(filename, model, transform = (row) => row) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filename)
      .pipe(csv())
      .on('data', (data) => results.push(transform(data)))
      .on('end', async () => {
        try {
          for (const row of results) {
            await prisma[model].create({ data: row });
          }
          console.log(`✅ Imported ${results.length} records into ${model}`);
          resolve();
        } catch (error) {
          console.error(`❌ Error importing ${model}:`, error);
          reject(error);
        }
      });
  });
}

async function main() {
  try {
    // Import fnmember data
    await importCSV('./fnmember.csv', 'fnmember', (row) => ({
      birthdate: new Date(row.birthdate),
      first_name: row.first_name,
      last_name: row.last_name,
      t_number: row.t_number,
      option: row.option || 'none',
      deceased: row.deceased || null
    }));

    // Import profile data
    await importCSV('./profile.csv', 'profile', (row) => ({
      gender: row.gender,
      o_r_status: row.o_r_status,
      community: row.community,
      address: row.address,
      phone_number: row.phone_number,
      email: row.email,
      image_url: row.image_url || null,
      fnmemberId: row.fnmemberId || null
    }));

    // Import barcode data
    await importCSV('./barcode.csv', 'barcode', (row) => ({
      barcode: row.barcode,
      activated: parseInt(row.activated) || 1,
      fnmemberId: row.fnmemberId || null
    }));

    // Import family data
    await importCSV('./family.csv', 'family', (row) => ({
      spouse_fname: row.spouse_fname || null,
      spouse_lname: row.spouse_lname || null,
      dependents: parseInt(row.dependents) || 0,
      fnmemberId: row.fnmemberId || null
    }));

    console.log('🎉 All data imported successfully!');
  } catch (error) {
    console.error('💥 Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();