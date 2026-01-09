import 'dotenv/config';
import { db } from "./db";
import { trainings } from "@shared/schema";
import { count } from "drizzle-orm";

async function verify() {
    const result = await db.select({ count: count() }).from(trainings);
    console.log("Total Trainings in DB:", result[0].count);
}

verify().catch(console.error).finally(() => process.exit(0));
