import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, ShieldCheck, Copy, Check, RotateCcw, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message, Role, Source } from './types'; // Updated path
import CitationBubble from './CitationBubble';
import { SourceInfo } from './types';

interface ChatBubbleProps {
    message: Message;
    onRegenerate?: () => void;
    onOpenSource?: (source: SourceInfo) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onRegenerate, onOpenSource }) => {
    const isUser = message.role === Role.USER;
    const [copied, setCopied] = useState(false);

    const isThinking = message.role === Role.MODEL && message.isStreaming && !message.content;
    const isTyping = message.role === Role.MODEL && message.isStreaming && message.content;

    const handleCopy = () => {
        const cleanContent = message.content.replace(/\{\{ref:\d+\}\}/g, '');
        navigator.clipboard.writeText(cleanContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderTextWithCitations = (text: string, sources: Source[] = []) => {
        if (!sources || sources.length === 0 || !text.includes('{{ref:')) {
            return text;
        }

        const parts = text.split(/(\{\{ref:\d+\}\})/g);

        return parts.map((part, index) => {
            const match = part.match(/\{\{ref:(\d+)\}\}/);
            if (match) {
                const refNum = parseInt(match[1], 10);
                const source = sources.find(s => s.id === refNum);
                if (source) {
                    const sourceInfo: SourceInfo = {
                        id: source.id,
                        chunkId: source.chunkId,
                        documentName: source.documentName,
                        pageNumber: source.pageNumber,
                        content: source.content,
                        score: source.score
                    };
                    return (
                        <CitationBubble
                            key={`cite-${index}`}
                            number={refNum}
                            source={sourceInfo}
                            onOpenPanel={onOpenSource}
                        />
                    );
                }
                return null; // Don't render broken citations
            }
            return part;
        });
    };

    const markdownComponents = useMemo(() => ({
        h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-zinc-900 mt-8 mb-4 font-sans tracking-tight" {...props} />,
        h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-zinc-900 mt-6 mb-3 font-sans tracking-tight" {...props} />,
        h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-zinc-900 mt-5 mb-2 font-sans tracking-tight" {...props} />,
        p: ({ node, children, ...props }: any) => (
            <p className="mb-4 leading-7 text-zinc-800 font-sans text-[15px]" {...props}>
                {React.Children.map(children, (child) => {
                    if (typeof child === 'string') {
                        return renderTextWithCitations(child, message.sources);
                    }
                    return child;
                })}
            </p>
        ),
        strong: ({ node, children, ...props }: any) => (
            <strong className="font-bold text-zinc-900" {...props}>
                {React.Children.map(children, (child) => {
                    if (typeof child === 'string') {
                        return renderTextWithCitations(child, message.sources);
                    }
                    return child;
                })}
            </strong>
        ),
        em: ({ node, children, ...props }: any) => (
            <em className="italic" {...props}>
                {React.Children.map(children, (child) => {
                    if (typeof child === 'string') {
                        return renderTextWithCitations(child, message.sources);
                    }
                    return child;
                })}
            </em>
        ),
        ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-5 space-y-2 marker:text-zinc-400 font-sans leading-7" {...props} />,
        ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-5 space-y-2 marker:text-zinc-500 font-sans leading-7" {...props} />,
        li: ({ node, children, ...props }: any) => (
            <li className="pl-1" {...props}>
                {React.Children.map(children, (child) => {
                    if (typeof child === 'string') {
                        return renderTextWithCitations(child, message.sources);
                    }
                    return child;
                })}
            </li>
        ),
        blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-red-500/50 pl-4 italic text-zinc-600 my-5 bg-red-50/50 py-2 rounded-r-lg" {...props} />,
    }), [message.sources, onOpenSource]);

    return (
        <div className={`w-full py-4 md:py-8 px-4 ${isUser ? '' : 'bg-transparent'}`}>
            <div className={`max-w-3xl mx-auto flex gap-4 md:gap-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                <div className="flex-shrink-0 flex flex-col pt-1">
                    {isUser ? (
                        <div className="w-8 h-8 bg-zinc-100 rounded-full text-zinc-500 flex items-center justify-center border border-zinc-200 shadow-sm">
                            <User className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg text-red-600 flex items-center justify-center mt-1 bg-red-50 border border-red-100 shadow-sm">
                            <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                <div className={`
            relative flex-1 group 
            ${isUser ? 'flex justify-end' : ''}
        `}>
                    <div className={`
             text-[15px] max-w-full
             ${isUser
                            ? 'bg-zinc-100 text-zinc-800 px-5 py-3.5 rounded-2xl rounded-tr-sm font-sans leading-relaxed max-w-[85%] border border-zinc-200'
                            : 'bg-transparent text-zinc-800 prose-content pl-0 w-full'}
          `}>

                        {!isUser && (
                            <div className="font-bold text-sm text-zinc-900 mb-2 select-none font-sans tracking-wide flex items-center gap-2">
                                Mystic
                            </div>
                        )}

                        {isUser && message.content.startsWith('[Attachment]') && (
                            <div className="mb-3">
                                <div className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 shadow-sm">
                                    <FileText className="w-4 h-4 text-red-500" />
                                    <span>Image Uploaded</span>
                                </div>
                            </div>
                        )}

                        {isUser ? (
                            <p className="whitespace-pre-wrap">{message.content.replace('[Attachment] ', '')}</p>
                        ) : (
                            <>
                                {isThinking && (
                                    <div className="flex items-center gap-3 py-2 animate-fade-in-up">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                        </span>
                                        <span className="text-zinc-400 text-sm font-medium animate-pulse font-sans">Menelusuri regulasi...</span>
                                    </div>
                                )}

                                {message.content && (
                                    <div className="markdown-body font-sans text-[#2D2D2D]">
                                        <ReactMarkdown components={markdownComponents}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {isTyping && (
                                    <span className="inline-block w-2.5 h-5 bg-red-500 ml-1 align-middle animate-pulse"></span>
                                )}
                            </>
                        )}
                    </div>

                    {!isUser && !message.isStreaming && message.content && (
                        <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-all"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-red-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>

                            <button
                                onClick={onRegenerate}
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-all"
                                title="Regenerate"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-px bg-zinc-200 mx-1"></div>

                            <button className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-all">
                                <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-all">
                                <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatBubble;
