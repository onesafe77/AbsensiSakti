
import 'dotenv/config';
import { storage } from './storage';

async function verifyTna() {
    console.log("Verifying TNA Dashboard Methods...");

    try {
        console.log("\n1. Testing getTnaDashboardStats...");
        const stats = await storage.getTnaDashboardStats();
        console.log("Stats Result:", JSON.stringify(stats, null, 2));

        console.log("\n2. Testing getTnaGapAnalysis...");
        const gaps = await storage.getTnaGapAnalysis();
        console.log("Gap Analysis Result:", JSON.stringify(gaps, null, 2));

        console.log("\n3. Testing getTnaDepartmentCompliance...");
        const compliance = await storage.getTnaDepartmentCompliance();
        console.log("Department Compliance Result:", JSON.stringify(compliance, null, 2));

        console.log("\n4. Testing getAllTnaEntriesWithDetails...");
        const entries = await storage.getAllTnaEntriesWithDetails();
        console.log(`Entries Count: ${entries.length}`);
        if (entries.length > 0) {
            console.log("First Entry Sample:", JSON.stringify(entries[0], null, 2));
        }

        console.log("\n✅ TNA Verification Completed Successfully.");
    } catch (error) {
        console.error("\n❌ TNA Verification Failed:", error);
    }
}

verifyTna();
