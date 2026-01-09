
import fs from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

async function fix() {
    try {
        // 1. Load DATABASE_URL from .env manually
        const envPath = path.resolve(process.cwd(), ".env");
        if (!fs.existsSync(envPath)) {
            console.error("❌ .env file not found");
            process.exit(1);
        }

        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/DATABASE_URL=(.*)/);

        if (!match || !match[1]) {
            console.error("❌ DATABASE_URL not found in .env");
            process.exit(1);
        }

        const connectionString = match[1].trim().replace(/["']/g, ""); // remove quotes if any
        console.log("✅ Loaded DATABASE_URL");

        // 2. Connect to DB
        const pool = new Pool({ connectionString });

        // 3. Delete Orphans
        console.log("🧹 Cleaning up orphan sidak_seatbelt_observers...");

        // Check count before
        const countRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM sidak_seatbelt_observers 
      WHERE session_id NOT IN (SELECT id FROM sidak_seatbelt_sessions)
    `);
        const count = countRes.rows[0].count;
        console.log(`⚠️ Found ${count} orphan records.`);

        if (parseInt(count) > 0) {
            await pool.query(`
        DELETE FROM sidak_seatbelt_observers 
        WHERE session_id NOT IN (SELECT id FROM sidak_seatbelt_sessions)
      `);
            console.log("✅ Orphans deleted successfully.");
        } else {
            console.log("✅ No orphans to delete.");
        }

        await pool.end();
        console.log("✅ cleanup complete.");

    } catch (error: any) {
        console.error("❌ Fix script failed:", error);
        process.exit(1);
    }
}

fix();
