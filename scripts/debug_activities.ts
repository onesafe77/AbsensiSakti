
import * as dotenv from "dotenv";
dotenv.config({ path: "c:/OneTalent/.env" });
import { db } from "../server/db";
import { activityEvents } from "../shared/schema";
import { desc } from "drizzle-orm";

async function checkActivities() {
    console.log("Checking activity_events table...");
    try {
        const events = await db.select().from(activityEvents).orderBy(desc(activityEvents.createdAt));
        console.log(`Found ${events.length} events.`);
        events.forEach(e => {
            console.log(`ID: ${e.id} (Type: ${typeof e.id}), UserID: ${e.userId}, Title: ${e.title}`);
        });
    } catch (err: any) {
        console.error("Query failed:", err.message);
    }
    process.exit(0);
}

checkActivities();
