import { storage } from "./storage";
import type { SafetyPatrolTemplate } from "@shared/schema";

interface MatchResult {
  template: SafetyPatrolTemplate | null;
  matchScore: number;
  matchedKeywords: string[];
}

export class TemplateResolver {
  private templates: SafetyPatrolTemplate[] = [];
  private lastFetch: Date | null = null;
  private cacheDurationMs = 60000;

  async loadTemplates(): Promise<void> {
    const now = new Date();
    if (this.lastFetch && (now.getTime() - this.lastFetch.getTime()) < this.cacheDurationMs) {
      return;
    }
    
    this.templates = await storage.getActiveSafetyPatrolTemplates();
    this.lastFetch = now;
  }

  async matchTemplate(messageText: string): Promise<MatchResult> {
    await this.loadTemplates();
    
    if (this.templates.length === 0) {
      return { template: null, matchScore: 0, matchedKeywords: [] };
    }

    const normalizedMessage = messageText.toLowerCase();
    let bestMatch: MatchResult = { template: null, matchScore: 0, matchedKeywords: [] };

    for (const template of this.templates) {
      const keywords = template.matchingKeywords || [];
      const matchedKeywords: string[] = [];
      
      for (const keyword of keywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }

      const matchScore = keywords.length > 0 
        ? (matchedKeywords.length / keywords.length) * 100 
        : 0;

      if (matchScore > bestMatch.matchScore) {
        bestMatch = {
          template,
          matchScore,
          matchedKeywords
        };
      }
    }

    if (bestMatch.matchScore < 30) {
      return { template: null, matchScore: 0, matchedKeywords: [] };
    }

    return bestMatch;
  }

  buildPromptContext(template: SafetyPatrolTemplate | null): string {
    if (!template) {
      return this.getDefaultPromptContext();
    }

    let context = `
TEMPLATE YANG COCOK: ${template.name}
KATEGORI: ${template.category}
`;

    if (template.description) {
      context += `DESKRIPSI: ${template.description}\n`;
    }

    if (template.exampleMessage) {
      context += `
CONTOH FORMAT PESAN:
${template.exampleMessage}
`;
    }

    if (template.expectedFields) {
      context += `
FIELDS YANG DIHARAPKAN:
${JSON.stringify(template.expectedFields, null, 2)}
`;
    }

    if (template.promptContext) {
      context += `
INSTRUKSI KHUSUS:
${template.promptContext}
`;
    }

    return context;
  }

  private getDefaultPromptContext(): string {
    return `
TIDAK ADA TEMPLATE YANG COCOK
Analisis pesan secara umum dan ekstrak informasi yang tersedia.
Jika tidak bisa menentukan jenis laporan, gunakan "Laporan Umum".
`;
  }

  async getAllTemplateNames(): Promise<string[]> {
    await this.loadTemplates();
    return this.templates.map(t => t.name);
  }

  async getTemplateCategories(): Promise<string[]> {
    await this.loadTemplates();
    const categories = new Set(this.templates.map(t => t.category));
    return Array.from(categories);
  }
}

export const templateResolver = new TemplateResolver();
