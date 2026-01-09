
import { db } from "./server/db";
import { trainings } from "./shared/schema";
import { sql } from "drizzle-orm";

async function checkData() {
    try {
        console.log("Checking DB...");
        const count = await db.select({ count: sql<number>`count(*)` }).from(trainings);
        console.log("Trainings URL in DB:", count[0].count);

        if (count[0].count == 0) {
            console.log("DB IS EMPTY!");
        } else {
            // Fetch a sample
            const sample = await db.select().from(trainings).limit(3);
            console.log("Sample data:", sample.map(s => s.name));
        }
        process.exit(0);
    } catch (e) {
        console.error("DB Check Failed:", e);
        process.exit(1);
    }
}

checkData();
