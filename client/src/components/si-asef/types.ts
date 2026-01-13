export enum Role {
    USER = 'user',
    MODEL = 'model',
}

export interface Source {
    id: number;
    chunkId: string; // Changed to string to match UUID
    documentName: string;
    pageNumber: number;
    content: string;
    score: number;
    folder?: string;
}

export interface Message {
    id: string; // Add ID for key
    role: Role;
    content: string;
    isStreaming?: boolean;
    sources?: Source[];
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
}

export interface UploadedDocument {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    folder?: string;
}

export interface SourceInfo extends Source { }
