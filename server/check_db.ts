import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function check() {
  const cols = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_name = 'document_masterlist'
  `);
  console.dir(cols.rows.map((r: any) => r.column_name), { maxArrayLength: null });
  process.exit(0);
}

check();
