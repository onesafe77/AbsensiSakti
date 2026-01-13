import OpenAI from 'openai';
import { SiAsefChunk } from '@shared/schema';

if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not set. RAG features will not work.");
}

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const CHUNK_SIZE = 1000;

export interface ChunkResult {
    content: string;
    pageNumber: number;
    startPosition: number;
    endPosition: number;
}

export function chunkText(text: string, pageNumber: number = 1): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    // Split by sentence boundaries roughly
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = '';
    let startPos = 0;
    let currentPos = 0;

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > CHUNK_SIZE && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.trim(),
                pageNumber,
                startPosition: startPos,
                endPosition: currentPos,
            });

            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(words.length * 0.1));
            currentChunk = overlapWords.join(' ') + ' ' + sentence;
            startPos = currentPos - overlapWords.join(' ').length;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
        currentPos += sentence.length + 1;
    }

    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            pageNumber,
            startPosition: startPos,
            endPosition: currentPos,
        });
    }

    return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        console.warn("⚠️ OPENAI_API_KEY missing. Using random vector.");
        return Array.from({ length: 1536 }, () => Math.random());
    }

    try {
        const openai = new OpenAI({ apiKey: apiKey });
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float',
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('❌ Embedding error:', error);
        // Return random vector as fallback to prevent crash, but warn
        return Array.from({ length: 1536 }, () => Math.random());
    }
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        console.warn("⚠️ OPENAI_API_KEY missing or empty. Using random vectors for embedding.");
        return texts.map(() => Array.from({ length: 1536 }, () => Math.random()));
    }

    try {
        const openai = new OpenAI({ apiKey: apiKey });
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: texts,
            encoding_format: 'float',
        });
        // Ensure order is preserved (OpenAI guarantees it)
        return response.data.map(item => item.embedding);
    } catch (error) {
        console.error('❌ Batch embedding error:', error);
        // Fallback to random vectors so upload doesn't fail entire process
        return texts.map(() => Array.from({ length: 1536 }, () => Math.random()));
    }
}

export function cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Ensure generic typing for compatibility with schema types
export async function searchSimilarChunks(
    queryEmbedding: number[],
    allChunks: (SiAsefChunk & { embedding: number[] })[], // We assume embedding is number[] here after parsing
    topK: number = 5
) {
    const scored = allChunks
        .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
        .map(chunk => ({
            ...chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return scored;
}

export function buildRAGPrompt(question: string, relevantChunks: any[]) {
    if (!relevantChunks || relevantChunks.length === 0) {
        return {
            prompt: question,
            sources: [],
        };
    }

    const sources = relevantChunks.map((chunk, index) => ({
        id: index + 1,
        chunkId: chunk.id,
        documentName: chunk.originalName || "Unknown Document",
        pageNumber: chunk.pageNumber,
        content: chunk.content,
        score: chunk.score,
    }));

    const contextText = sources
        .map(s => `[Sumber ${s.id}] (${s.documentName}, Halaman ${s.pageNumber}):\n${s.content}`)
        .join('\n\n');

    // Prompt optimized for OpenAI (Bahasa Indonesia)
    const prompt = `Anda adalah Si Asef, asisten K3 yang cerdas. Jawab pertanyaan pengguna berdasarkan dokumen referensi berikut.
PENTING: Sertakan nomor referensi dalam jawaban menggunakan format {{ref:N}} dimana N adalah nomor sumber (1, 2, 3, dst).
Jika jawaban tidak ada di dokumen, katakan tidak tahu namun berikan saran umum K3 jika relevan.

DOKUMEN REFERENSI:
${contextText}

PERTANYAAN: ${question}

JAWABAN (sertakan {{ref:N}}):`;

    return { prompt, sources };
}
