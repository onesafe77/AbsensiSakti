import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function fix() {
    console.log("Fixing database consistency...");
    try {
        // Delete orphaned sidak_seatbelt_observers
        const result = await db.execute(sql`
      DELETE FROM sidak_seatbelt_observers 
      WHERE session_id NOT IN (SELECT id FROM sidak_seatbelt_sessions)
    `);
        console.log("Deleted orphaned seatbelt observers:", result.rowCount);

        // Also check other potential orphans if needed, but error was specific to seatbelt

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fix();
