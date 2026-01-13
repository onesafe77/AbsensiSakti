
import 'dotenv/config';
import { storage } from "./server/storage";

async function checkEmployee() {
    try {
        const employeeId = "C-020433";
        console.log("Searching for employee:", employeeId);
        const employee = await storage.getEmployee(employeeId);

        if (employee) {
            console.log("--- FOUND EMPLOYEE ---");
            console.log("ID:", employee.id);
            console.log("Name:", employee.name);
            console.log("Photo URL:", employee.photoUrl);
            console.log("----------------------");
        } else {
            console.log("Employee not found!");
        }
    } catch (error) {
        console.error("Error executing check:", error);
    }
}

checkEmployee();
