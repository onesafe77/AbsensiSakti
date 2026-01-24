
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
const replacementPath = path.join(process.cwd(), 'server', 'loto_pdf_replacement.txt');

try {
    const storageContent = fs.readFileSync(storagePath, 'utf8');
    const replacementContent = fs.readFileSync(replacementPath, 'utf8');

    // Find start of generateSidakLotoPDF
    const startMarker = 'async generateSidakLotoPDF(data: {';
    const startIndex = storageContent.indexOf(startMarker);

    if (startIndex === -1) {
        console.error('Could not find generateSidakLotoPDF start.');
        process.exit(1);
    }

    // Find end of the function (bracket counting)
    let bracketCount = 0;
    let endIndex = -1;
    let foundStartBrace = false;

    for (let i = startIndex; i < storageContent.length; i++) {
        if (storageContent[i] === '{') {
            bracketCount++;
            foundStartBrace = true;
        } else if (storageContent[i] === '}') {
            bracketCount--;
        }

        if (foundStartBrace && bracketCount === 0) {
            endIndex = i + 1; // Include the closing brace
            break;
        }
    }

    if (endIndex === -1) {
        console.error('Could not find generateSidakLotoPDF end.');
        process.exit(1);
    }

    const newContent =
        storageContent.substring(0, startIndex) +
        replacementContent +
        storageContent.substring(endIndex);

    fs.writeFileSync(storagePath, newContent);
    console.log('Successfully patched server/storage.ts');

} catch (err) {
    console.error('Error patching file:', err);
    process.exit(1);
}
