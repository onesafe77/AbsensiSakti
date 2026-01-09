const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        http.get({
            hostname: 'localhost',
            port: 5000,
            path: path,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(`Status ${res.statusCode}: ${data}`);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function run() {
    try {
        console.log("Testing /api/sidak-recap...");
        const recap = await makeRequest('/api/sidak-recap');
        console.log("Recap success. Total sessions:", recap.sessions.length);
        console.log("Stats:", JSON.stringify(recap.stats, null, 2));

        if (recap.sessions.length > 0) {
            const session = recap.sessions[0]; // Pick first session
            console.log(`Testing detail for session ${session.id} type ${session.type}...`);
            const detail = await makeRequest(`/api/sidak-recap/detail?sessionId=${session.id}&type=${session.type}`);
            console.log("Detail success.");
            console.log("Session data:", detail.session.id);
            console.log("Records:", detail.records.length);
            console.log("Observers:", detail.observers.length);

            // Try to find a Seatbelt session specifically
            const seatbeltSession = recap.sessions.find(s => s.type === 'Seatbelt');
            if (seatbeltSession) {
                console.log(`Testing SEATBELT detail for session ${seatbeltSession.id}...`);
                const seatbeltDetail = await makeRequest(`/api/sidak-recap/detail?sessionId=${seatbeltSession.id}&type=${seatbeltSession.type}`);
                console.log("Seatbelt detail success.");
            } else {
                console.log("No Seatbelt sessions found to test.");
            }
        } else {
            console.log("No sessions found to test detail.");
        }
    } catch (error) {
        console.error("Test Failed:", error);
        process.exit(1);
    }
}

run();
