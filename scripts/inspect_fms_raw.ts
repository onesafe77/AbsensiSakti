
import * as dotenv from "dotenv";
dotenv.config();
import { sql } from "drizzle-orm";

async function main() {
    const { db } = await import("../server/db");
    const { fmsViolations } = await import("../shared/schema");

    console.log("Inspecting FMS Violations Data...");

    // Check unique validation statuses
    const statuses = await db.select({
        status: fmsViolations.validationStatus,
        count: sql<number>`count(*)::integer`
    })
        .from(fmsViolations)
        .groupBy(fmsViolations.validationStatus);

    console.table(statuses);

    // Check sample violation times
    const times = await db.select({
        time: fmsViolations.violationTime,
        // Trying simplified extract method or just viewing raw time string
        rawTime: fmsViolations.violationTime
    })
        .from(fmsViolations)
        .limit(5);

    console.table(times);

    // Check extraction logic
    const extractionTest = await db.select({
        rawTime: fmsViolations.violationTime,
        extractedHour: sql<number>`EXTRACT(HOUR FROM ${fmsViolations.violationTime}::time)`
    })
        .from(fmsViolations)
        .limit(5);

    // Note: I added ::time cast to force it if it's stored as text
    console.table(extractionTest);

    process.exit(0);
}

main().catch(console.error);
