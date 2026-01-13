
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUpload() {
    try {
        console.log("Creating dummy test file...");
        const dummyPath = path.resolve('test_image.jpg');
        fs.writeFileSync(dummyPath, 'fake image content');

        const form = new FormData();
        form.append('photo', fs.createReadStream(dummyPath));

        console.log("Sending POST request to localhost:5004...");
        const response = await fetch('http://localhost:5004/api/employees/C-020433/photo', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const text = await response.text();
        const output = `Status: ${response.status}\nBody: ${text.substring(0, 500)}`;
        console.log(output);
        fs.writeFileSync('test_result.txt', output);

        fs.unlinkSync(dummyPath);
    } catch (error: any) {
        console.error("Test Error:", error);
        fs.writeFileSync('test_result.txt', `Error: ${error.message}`);
    }
}

testUpload();
