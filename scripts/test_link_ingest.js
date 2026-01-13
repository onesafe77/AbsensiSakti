
async function syncLink() {
    console.log("Syncing from link...");
    const url = "http://127.0.0.1:8002/dummy_fatigue.xlsx";

    try {
        const res = await fetch('http://127.0.0.1:5004/api/fms/fatigue/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);

    } catch (e) {
        console.error("Sync failed", e);
    }
}

syncLink();
