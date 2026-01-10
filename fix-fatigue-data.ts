
import { db } from './server/db';
import { sidakFatigueSessions } from './shared/schema';
import { sql } from 'drizzle-orm';

async function fixFatigueData() {
    console.log("Fixing NULL waktu in sidak_fatigue_sessions...");
    try {
        // raw SQL update because we need to bypass Drizzle type checks if schema expects non-null
        await db.execute(sql`UPDATE sidak_fatigue_sessions SET waktu = '00:00' WHERE waktu IS NULL`);
        console.log("Update completed.");
    } catch (err) {
        console.error("Update failed:", err);
    }
}

fixFatigueData().then(() => process.exit(0));
