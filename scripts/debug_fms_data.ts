
import * as dotenv from "dotenv";
dotenv.config();

import { sql } from "drizzle-orm";

async function main() {
    const { db } = await import("../server/db");
    const { fmsViolations } = await import("../shared/schema");

    console.log("DEBUG_START");

    const [count] = await db.select({ count: sql<number>`count(*)` }).from(fmsViolations);
    console.log(`COUNT:${count.count}`);

    const rows = await db.select().from(fmsViolations).limit(5).orderBy(fmsViolations.violationDate);
    rows.forEach(r => {
        console.log(`DATA:${r.violationDate}|${r.violationType}|${r.validationStatus}`);
    });
    console.log("DEBUG_END");
    process.exit(0);
}

main();
