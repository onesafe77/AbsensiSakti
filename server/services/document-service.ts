import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import { db } from '../db';
import { siAsefDocuments, siAsefChunks, SiAsefDocument } from '@shared/schema';
import { chunkText, generateEmbeddingsBatch } from './rag-service';
import { eq } from 'drizzle-orm';
import Papa from 'papaparse';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        console.log('📄 Starting PDF parse, buffer length:', buffer?.length);
        const pdf = require('pdf-parse');
        console.log('📄 pdf-parse loaded successfully');
        const data = await pdf(buffer);
        console.log('📄 PDF parsed successfully, text length:', data.text.length);
        return data.text.trim();
    } catch (error) {
        console.error("❌ Error parsing PDF - Full error:", error);
        console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
        console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack');
        return "";
    }
}

export async function parseDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value.trim();
    } catch (error) {
        console.error("Error parsing DOCX:", error);
        return "";
    }
}

// NEW: Parse CSV Content (from file or URL)
export async function parseCsv(csvContent: string): Promise<string> {
    return new Promise((resolve) => {
        Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    console.error("CSV Parse Errors:", results.errors);
                }

                // Convert each row to a semantic string
                // Format: "Record [index]: [Key]: [Value], [Key]: [Value]..."
                const textChunks = results.data.map((row: any, index: number) => {
                    const rowString = Object.entries(row)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ");
                    return `Data Spreadsheet Baris ${index + 1}: ${rowString}.`;
                });

                resolve(textChunks.join("\n\n"));
            },
            error: (error: any) => {
                console.error("CSV Parse Error:", error);
                resolve(""); // Resolve empty on error to prevent crash
            }
        });
    });
}

// NEW: Process Google Sheet (from URL)
export async function processAndSaveGoogleSheet(
    url: string,
    folder: string = 'Spreadsheet',
    uploadedBy?: string
): Promise<SiAsefDocument> {
    console.log('📊 Processing Google Sheet URL:', url);

    // 1. Fetch CSV Data
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    const csvContent = await response.text();

    console.log('📊 CSV Fetched, length:', csvContent.length);

    // 2. Parse Content
    const content = await parseCsv(csvContent);

    if (!content || content.length === 0) {
        throw new Error("Gagal membaca konten spreadsheet. Pastikan link 'Published to Web' benar (format CSV).");
    }

    // 3. Save Document Metadata
    // Extract document name from URL or use generic name
    const docName = `Google Sheet - ${new Date().toLocaleString('id-ID')}`;

    const [doc] = await db.insert(siAsefDocuments).values({
        name: docName,
        originalName: url, // Store URL as original name
        fileType: 'application/vnd.google-apps.spreadsheet', // Custom type
        fileSize: `${(csvContent.length / 1024).toFixed(2)} KB`,
        folder,
        uploadedBy,
        isActive: true,
    }).returning();

    // 4. Chunk & Save (Reuse existing logic via internal call or duplicating steps)
    // To avoid duplication, let's extract the chunking/saving logic. 
    // For now, I'll duplicate the essential steps to be safe and distinct.

    const chunks = chunkText(content);

    await db.update(siAsefDocuments)
        .set({
            totalChunks: chunks.length,
            totalPages: 1
        })
        .where(eq(siAsefDocuments.id, doc.id));

    // Generate Embeddings
    const textsToEmbed = chunks.map(c => c.content);
    let embeddings: number[][] = [];
    try {
        if (textsToEmbed.length > 0) {
            embeddings = await generateEmbeddingsBatch(textsToEmbed);
        }
    } catch (err) {
        console.error("Embedding generation failed:", err);
        embeddings = textsToEmbed.map(() => []);
    }

    const chunksToInsert = chunks.map((chunk, index) => ({
        documentId: doc.id,
        chunkIndex: index,
        content: chunk.content,
        pageNumber: 1,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition,
        embedding: embeddings[index] || null,
    }));

    if (chunksToInsert.length > 0) {
        await db.insert(siAsefChunks).values(chunksToInsert);
    }

    return doc;
}

