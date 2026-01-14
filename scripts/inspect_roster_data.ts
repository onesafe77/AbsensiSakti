
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Force Load Env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function inspect() {
    const { db } = await import("../server/db");
    const { rosterSchedules } = await import("../shared/schema");

    console.log("🔍 Inspecting Roster Data...");
    const sample = await db.select().from(rosterSchedules).limit(5);

    if (sample.length === 0) {
        console.log("⚠️ Roster table is empty.");
    } else {
        console.log("✅ Sample Data:");
        sample.forEach(row => {
            console.log(`- Date: "${row.date}" (Type: ${typeof row.date}) | Shift: ${row.shift} | Employee: ${row.employeeId}`);
        });
    }
    process.exit(0);
}

inspect();
