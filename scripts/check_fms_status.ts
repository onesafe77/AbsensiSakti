
import * as dotenv from "dotenv";
dotenv.config();
import { sql } from "drizzle-orm";

async function main() {
    const { db } = await import("../server/db");
    const { fmsViolations } = await import("../shared/schema");

    console.log("Checking ALL unique validationStatus values in DB...");

    const statuses = await db.select({
        status: fmsViolations.validationStatus,
        count: sql<number>`count(*)::integer`
    })
        .from(fmsViolations)
        .groupBy(fmsViolations.validationStatus);

    console.table(statuses);

    // Also check sample raw data
    console.log("\nSample 5 rows (all columns):");
    const samples = await db.select().from(fmsViolations).limit(5);
    console.log(JSON.stringify(samples, null, 2));

    process.exit(0);
}

main().catch(console.error);
