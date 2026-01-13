
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Explicitly load .env from current directory
console.log("Current working directory:", process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log("Loading .env from:", envPath, "Exists:", fs.existsSync(envPath));
dotenv.config({ path: envPath });

async function runMigration() {
    console.log("🚀 Starting manual migration...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing from environment variables!");
        process.exit(1);
    }

    // Mask the password/host part for logging
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@');
    console.log("✅ DATABASE_URL found:", maskedUrl);

    // Configure Neon
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const sqlPath = String.raw`C:\Users\SDM UTAMA\.gemini\antigravity\brain\9a80bef8-6db1-40f7-b3f9-28783a22d03e\create_si_asef_tables.sql`;

    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log("📄 Read SQL file, executing...", sql.length, "bytes");

        // Execute SQL
        await pool.query(sql);

        console.log("✅ Migration completed successfully!");
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
