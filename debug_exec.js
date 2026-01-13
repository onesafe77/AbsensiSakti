import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pythonPath = "C:\\Users\\SDM UTAMA\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";
const scriptPath = path.join(process.cwd(), 'scripts', 'ingest_fatigue.py');
// Create a dummy file in uploads to simulate
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const filePath = path.join(uploadDir, 'test_upload_debug.xlsx');
// Copy dummy_fatigue.xlsx to uploads
fs.copyFileSync('dummy_fatigue.xlsx', filePath);

console.log("Testing execution...");
console.log(`Command: "${pythonPath}" "${scriptPath}" "${filePath}"`);

exec(`"${pythonPath}" "${scriptPath}" "${filePath}"`, (error, stdout, stderr) => {
    if (error) {
        console.error("Exec Error:", error);
    }
    if (stderr) {
        console.error("Stderr:", stderr);
    }
    console.log("Stdout:", stdout);
});
