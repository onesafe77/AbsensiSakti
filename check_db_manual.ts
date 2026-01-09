
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { trainings } from './shared/schema';
import { sql } from 'drizzle-orm';

// Manual DB setup
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL missing!");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function checkData() {
    try {
        console.log("Checking DB Manual...");
        const count = await db.select({ count: sql<number>`count(*)` }).from(trainings);
        console.log("Trainings in DB:", count[0].count);

        if (Number(count[0].count) === 0) {
            console.log("DB IS EMPTY!");
        } else {
            // Fetch a sample
            const sample = await db.select().from(trainings).limit(3);
            console.log("Sample data:", JSON.stringify(sample.map(s => s.name)));
        }
        process.exit(0);
    } catch (e) {
        console.error("DB Check Failed:", e);
        process.exit(1);
    }
}

checkData();
