import { db } from "./db";
import { authUsers } from "@shared/schema";

async function checkAuthUsers() {
    const users = await db.select().from(authUsers).limit(10);
    console.log("=== First 10 Auth Users ===");
    users.forEach(user => {
        console.log(`NIK: ${user.nik}`);
    });
    process.exit(0);
}

checkAuthUsers().catch(console.error);
