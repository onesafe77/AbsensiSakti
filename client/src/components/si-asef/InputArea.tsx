import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, ArrowUp, X } from 'lucide-react';

interface InputAreaProps {
    onSendMessage: (message: string, image?: string) => void;
    isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        // Pass undefined if no image
        onSendMessage(input, selectedImage || undefined);

        setInput('');
        setSelectedImage(null);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    // --- Microphone Functionality ---
    const handleMicClick = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        if (!('webkitSpeechRecognition' in window)) {
            alert("Browser Anda tidak mendukung fitur Speech-to-Text. Silakan gunakan Chrome atau Edge.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'id-ID'; // Indonesian
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // --- File Upload Functionality ---
    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset value so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pb-6">

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <div
                className={`
            relative bg-white border transition-all duration-300 ease-in-out
            ${isFocused
                        ? 'border-emerald-400 ring-4 ring-emerald-500/10 shadow-xl shadow-emerald-500/5'
                        : 'border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-zinc-300'}
            rounded-[26px] overflow-hidden
        `}
            >
                {/* Image Preview Chip */}
                {selectedImage && (
                    <div className="px-4 pt-4 pb-0 flex items-start animate-fade-in-up">
                        <div className="relative group">
                            <img
                                src={selectedImage}
                                alt="Preview"
                                className="h-16 w-16 object-cover rounded-xl border border-zinc-200 shadow-sm"
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110 transform duration-200"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Mendengarkan..." : "Tanya Mystic tentang regulasi K3..."}
                    className={`
            w-full max-h-[200px] min-h-[56px] bg-transparent border-0 focus:ring-0 text-zinc-800 placeholder:text-zinc-400 resize-none py-4 px-5 text-[16px] leading-relaxed
            ${isListening ? 'animate-pulse placeholder:text-emerald-600 font-medium' : ''}
          `}
                    rows={1}
                    style={{ overflowY: input.length > 100 ? 'auto' : 'hidden' }}
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleFileClick}
                            className="p-2.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 group relative"
                            title="Upload Image"
                        >
                            <Paperclip className="w-5 h-5" strokeWidth={2} />
                            <span className="hidden group-hover:block absolute left-0 -top-10 bg-zinc-800 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap shadow-lg font-medium">
                                Upload Gambar
                            </span>
                        </button>
                        <button
                            onClick={handleMicClick}
                            className={`
                        p-2.5 rounded-xl transition-all duration-200 relative group
                        ${isListening ? 'text-white bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' : 'text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50'}
                    `}
                            title="Voice Input"
                        >
                            <Mic className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        className={`
                p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center
                ${isLoading || (!input.trim() && !selectedImage)
                                ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0'}
              `}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ArrowUp className="w-5 h-5" strokeWidth={3} />
                        )}
                    </button>
                </div>
            </div>
            <p className="text-center text-[10px] text-zinc-400 mt-4 font-medium tracking-wide opacity-60">
                AI dapat membuat kesalahan. Selalu verifikasi regulasi K3 yang penting.
            </p>
        </div>
    );
};

export default InputArea;
