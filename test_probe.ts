
import fetch from 'node-fetch';

async function probe() {
    try {
        console.log("Probing /api/direct-probe...");
        const response = await fetch('http://localhost:5004/api/direct-probe');
        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Body: ${text.substring(0, 100)}`);
    } catch (error) {
        console.error("Probe Error:", error);
    }
}

probe();
