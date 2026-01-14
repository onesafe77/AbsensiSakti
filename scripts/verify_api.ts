
import fetch from "node-fetch";

async function verify() {
    console.log("Verifying Sync API...");

    try {
        // 1. Call Sync
        const syncRes = await fetch("http://127.0.0.1:5000/api/leave-roster-monitoring/sync", {
            method: "POST"
        });

        if (syncRes.ok) {
            console.log("✅ Sync API Success:", await syncRes.json());
        } else {
            console.error("❌ Sync API Failed:", await syncRes.text());
        }

        // 2. Call Analyze
        console.log("Verifying Analyze API...");
        const analyzeRes = await fetch("http://127.0.0.1:5000/api/leave-roster-monitoring/analyze", {
            method: "POST"
        });

        if (analyzeRes.ok) {
            console.log("✅ Analyze API Success:", await analyzeRes.json());
        } else {
            console.log("⚠️ Analyze API Response:", await analyzeRes.text());
        }

    } catch (e) {
        console.error("❌ Connection Error:", e.message);
    }
}

verify();
