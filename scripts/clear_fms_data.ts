
import * as dotenv from "dotenv";
dotenv.config();
import { sql } from "drizzle-orm";

async function main() {
    const { db } = await import("../server/db");
    const { fmsViolations } = await import("../shared/schema");

    console.log("Deleting ALL FMS violations data...");

    const result = await db.delete(fmsViolations);

    console.log("Done. All FMS violations have been cleared. Please re-upload your Excel file.");

    process.exit(0);
}

main().catch(console.error);
