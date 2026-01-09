import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pg;

async function check() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();

        // Simple count
        const result = await client.query('SELECT COUNT(*) FROM sidak_rambu_sessions');
        console.log('Total Rambu sessions:', result.rows[0].count);

        // With created_by
        const withCB = await client.query('SELECT COUNT(*) FROM sidak_rambu_sessions WHERE created_by IS NOT NULL');
        console.log('With created_by:', withCB.rows[0].count);

        // Sample
        const sample = await client.query('SELECT id, tanggal, created_by FROM sidak_rambu_sessions LIMIT 3');
        console.log('Sample data:');
        sample.rows.forEach(row => {
            console.log(`  - ID: ${row.id}, Date: ${row.tanggal}, CreatedBy: ${row.created_by}`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

check();
