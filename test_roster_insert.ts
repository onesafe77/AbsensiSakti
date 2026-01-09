
import fs from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';
import { sidakRosterSessions } from "@shared/schema"; // Ensure this import works or mock it
// If import fails due to module complexity, I will use raw SQL

neonConfig.webSocketConstructor = ws;

async function testInsert() {
    try {
        // 1. Load DATABASE_URL
        const envPath = path.resolve(process.cwd(), ".env");
        if (!fs.existsSync(envPath)) {
            console.error("❌ .env file not found");
            process.exit(1);
        }
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/DATABASE_URL=(.*)/);
        if (!match || !match[1]) {
            console.error("❌ DATABASE_URL not found");
            process.exit(1);
        }
        const connectionString = match[1].trim().replace(/["']/g, "");

        // 2. Connect
        const pool = new Pool({ connectionString });

        // 3. Test Insert (Raw SQL to avoid Schema Type issues affecting the test)
        console.log("Testing RAW SQL Insert into sidak_roster_sessions...");
        try {
            const res = await pool.query(`
        INSERT INTO sidak_roster_sessions 
        (id, tanggal, waktu, shift, perusahaan, departemen, lokasi, total_sampel, created_at)
        VALUES 
        (gen_random_uuid(), '2026-01-08', '12:00', 'Shift 1', 'Test Corp', 'IT', 'Office', 0, NOW())
        RETURNING *
      `);
            console.log("✅ Insert Successful!", res.rows[0]);
        } catch (e: any) {
            console.error("❌ SQL Insert Failed:", e.message);
        }

        await pool.end();

    } catch (error: any) {
        console.error("Critical Error:", error);
        process.exit(1);
    }
}

testInsert();
