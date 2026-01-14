
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { like, or } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function check2026() {
    const { db } = await import("../server/db");
    const { rosterSchedules } = await import("../shared/schema");

    console.log("🔍 Checking for 2026 data...");
    const records = await db.select().from(rosterSchedules).where(
        or(
            like(rosterSchedules.date, "%2026%"), // YYYY-MM-DD
            like(rosterSchedules.date, "%/2026")  // DD/MM/YYYY
        )
    ).limit(5);

    if (records.length === 0) {
        console.log("⚠️ No 2026 data found.");
    } else {
        console.log("✅ Found 2026 Data:");
        records.forEach(row => {
            console.log(`- Date: "${row.date}" | Shift: ${row.shift}`);
        });
    }
    process.exit(0);
}

check2026();
