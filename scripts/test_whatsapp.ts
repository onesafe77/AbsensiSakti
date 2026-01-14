
import * as dotenv from "dotenv";
dotenv.config({ path: "c:/OneTalent/.env" });
import { sendWhatsAppMessage } from "../server/services/whatsapp-service";

async function testWA() {
    console.log("Testing WhatsApp Service...");
    const apiKey = process.env.NOTIFYME_API_KEY;
    console.log(`API Key present: ${apiKey ? 'YES' : 'NO'}`);

    // User's phone from previous debug
    const phone = "62859106993956";
    const message = "Tes Debugging OneTalent: Apakah pesan ini masuk?";

    try {
        const result = await sendWhatsAppMessage({ phone, message });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("Exception:", e.message);
    }
}

testWA();
