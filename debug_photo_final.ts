
import 'dotenv/config';
import { db } from "./server/db";
import { employees } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkEmployee() {
    try {
        console.log("Checking DB connection...");
        const employeeId = "C-020433";

        // Explicitly waiting a bit to ensure connection
        await new Promise(r => setTimeout(r, 1000));

        const result = await db.select().from(employees).where(eq(employees.id, employeeId));

        if (result.length > 0) {
            console.log(`PHOTO_URL_VALUE:[${result[0].photoUrl}]`);
        } else {
            console.log("EMPLOYEE_NOT_FOUND");
        }
        process.exit(0);
    } catch (error) {
        console.error("ERROR", error);
        process.exit(1);
    }
}

checkEmployee();
