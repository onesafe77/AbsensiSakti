import http from 'http';

const testData = JSON.stringify({
    name: "test.jpg",
    contentType: "image/jpeg"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/sidak-seatbelt/test-session-id/request-upload-url',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Response:', data);
        if (res.statusCode === 200 || res.statusCode === 404) {
            console.log('\n✅ Endpoint is registered and responding!');
            if (res.statusCode === 404) {
                console.log('(404 is expected for test-session-id)');
            }
        } else {
            console.log('\n❌ Unexpected status code');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('\nEndpoint might not be registered or server is not running');
});

req.write(testData);
req.end();
