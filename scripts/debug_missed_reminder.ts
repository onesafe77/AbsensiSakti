
import * as dotenv from "dotenv";
dotenv.config({ path: "c:/OneTalent/.env" });
import { eq } from "drizzle-orm";

async function checkEventStatus() {
    const { db } = await import("../server/db");
    const { activityEvents, employees } = await import("../shared/schema");

    console.log("Checking event status...");

    // Hardcoded ID from previous debug output: 4cb90db4-e433-4ce9-8389-4a512aac4ddc
    // Or just search by title "Meeting via Zoom with Pacar"
    const event = await db.query.activityEvents.findFirst({
        where: eq(activityEvents.id, "4cb90db4-e433-4ce9-8389-4a512aac4ddc")
    });

    if (!event) {
        console.log("Event not found!");
        process.exit(1);
    }

    console.log("Event Found:");
    console.log(`Title: ${event.title}`);
    console.log(`StartTime: ${event.startTime}`);
    console.log(`ReminderSent: ${event.reminderSent}`);
    console.log(`UserId: ${event.userId}`);

    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, event.userId)
    });

    if (!employee) {
        console.log("Employee not found for this user ID.");
    } else {
        console.log(`Employee Name: ${employee.name}`);
        console.log(`Phone: ${employee.phone}`);
    }

    process.exit(0);
}

checkEventStatus();
