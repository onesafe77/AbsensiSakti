
import { db } from "./server/db";
import { siAsefDocuments, siAsefChunks } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkContent() {
    console.log("🔍 Checking Database Content...");

    // 1. Get all documents
    const docs = await db.select().from(siAsefDocuments);
    console.log(`\n📄 Found ${docs.length} documents:`);

    for (const doc of docs) {
        console.log(`- [${doc.id}] ${doc.name} (${doc.fileType})`);

        // 2. Get chunks for this doc
        const chunks = await db.select().from(siAsefChunks).where(eq(siAsefChunks.documentId, doc.id)).limit(3);
        console.log(`   Found ${chunks.length} chunks (showing first 3):`);

        if (chunks.length === 0) {
            console.warn("   ⚠️ NO CHUNKS FOUND! Indexing failed or empty content.");
        }

        for (const chunk of chunks) {
            const hasEmbedding = chunk.embedding && chunk.embedding.length > 0;
            console.log(`   - Chunk ID: ${chunk.id}`);
            console.log(`     Embedding Length: ${hasEmbedding ? chunk.embedding.length : 'NONE'}`);
            console.log(`     Content Preview: "${chunk.content.substring(0, 100)}..."`);
        }
    }
    process.exit(0);
}

checkContent().catch(console.error);
