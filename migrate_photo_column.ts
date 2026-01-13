
import 'dotenv/config';
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function migrate() {
    try {
        console.log("Adding photo_url column to employees table...");
        await db.execute(sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;`);
        console.log("Migration successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