export async function processAndSaveDocument(
    file: Express.Multer.File,
    folder: string = 'Umum',
    uploadedBy?: string
): Promise<SiAsefDocument> {
    console.log('📁 Processing file:', file.originalname, 'mimetype:', file.mimetype);
    console.log('📁 File buffer exists:', !!file.buffer, 'buffer length:', file.buffer?.length);
    let content = '';

    // 1. Extract Text
    if (file.mimetype === 'application/pdf') {
        console.log('📄 Parsing as PDF...');
        content = await parsePdf(file.buffer);

        // OCR Fallback DISABLED - Tesseract.js cannot read PDF directly
        // TODO: Implement PDF-to-image conversion before OCR
        // if (!content || content.trim().length < 50) {
        //    console.log('⚠️ PDF content empty or too short. Attempting OCR for scanned document...');
        //    content = await performOCR(file.buffer);
        // }
    } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
    ) {
        console.log('📝 Parsing as DOCX...');
        content = await parseDocx(file.buffer);
    } else if (file.mimetype === 'text/plain') {
        console.log('📝 Reading as plain text...');
        content = file.buffer.toString('utf-8');
    } else {
        throw new Error('Unsupported file type');
    }

    console.log('📊 Content extracted, length:', content.length);

    if (!content || content.trim().length === 0) {
        console.warn('⚠️ No content extracted from file!');
        content = "[SISTEM: Gagal mengekstrak teks. File mungkin rusak atau terproteksi.]";
    }

    // 2. Save Document Metadata
    const [doc] = await db.insert(siAsefDocuments).values({
        name: file.originalname,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        folder,
        uploadedBy,
        isActive: true,
    }).returning();

    // 3. Chunk Text
    const chunks = chunkText(content);

    // 4. Update Document Stats
    await db.update(siAsefDocuments)
        .set({
            totalChunks: chunks.length,
            totalPages: 1 // PDF page count requires logic info from pdf-parse if available
        })
        .where(eq(siAsefDocuments.id, doc.id));

    // 5. Generate Embeddings (Batch)
    const textsToEmbed = chunks.map(c => c.content);
    // Add robustness: handle empty chunks or API errors silently
    let embeddings: number[][] = [];
    try {
        if (textsToEmbed.length > 0) {
            embeddings = await generateEmbeddingsBatch(textsToEmbed);
        }
    } catch (err) {
        console.error("Embedding generation failed:", err);
        // Fallback to empty embeddings or random to allow saving
        embeddings = textsToEmbed.map(() => []);
    }

    // 6. Save Chunks
    const chunksToInsert = chunks.map((chunk, index) => ({
        documentId: doc.id,
        chunkIndex: index,
        content: chunk.content,
        pageNumber: chunk.pageNumber,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition,
        embedding: embeddings[index] || null,
    }));

    if (chunksToInsert.length > 0) {
        await db.insert(siAsefChunks).values(chunksToInsert);
    }

    return doc;
}

// Helper: Perform OCR using Tesseract.js
async function performOCR(buffer: Buffer): Promise<string> {
    let worker = null;
    try {
        console.log("📸 Initializing OCR worker...");
        const { createWorker } = await import('tesseract.js');

        // Create worker with timeout protection
        worker = await createWorker('eng'); // Use English for better compatibility

        console.log("📸 OCR Worker initialized. Recognizing text...");

        // Set a timeout for recognition
        const recognitionPromise = worker.recognize(buffer);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('OCR timeout after 30 seconds')), 30000)
        );

        const result = await Promise.race([recognitionPromise, timeoutPromise]) as any;
        const text = result?.data?.text || '';

        console.log("📸 OCR Complete. Text length:", text.length);

        if (worker) {
            await worker.terminate();
        }

        return text.trim() || "[OCR: Gambar terbaca tapi tidak ada teks yang dapat dikenali]";
    } catch (error) {
        console.error("❌ OCR Failed:", error);

        // Ensure worker is terminated even on error
        if (worker) {
            try {
                await worker.terminate();
            } catch (terminateError) {
                console.error("Failed to terminate worker:", terminateError);
            }
        }

        return "[SISTEM: Gagal membaca scan dokumen. File mungkin terlalu besar atau format tidak didukung.]";
    }
}

export async function deleteDocument(id: string) {
    // Delete chunks first (foreign key constraint)
    await db.delete(siAsefChunks).where(eq(siAsefChunks.documentId, id));
    // Then delete the document
    await db.delete(siAsefDocuments).where(eq(siAsefDocuments.id, id));
}
