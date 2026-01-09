import { db } from "./db";
import { employees, authUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const DEFAULT_PASSWORD = "12345678";
const SALT_ROUNDS = 10;

async function seedAuthUsers() {
  try {
    console.log("🔐 Starting auth users seeding...");
    
    const allEmployees = await db.select().from(employees);
    console.log(`📊 Found ${allEmployees.length} employees`);
    
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    console.log(`🔒 Generated hashed password for default: ${DEFAULT_PASSWORD}`);
    
    let created = 0;
    let skipped = 0;
    
    for (const employee of allEmployees) {
      try {
        const existingAuth = await db.select()
          .from(authUsers)
          .where(eq(authUsers.nik, employee.id))
          .limit(1);
        
        if (existingAuth.length > 0) {
          skipped++;
          continue;
        }
        
        await db.insert(authUsers).values({
          nik: employee.id,
          hashedPassword: hashedPassword,
        });
        
        created++;
        
        if (created % 50 === 0) {
          console.log(`✅ Created ${created} auth users...`);
        }
      } catch (error) {
        console.error(`❌ Error creating auth for ${employee.id}:`, error);
      }
    }
    
    console.log(`\n🎉 Seeding completed!`);
    console.log(`✅ Created: ${created} auth users`);
    console.log(`⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`📝 Default password: ${DEFAULT_PASSWORD}`);
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedAuthUsers();
