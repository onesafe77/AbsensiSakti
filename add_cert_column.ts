import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Adding sertifikat_os_url column...');
    await db.execute(sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS sertifikat_os_url TEXT`);
    console.log('✅ Column added successfully!');
    process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
