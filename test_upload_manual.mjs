import http from 'http';
import fs from 'fs';

const boundary = '--------------------------boundary123';
const sessionId = 'test-session-id'; // Use a dummy ID, should return 404 JSON, NOT HTML

const bodyHeader = `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="photos"; filename="test.jpg"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`;
const bodyContent = Buffer.from('fakeimagecontent');
const bodyFooter = `\r\n--${boundary}--\r\n`;

const body = Buffer.concat([
    Buffer.from(bodyHeader),
    bodyContent,
    Buffer.from(bodyFooter)
]);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/sidak-seatbelt/${sessionId}/upload-testing`,
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
    }
};

console.log(`Testing POST ${options.path}...`);

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('--- BODY START ---');
        console.log(data);
        console.log('--- BODY END ---');

        if (data.includes('<!DOCTYPE html>')) {
            console.error('❌ FAILURE: Received HTML. Endpoint not found.');
            process.exit(1);
        } else {
            console.log('✅ SUCCESS: Received non-HTML response (JSON expected).');
            process.exit(0);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
});

req.write(body);
req.end();
