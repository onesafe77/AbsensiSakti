import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const sql = postgres(connectionString);

async function migrate() {
    try {
        console.log('Adding created_by column...');
        await sql`ALTER TABLE sidak_rambu_sessions ADD COLUMN IF NOT EXISTS created_by VARCHAR`;
        console.log('✓ Column added');

        console.log('Creating index...');
        await sql`CREATE INDEX IF NOT EXISTS "IDX_rambu_sessions_created_by" ON sidak_rambu_sessions(created_by)`;
        console.log('✓ Index created');

        console.log('Updating existing sessions...');
        const result = await sql`UPDATE sidak_rambu_sessions SET created_by = 'ADMIN' WHERE created_by IS NULL`;
        console.log(`✓ Updated ${result.count} rows`);

        console.log('\n✅ Migration completed!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.end();
    }
}

migrate();
