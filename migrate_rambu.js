import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

async function runMigration() {
    const client = new Client({ connectionString });

    try {
        console.log('🔗 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        // Step 1: Add column
        console.log('📝 Adding created_by column...');
        await client.query(`
      ALTER TABLE sidak_rambu_sessions 
      ADD COLUMN IF NOT EXISTS created_by VARCHAR
    `);
        console.log('✅ Column added\n');

        // Step 2: Create index
        console.log('📊 Creating index...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rambu_sessions_created_by" 
      ON sidak_rambu_sessions(created_by)
    `);
        console.log('✅ Index created\n');

        // Step 3: Update existing records
        console.log('🔄 Updating existing sessions...');
        const result = await client.query(`
      UPDATE sidak_rambu_sessions 
      SET created_by = 'ADMIN' 
      WHERE created_by IS NULL
    `);
        console.log(`✅ Updated ${result.rowCount} existing sessions\n`);

        // Step 4: Verify
        console.log('🔍 Verifying migration...');
        const verify = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(created_by) as with_created_by 
      FROM sidak_rambu_sessions
    `);
        console.log(`📊 Total sessions: ${verify.rows[0].total}`);
        console.log(`📊 Sessions with created_by: ${verify.rows[0].with_created_by}\n`);

        console.log('🎉 Migration completed successfully!');
        console.log('✨ Rambu data should now appear in the recap page!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
