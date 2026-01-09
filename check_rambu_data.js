import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pg;

async function checkRambuData() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log('🔍 Checking Rambu data...\n');

        // Check total sessions
        const total = await client.query(`
      SELECT COUNT(*) as count FROM sidak_rambu_sessions
    `);
        console.log(`📊 Total Rambu sessions in DB: ${total.rows[0].count}`);

        // Check sessions with created_by
        const withCreatedBy = await client.query(`
      SELECT COUNT(*) as count 
      FROM sidak_rambu_sessions 
      WHERE created_by IS NOT NULL
    `);
        console.log(`✅ Sessions with created_by: ${withCreatedBy.rows[0].count}`);

        // Show sample data
        const sample = await client.query(`
      SELECT id, tanggal, shift, lokasi, total_sampel, created_by
      FROM sidak_rambu_sessions
      ORDER BY created_at DESC
      LIMIT 5
    `);

        console.log('\n📋 Sample Rambu sessions:');
        console.table(sample.rows);

        // Check if created_by column exists
        const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sidak_rambu_sessions' 
      AND column_name = 'created_by'
    `);

        if (columnCheck.rows.length > 0) {
            console.log('✅ created_by column exists');
        } else {
            console.log('❌ created_by column MISSING!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkRambuData();
