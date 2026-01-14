
import { db } from "../server/db";
import { rosterSchedules, leaveRosterMonitoring } from "../shared/schema";
import { sql } from "drizzle-orm";

async function checkData() {
    const rosterCount = await db.select({ count: sql<number>`count(*)` }).from(rosterSchedules);
    const monitoringCount = await db.select({ count: sql<number>`count(*)` }).from(leaveRosterMonitoring);

    console.log("Roster Count:", rosterCount[0].count);
    console.log("Monitoring Count:", monitoringCount[0].count);
    process.exit(0);
}

checkData().catch(console.error);
