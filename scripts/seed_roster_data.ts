
import dotenv from "dotenv";
import { format, addDays, subDays } from "date-fns";
// We don't import db/schema here to avoid hoisting issues

dotenv.config({ path: "c:/OneTalent/.env" });

async function seed() {
    console.log("Seeding data...");

    // Dynamic imports ensure env is loaded first
    const { db } = await import("../server/db");
    const { rosterSchedules, leaveRosterMonitoring, employees } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");

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

    // 3. Create Roster Pattern: 
    const today = new Date();
    const records = [];

    // Past Cuti
    records.push({
        employeeId: "TEST-001",
        date: format(subDays(today, 5), "yyyy-MM-dd"),
        shift: "CUTI",
        status: "scheduled"
    });

    // Today
    records.push({
        employeeId: "TEST-001",
        date: format(today, "yyyy-MM-dd"),
        shift: "Siang",
        status: "scheduled"
    });

    // Future Cuti (Upcoming)
    records.push({
        employeeId: "TEST-001",
        date: format(addDays(today, 5), "yyyy-MM-dd"),
        shift: "CUTI",
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
        status: "Aktif",
        monitoringDays: 0
    });

    console.log("Monitoring entry created.");
    process.exit(0);
}

seed().catch(console.error);
