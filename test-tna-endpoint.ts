
import fetch from 'node-fetch';

async function testEndpoint() {
    try {
        console.log("Testing POST /api/hse/tna/entries/simple...");
        const response = await fetch('http://localhost:5004/api/hse/tna/entries/simple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: "C-020433",
                trainingId: "6b93e616-f9b4-4680-a6b5-142ce29b6121",
                certificateNumber: "TEST-SCRIPT",
                issuer: "TEST-ISSUER",
                issueDate: "2026-01-01",
                expiryDate: "2026-12-31"
            })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Raw Response: ${text}`);
        try {
            const json = JSON.parse(text);
            console.log("JSON Error:", JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("Response is not JSON");
        }
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testEndpoint();
