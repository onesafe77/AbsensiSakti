import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function migrate() {
    try {
        console.log('Adding created_by column to sidak_rambu_sessions...');

        await db.execute(sql`
      ALTER TABLE sidak_rambu_sessions 
      ADD COLUMN IF NOT EXISTS created_by VARCHAR
    `);

        console.log('✓ Column created_by added');

        console.log('Creating index...');
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_rambu_sessions_created_by" 
      ON sidak_rambu_sessions(created_by)
    `);

        console.log('✓ Index created');

        console.log('Updating existing sessions...');
        const result = await db.execute(sql`
      UPDATE sidak_rambu_sessions 
      SET created_by = 'ADMIN' 
      WHERE created_by IS NULL
    `);

        console.log(`✓ Updated existing sessions`);
        console.log('\n✅ Migration completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
