
async function test() {
    console.log("Testing API Summary...");
    try {
        const res = await fetch('http://127.0.0.1:5004/api/fms/fatigue/summary?week=all&shift=all&month=all');
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Full Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Failed", e);
    }
}

test();
