
import * as dotenv from "dotenv";
dotenv.config({ path: "c:/OneTalent/.env" });
import { eq } from "drizzle-orm";

async function checkParticipants() {
    const { db } = await import("../server/db");
    const { activityEvents } = await import("../shared/schema");

    const event = await db.query.activityEvents.findFirst({
        where: eq(activityEvents.id, "4cb90db4-e433-4ce9-8389-4a512aac4ddc")
    });

    if (event) {
        console.log(`Title: ${event.title}`);
        console.log(`Participants (Raw): '${event.participants}'`);
    } else {
        console.log("Event not found");
    }
    process.exit(0);
}

checkParticipants();
