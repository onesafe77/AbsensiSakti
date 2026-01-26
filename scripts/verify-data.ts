import "dotenv/config"; // Load .env file
import pg from 'pg';
const { Pool } = pg;
import * as schema from "../shared/schema";
import { drizzle } from 'drizzle-orm/node-postgres';
import { count } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing in .env");
    process.exit(1);
}

console.log("Checking connection to:", process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@")); // Hide password

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function checkData() {
    try {
        const userCount = await db.select({ count: count() }).from(schema.users);
        const employeeCount = await db.select({ count: count() }).from(schema.employees);

        console.log("---------------------------------------------------");
        console.log(`📊 Verification Results:`);
        console.log(`👥 Users Table Count:     ${userCount[0].count}`);
        console.log(`👷 Employees Table Count: ${employeeCount[0].count}`);
        console.log("---------------------------------------------------");

        if (employeeCount[0].count > 0) {
            console.log("✅ Database HAS data. The issue might be in the API/Frontend.");
        } else {
            console.log("❌ Database is EMPTY. Check if .env matches the migrated DB.");
        }
    } catch (err) {
        console.error("❌ Failed to query database:", err);
    } finally {
        await pool.end();
    }
}

checkData();
