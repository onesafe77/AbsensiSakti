import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(process.cwd(), 'dummy_fatigue.xlsx');
const fileStats = fs.statSync(filePath);

async function upload() {
    console.log("Uploading file...");
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

    const fileContent = fs.readFileSync(filePath);

    const pre = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="dummy_fatigue.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
    const post = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
        Buffer.from(pre),
        fileContent,
        Buffer.from(post)
    ]);

    try {
        const res = await fetch('http://localhost:5004/api/fms/fatigue/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: body
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);

    } catch (e) {
        console.error("Upload failed", e);
    }
}

upload();
