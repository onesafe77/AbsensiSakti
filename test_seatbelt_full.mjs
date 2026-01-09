import http from 'http';

// Test 1: Get all sessions
console.log('Testing GET /api/sidak-seatbelt...\n');

http.get('http://localhost:5000/api/sidak-seatbelt', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const sessions = JSON.parse(data);
            console.log(`✅ Found ${sessions.length} Seatbelt sessions`);

            if (sessions.length > 0) {
                const firstSession = sessions[0];
                console.log(`\nFirst session:`);
                console.log(`  ID: ${firstSession.id}`);
                console.log(`  Date: ${firstSession.tanggalPelaksanaan}`);
                console.log(`  Shift: ${firstSession.shift}`);
                console.log(`  Photos: ${firstSession.activityPhotos?.length || 0}`);

                // Test upload endpoint with real session ID
                console.log(`\n\nTesting upload endpoint with real session ID...`);
                testUpload(firstSession.id);
            } else {
                console.log('\n⚠️  No sessions found. Create a Seatbelt session first!');
            }
        } catch (e) {
            console.error('❌ Failed to parse response:', data.substring(0, 200));
        }
    });
}).on('error', (err) => {
    console.error('❌ Request failed:', err.message);
});

function testUpload(sessionId) {
    const testData = JSON.stringify({
        name: "test.jpg",
        contentType: "image/jpeg"
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/sidak-seatbelt/${sessionId}/request-upload-url`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': testData.length
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            console.log('Response:', data);

            if (res.statusCode === 200) {
                console.log('\n✅✅✅ UPLOAD ENDPOINT WORKING PERFECTLY! ✅✅✅');
            } else {
                console.log('\n❌ Upload endpoint returned error');
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Upload test failed:', error.message);
    });

    req.write(testData);
    req.end();
}
