
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Manually load env before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { db } from "../server/db";
import { rosterSchedules, leaveRosterMonitoring, employees } from "../shared/schema";
import { eq } from "drizzle-orm";
import { format, addDays, subDays } from "date-fns";

async function seed() {
    console.log("Seeding data...");

    // 1. Ensure an employee exists
    let emp = await db.query.employees.findFirst({ where: eq(employees.id, "TEST-001") });
    if (!emp) {
        console.log("Creating test employee...");
        await db.insert(employees).values({
            id: "TEST-001",
            name: "Budi Test",
            investorGroup: "Group A",
            position: "Operator"
        }).onConflictDoNothing();
    }

    // 2. Clear existing rosters for test emp
    await db.delete(rosterSchedules).where(eq(rosterSchedules.employeeId, "TEST-001"));

    // 3. Create Roster Pattern
    const today = new Date();
    const records = [];

    // Yesterday: WORKING
    records.push({
        employeeId: "TEST-001",
        date: format(subDays(today, 1), "yyyy-MM-dd"),
        shift: "Siang",
        status: "scheduled"
    });

    // Today: CUTI (Current Leave) -> Should show up in "Sedang Cuti"
    records.push({
        employeeId: "TEST-001",
        date: format(today, "yyyy-MM-dd"),
        shift: "CUTI",
        status: "scheduled"
    });

    // Tomorrow: CUTI
    records.push({
        employeeId: "TEST-001",
        date: format(addDays(today, 1), "yyyy-MM-dd"),
        shift: "CUTI",
        status: "scheduled"
    });

    // Day after tomorrow: WORKING (Returning)
    records.push({
        employeeId: "TEST-001",
        date: format(addDays(today, 2), "yyyy-MM-dd"),
        shift: "Pagi",
        status: "scheduled"
    });

    await db.insert(rosterSchedules).values(records);
    console.log("Roster seeded.");

    // 4. Create/Reset Monitoring Entry for Test Emp
    await db.delete(leaveRosterMonitoring).where(eq(leaveRosterMonitoring.nik, "TEST-001"));
    await db.insert(leaveRosterMonitoring).values({
        nik: "TEST-001",
        name: "Budi Test",
        investorGroup: "Group A",
        leaveOption: "70",
        status: "Aktif", // Intentionally wrong status to test Sync
        monitoringDays: 0
    });

    console.log("Monitoring entry created.");
    process.exit(0);
}

seed().catch(console.error);
