import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Message, Role, ChatSession, Source } from '../components/si-asef/types';
import ChatBubble from '../components/si-asef/ChatBubble';
import InputArea from '../components/si-asef/InputArea';
import SourcePanel from '../components/si-asef/SourcePanel';
import { SourceInfo } from '../components/si-asef/types';
import { PanelLeftClose, PanelLeftOpen, Plus, MessageSquare, Trash2, Menu, ArrowLeft, Folder, Box, Scale, ShieldCheck, Gavel, BookOpen, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";

const spotlightData = [
    {
        quote: "Perusahaan wajib menerapkan SMK3 jika mempekerjakan minimal 100 orang atau memiliki potensi bahaya tinggi.",
        source: "PP 50 Tahun 2012",
        pasal: "Pasal 5",
        query: "Jelaskan tentang kewajiban penerapan SMK3 menurut PP 50 Tahun 2012",
        color: "bg-slate-900",
        icon: Scale,
        accent: "text-yellow-300",
        badge: "REGULASI SPOTLIGHT"
    },
    {
        quote: "Setiap tenaga kerja berhak mendapat perlindungan atas keselamatan dalam melakukan pekerjaan.",
        source: "UU No. 1 Tahun 1970",
        pasal: "Pasal 3",
        query: "Apa hak tenaga kerja terkait keselamatan kerja dalam UU No. 1 Tahun 1970?",
        color: "bg-emerald-900",
        icon: ShieldCheck,
        accent: "text-emerald-300",
        badge: "HAK PEKERJA"
    },
    {
        quote: "Pengurus diwajibkan memeriksakan kesehatan badan, kondisi mental dan kemampuan fisik dari tenaga kerja.",
        source: "Permenaker No. 02/1980",
        pasal: "Pasal 2",
        query: "Jelaskan kewajiban pemeriksaan kesehatan tenaga kerja menurut Permenaker No. 02/1980",
        color: "bg-blue-900",
        icon: Gavel,
        accent: "text-blue-300",
        badge: "KESEHATAN KERJA"
    }
];

export default function SiAsefChatPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeSource, setActiveSource] = useState<SourceInfo | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [spotlightIndex, setSpotlightIndex] = useState(0);



    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSpotlightIndex((prev) => (prev + 1) % spotlightData.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const currentSpotlight = spotlightData[spotlightIndex];
    const SpotlightIcon = currentSpotlight.icon;

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const loadSessions = async () => {
        try {
            const res = await fetch('/api/si-asef/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const loadSessionMessages = async (id: string) => {
        setIsLoading(true);
        setCurrentSessionId(id);
        try {
            const res = await fetch(`/api/si-asef/sessions/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    sources: m.sources,
                })));
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (text: string, image?: string) => {
        // Optimistic UI
        const tempId = Date.now().toString();
        const userMsg: Message = {
            id: tempId,
            role: Role.USER,
            content: text, // Image handling to be added if backend supports it
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/si-asef/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    sessionId: currentSessionId
                })
            });

            if (!res.ok) throw new Error('Network error');

            const data = await res.json();

            // Update session ID if new
            if (!currentSessionId && data.sessionId) {
                setCurrentSessionId(data.sessionId);
                loadSessions(); // Refresh list to show title
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(), // Or use ID from backend if available in response
                role: Role.MODEL,
                content: data.message,
                sources: data.sources
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: Role.MODEL,
                content: "Maaf, terjadi kesalahan saat menghubungi server."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-zinc-50 border-r border-zinc-200 font-sans">
            {/* Header / Brand */}
            <div className="px-5 pt-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-serif text-zinc-800">Mystic</h1>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                        <PanelLeftClose className="h-4 w-4" />
                    </Button>
                </div>

                {/* New Chat Button */}
                <Button
                    onClick={() => {
                        setCurrentSessionId(null);
                        setMessages([]);
                    }}
                    className="w-full justify-start gap-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 mb-6 shadow-sm font-medium transition-all"
                >
                    <Plus className="w-4 h-4 text-white" />
                    Mulai Chat Baru
                </Button>

                {/* Main Menu */}
                <div className="space-y-1 mb-6">
                    <button className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white hover:shadow-sm rounded-lg flex items-center gap-3 transition-all">
                        <MessageSquare className="w-4 h-4 text-zinc-500" />
                        Chats
                    </button>
                    <div className="group relative">
                        <button className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white hover:shadow-sm rounded-lg flex items-center gap-3 transition-all">
                            <Folder className="w-4 h-4 text-zinc-500" />
                            Projects
                        </button>
                    </div>
                    <button
                        className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white hover:shadow-sm rounded-lg flex items-center gap-3 transition-all"
                    >
                        <Box className="w-4 h-4 text-zinc-500" />
                        Artifacts
                    </button>
                    <button
                        onClick={() => setLocation('/workspace/si-asef/admin')}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white hover:shadow-sm rounded-lg flex items-center gap-3 transition-all"
                    >
                        <BookOpen className="w-4 h-4 text-zinc-500" />
                        Knowledge Base
                    </button>
                </div>

                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">
                    Recents
                </div>
            </div>

            {/* Recent Chats List */}
            <ScrollArea className="flex-1 px-3 pb-4">
                <div className="space-y-0.5">
                    {sessions.map((session) => (
                        <div key={session.id} className="group relative flex items-center">
                            <button
                                onClick={() => loadSessionMessages(session.id)}
                                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 pr-8
                    ${currentSessionId === session.id
                                        ? 'bg-white shadow-sm text-zinc-900 font-medium ring-1 ring-zinc-200'
                                        : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900'
                                    }`}
                            >
                                <span className="truncate flex-1">{session.title}</span>
                            </button>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('Hapus chat ini?')) return;
                                    try {
                                        const res = await fetch(`/api/si-asef/sessions/${session.id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                            if (currentSessionId === session.id) {
                                                setCurrentSessionId(null);
                                                setMessages([]);
                                            }
                                            await loadSessions();
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert("Gagal menghapus chat");
                                    }
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white hover:bg-red-500 rounded-lg transition-all z-20"
                                title="Hapus chat"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="text-center text-xs text-neutral-400 py-4 italic">
                            Belum ada riwayat
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Bottom Profile Section (Mockup) */}
            <div className="p-4 border-t border-[#e5e5e5]">
                <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-[#e8e8e7] rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-neutral-700 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-neutral-500">Pro Plan</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex bg-white font-sans">
            {/* Desktop Sidebar */}
            <div className={`hidden md:block transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <SidebarContent />
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-white z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation('/workspace/dashboard')}
                            className="text-zinc-500 hover:text-zinc-900"
                            title="Kembali ke Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden md:flex text-zinc-500"
                        >
                            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </Button>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden text-zinc-500">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>

                        <div>
                            <h1 className="font-bold text-zinc-900">Mystic</h1>
                            <p className="text-xs text-zinc-500">Asisten K3 & Regulasi</p>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-hidden relative">
                    <div ref={scrollRef} className="h-full overflow-y-auto p-4 scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="max-w-5xl mx-auto mt-8 px-6">
                                {/* Greeting Section */}
                                <div className="mb-8">
                                    <h2 className="text-3xl font-serif text-zinc-900 mb-1">
                                        Halo, <span className="uppercase">{user?.name || 'USER'}</span>.
                                    </h2>
                                    <p className="text-emerald-600 font-medium tracking-wide text-sm mb-1">SAFETY FIRST</p>
                                    <p className="text-zinc-500">
                                        Saya siap membantu Anda menelusuri <span className="font-semibold text-zinc-900">Regulasi K3 & Dokumen Internal Perusahaan</span>.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-6 mb-8 max-w-4xl mx-auto">
                                    {/* Spotlight Card */}
                                    <div className={`col-span-1 ${currentSpotlight.color} rounded-3xl p-8 text-white relative overflow-hidden group transition-colors duration-1000 ease-in-out`}>
                                        <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                                            <SpotlightIcon className="w-48 h-48" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className={`inline-flex items-center gap-2 ${currentSpotlight.accent} bg-white/10 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-6 backdrop-blur-sm`}>
                                                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                                {currentSpotlight.badge}
                                            </div>

                                            <div className="h-40 flex flex-col justify-start">
                                                <blockquote className="text-2xl font-serif leading-relaxed mb-6 max-w-xl animate-fade-in transition-opacity duration-500" key={spotlightIndex}>
                                                    "{currentSpotlight.quote}"
                                                </blockquote>
                                            </div>

                                            <div className="flex items-center gap-3 text-white/60 text-sm font-mono mb-8">
                                                <span className="px-2 py-1 bg-white/10 rounded backdrop-blur-md">{currentSpotlight.source}</span>
                                                <span>{currentSpotlight.pasal}</span>
                                            </div>

                                            <button
                                                onClick={() => handleSendMessage(currentSpotlight.query)}
                                                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
                                            >
                                                Pelajari Selengkapnya
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto pb-4">
                                {messages.map((msg) => (
                                    <ChatBubble
                                        key={msg.id}
                                        message={msg}
                                        onRegenerate={() => handleSendMessage(msg.content)}
                                        onOpenSource={setActiveSource}
                                    />
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start px-4 py-4">
                                        <div className="bg-zinc-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-zinc-100">
                    <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>

                {/* Source Panel */}
                <SourcePanel source={activeSource} onClose={() => setActiveSource(null)} />

            </div>
        </div>
    );
}
