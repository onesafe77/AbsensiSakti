
import 'dotenv/config';
import { users, employees } from "./shared/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

async function checkEmployee() {
    try {
        if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);

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
