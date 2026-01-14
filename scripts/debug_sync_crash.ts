
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// 1. Force Load Env BEFORE importing DB
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("ENV LOADED. DB_URL exists?", !!process.env.DATABASE_URL);

// 2. Dynamic Import
async function run() {
    const { db } = await import("../server/db");
    const { rosterSchedules, leaveRosterMonitoring, employees } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");

    console.log("🚀 Starting Debug Sync...");

    try {
        // 1. Check Roster Data
        const rosterCount = await db.selectDistinct({ employeeId: rosterSchedules.employeeId }).from(rosterSchedules);
        console.log(`✅ Found ${rosterCount.length} unique employees in Roster.`);

        // 2. Check Employee Data Match
        if (rosterCount.length > 0 && rosterCount[0].employeeId) {
            const emp = await db.query.employees.findFirst({
                where: eq(employees.id, rosterCount[0].employeeId)
            });
            console.log("✅ Employee Lookup Result:", emp ? "Found" : "Not Found");
        }

        // 3. Dry Run Insert (Test Schema)
        console.log("🧪 Attempting Test Insert...");
        const testNik = "DEBUG-" + Date.now();

        try {
            await db.insert(leaveRosterMonitoring).values({
                nik: testNik,
                name: "Debug User",
                investorGroup: "Debug Group",
                status: "Aktif",
                leaveOption: "70",
                monitoringDays: 0,
            });
            console.log("✅ Test Insert SUCCESS. Schema is compatible.");

            await db.delete(leaveRosterMonitoring).where(eq(leaveRosterMonitoring.nik, testNik));
        } catch (insertError: any) {
            console.error("❌ Test Insert FAILED:", insertError.message);
            console.error("Full Error:", insertError);
        }

    } catch (error: any) {
        console.error("🔥 CRITICAL FAILURE:", error.message);
        console.error(error);
    }
}

run();
