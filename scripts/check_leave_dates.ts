
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkDates() {
    const { db } = await import("../server/db");
    const { leaveRequests } = await import("../shared/schema");

    const requests = await db.select().from(leaveRequests);
    console.log(`Checking ${requests.length} requests...`);
    requests.forEach(r => {
        try {
            new Date(r.startDate).toLocaleDateString('id-ID');
        } catch (e) {
            console.error(`Invalid Start Date for ID ${r.id}: "${r.startDate}"`);
        }
        try {
            new Date(r.endDate).toLocaleDateString('id-ID');
        } catch (e) {
            console.error(`Invalid End Date for ID ${r.id}: "${r.endDate}"`);
        }
    });

    console.log("Check complete.");
    process.exit(0);
}

checkDates();
