import "dotenv/config";
import { db } from "./db";
import { documentVersions, documentMasterlist } from "@shared/schema";

async function test() {
    console.log("Testing insert...");
    const docId = "51bee2ca-d163-42dd-bee3-8347140802ab"; // From screenshot

    try {
        const payload = {
            documentId: docId,
            versionNumber: 2,
            revisionNumber: 0,
            fileName: "test.pdf",
            filePath: "/uploads/test.pdf",
            fileSize: 1234,
            mimeType: "application/pdf",
            uploadedBy: "SYSTEM",
            uploadedByName: "System Tester",
            changesNote: "Test Manual Insert",
            status: "DRAFT"
        };

        console.log("Payload:", payload);

        const [res] = await db.insert(documentVersions).values(payload).returning();
        console.log("Success:", res);
        process.exit(0);
    } catch (e) {
        console.error("Insert Failed:");
        console.error(e);
        process.exit(1);
    }
}

test();
