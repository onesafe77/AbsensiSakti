
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface GeneratedQuestion {
    questionText: string;
    options: { label: string; text: string }[];
    correctAnswerIndex: number; // 0=A, 1=B, 2=C, 3=D
}

export const inductionAiService = {
    async generateQuestionsFromMaterial(filePath: string, fileType: string): Promise<GeneratedQuestion[]> {
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY is not set");
            }

            let textContent = "";

            if (fileType === "pdf" || filePath.endsWith(".pdf")) {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                textContent = data.text;
            } else {
                // Fallback or text file
                // For PPTX, we currently recommend converting to PDF
                throw new Error("Currently only PDF files are supported for AI question generation. Please convert PPTX to PDF.");
            }

            // Limit text content if too large (approx 30k tokens for safety, though 1.5 Flash handles 1M)
            // Just sending full text should be fine for most induction materials (usually < 100 pages)

            const prompt = `
        You are an expert Safety Officer. Based on the following training material text, generate 10 multiple-choice questions (A, B, C, D) to test understanding.
        
        Focus on key safety concepts, hazards, and procedures mentioned in the text.
        
        Output STRICTLY in the following JSON array format, with no extra text or markdown code blocks:
        [
          {
            "questionText": "Question text here",
            "options": [
              { "label": "A", "text": "Option A text" },
              { "label": "B", "text": "Option B text" },
              { "label": "C", "text": "Option C text" },
              { "label": "D", "text": "Option D text" }
            ],
            "correctAnswerIndex": 0
          }
        ]

        Material Text:
        ${textContent.substring(0, 100000)}
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up markdown code blocks if present
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const questions = JSON.parse(text) as GeneratedQuestion[];

            // Validate structure
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("AI returned invalid question format");
            }

            return questions.slice(0, 10); // Ensure max 10
        } catch (error: any) {
            console.error("AI Generation Error:", error);
            throw new Error(`Failed to generate questions: ${error.message}`);
        }
    }
};
