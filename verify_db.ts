
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function verify() {
    try {
        // 1. Check Roster Table
        try {
            await db.execute(sql`SELECT count(*) FROM sidak_roster_sessions`);
            console.log("✅ Table sidak_roster_sessions EXISTS");
        } catch (e: any) {
            console.log("❌ Table sidak_roster_sessions MISSING");
        }

        // 2. Check for Orphan Seatbelt Observers (The cause of db:push failure)
        try {
            // We check if there are observers whose session_id is not in sessions
            // Note: We use raw SQL because we want to see the bad data
            const result = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM sidak_seatbelt_observers 
        WHERE session_id NOT IN (SELECT id FROM sidak_seatbelt_sessions)
      `);
            console.log(`⚠️ Orphan Seatbelt Observers found: ${result.rows[0].count}`);
        } catch (e: any) {
            console.log("ℹ️ Could not check orphans (tables might be missing):", e.message);
        }

    } catch (error: any) {
        console.error("Critical Error:", error);
    }
    process.exit(0);
}

verify();
