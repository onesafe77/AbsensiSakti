
async function sync() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpFp6S3NlTR7jWkjXVv3I2xXlfMgaDsM68GT9LFc22LR41mPn63MEAFDVCS6ef6LvY9r2BCMQI8NSX/pub?gid=0&single=true&output=csv";
    console.log("Syncing user data...");

    try {
        const res = await fetch("http://127.0.0.1:5004/api/fms/fatigue/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

sync();
