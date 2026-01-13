import 'dotenv/config';
import { storage } from "./server/storage";

async function test() {
    try {
        console.log("Testing getEmployeesPaginated...");

        // First, test getAllEmployees to see if there's data
        const all = await storage.getEmployees();
        console.log(`Total employees via getEmployees(): ${all.length}`);

        // Then test pagination
        const result = await storage.getEmployeesPaginated(1, 20, "");
        console.log(`Paginated result: ${result.data.length} items, total=${result.total}, pages=${result.totalPages}`);

        if (result.data.length > 0) {
            console.log("First employee:", result.data[0].id, result.data[0].name);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

test();
