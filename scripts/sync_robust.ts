
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { format, parseISO, parse } from "date-fns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function syncWithRobustDates() {
    const { db } = await import("../server/db");
    const { rosterSchedules, leaveRosterMonitoring, employees } = await import("../shared/schema");
    const { eq, and, or, asc } = await import("drizzle-orm");

    console.log("🚀 Starting Robust Sync...");

    const today = new Date().toISOString().split('T')[0];
    const monitoringEntries = await db.select().from(leaveRosterMonitoring);

    // Helper to parse ANY date format to YYYY-MM-DD
    const normalizeDate = (dateStr: string) => {
        try {
            if (!dateStr) return null;
            // Case 1: Already YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
            // Case 2: DD/MM/YYYY or D/M/YYYY
            if (dateStr.includes("/")) {
                // Use date-fns to parse
                const parsed = parse(dateStr, 'd/M/yyyy', new Date());
                return format(parsed, "yyyy-MM-dd");
            }
            return dateStr;
        } catch (e) {
            console.warn(`Failed to parse date: ${dateStr}`);
            return null;
        }
    };

    const processBatch = async (batch: typeof monitoringEntries) => {
        await Promise.all(batch.map(async (entry) => {
            const leaves = await db
                .select()
                .from(rosterSchedules)
                .where(and(
                    eq(rosterSchedules.employeeId, entry.nik),
                    or(eq(rosterSchedules.shift, 'CUTI'), eq(rosterSchedules.shift, 'LEAVE'))
                ));

            // Normalize all dates in memory for calculation
            const normalizedLeaves = leaves.map(l => ({
                ...l,
                normalizedDate: normalizeDate(l.date)
            })).filter(l => l.normalizedDate !== null).sort((a, b) => a.normalizedDate!.localeCompare(b.normalizedDate!));

            // 1. Find Last Leave
            const pastLeaves = normalizedLeaves.filter(r => r.normalizedDate! <= today);
            let lastLeave = entry.lastLeaveDate;
            if (pastLeaves.length > 0) {
                lastLeave = pastLeaves[pastLeaves.length - 1].normalizedDate;
            }

            // 2. Find Next Leave
            const futureLeaves = normalizedLeaves.filter(r => r.normalizedDate! > today);
            const nextLeave = futureLeaves.length > 0 ? futureLeaves[0].normalizedDate : null;

            // 3. Status
            let newStatus = "Aktif";
            const isCutiToday = normalizedLeaves.some(r => r.normalizedDate === today);

            if (isCutiToday) {
                newStatus = "Sedang Cuti";
            } else if (nextLeave) {
                const diffTime = new Date(nextLeave!).getTime() - new Date(today).getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    newStatus = "Akan Cuti";
                }
            }

            // 4. Monitoring Days
            let monitoringDays = 0;
            if (lastLeave) {
                const diffTime = new Date(today).getTime() - new Date(lastLeave).getTime();
                monitoringDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }

            await db.update(leaveRosterMonitoring)
                .set({
                    lastLeaveDate: lastLeave,
                    nextLeaveDate: nextLeave,
                    status: newStatus,
                    monitoringDays: monitoringDays,
                    updatedAt: new Date()
                })
                .where(eq(leaveRosterMonitoring.id, entry.id));
        }));
    };

    const BATCH_SIZE = 50;
    for (let i = 0; i < monitoringEntries.length; i += BATCH_SIZE) {
        const batch = monitoringEntries.slice(i, i + BATCH_SIZE);
        await processBatch(batch);
        console.log(`[Sync] Processed batch ${i / BATCH_SIZE + 1}`);
    }
    console.log("✅ Sync Complete");
    process.exit(0);
}

syncWithRobustDates();
