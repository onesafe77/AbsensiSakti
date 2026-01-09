import 'dotenv/config';
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log("Starting DB Fix for Sidak Rambu...");

    try {
        // 1. Add activity_photos to sessions
        console.log("Adding activity_photos column to sidak_rambu_sessions...");
        await sql`
      ALTER TABLE sidak_rambu_sessions 
      ADD COLUMN IF NOT EXISTS activity_photos text[];
    `;

        // 2. Add ordinal to observations
        console.log("Adding ordinal column to sidak_rambu_observations...");
        await sql`
      ALTER TABLE sidak_rambu_observations 
      ADD COLUMN IF NOT EXISTS ordinal integer NOT NULL DEFAULT 0;
    `;

        // 3. Add ordinal to observers
        console.log("Adding ordinal column to sidak_rambu_observers...");
        await sql`
      ALTER TABLE sidak_rambu_observers 
      ADD COLUMN IF NOT EXISTS ordinal integer NOT NULL DEFAULT 0;
    `;

        console.log("✅ DB Fix completed successfully!");
    } catch (error) {
        console.error("❌ DB Fix failed:", error);
    }
}

main();
