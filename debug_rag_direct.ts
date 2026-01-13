
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";
import * as fs from 'fs';

neonConfig.webSocketConstructor = ws;

async function checkContent() {
    let output = "🔍 Checking Database Content (Direct Mode)...\n";

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing in .env");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });

    try {
        const docs = await db.select().from(schema.siAsefDocuments);
        output += `\n📄 Found ${docs.length} documents:\n`;

        for (const doc of docs) {
            output += `- [${doc.id}] ${doc.name} (${doc.fileType})\n`;

            const chunks = await db.select().from(schema.siAsefChunks).where(eq(schema.siAsefChunks.documentId, doc.id)).limit(3);

            if (chunks.length === 0) {
                output += "   ⚠️ NO CHUNKS FOUND!\n";
            }

            for (const chunk of chunks) {
                const hasEmbedding = Array.isArray(chunk.embedding) && chunk.embedding.length > 0;
                output += `   - Chunk ID: ${chunk.id}\n`;
                output += `     Embedding Length: ${hasEmbedding ? chunk.embedding.length : 'NONE'}\n`;
                output += `     Content Preview: "${chunk.content.substring(0, 100)}..."\n`;
            }
        }
    } catch (err) {
        output += `Error: ${err}\n`;
    } finally {
        await pool.end();
        fs.writeFileSync('debug_output.txt', output);
        console.log("Output written to debug_output.txt");
    }
}

checkContent();
