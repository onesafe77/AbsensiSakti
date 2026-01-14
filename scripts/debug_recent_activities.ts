
import * as dotenv from "dotenv";
dotenv.config({ path: "c:/OneTalent/.env" });
import { desc } from "drizzle-orm";

async function checkRecent() {
    // Dynamic import to ensure env is loaded first
    const { db } = await import("../server/db");
    const { activityEvents } = await import("../shared/schema");

    console.log("Checking last 5 activity_events...");
    try {
        const events = await db.select().from(activityEvents).orderBy(desc(activityEvents.createdAt)).limit(5);

        if (events.length === 0) {
            console.log("No events found.");
        } else {
            events.forEach(e => {
                console.log(`\n[${e.createdAt}] ID: ${e.id}`);
                console.log(`Title: ${e.title}`);
                console.log(`User: ${e.userId}`);
                console.log(`Start: ${e.startTime} (Raw DB Value)`);
                console.log(`ReminderSent: ${e.reminderSent}`);
                console.log(`IsCompleted: ${e.isCompleted}`);
            });
        }
    } catch (err: any) {
        console.error("Query failed:", err.message);
    }
    process.exit(0);
}

checkRecent();
