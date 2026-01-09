
async function test() {
    try {
        console.log("Fetching http://localhost:5004/api/debug-roster...");
        const res = await fetch("http://localhost:5004/api/debug-roster");
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
        if (res.ok) {
            console.log("✅ DEBUG API SUCCESS");
        } else {
            console.log("❌ DEBUG API FAILED");
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}
test();
