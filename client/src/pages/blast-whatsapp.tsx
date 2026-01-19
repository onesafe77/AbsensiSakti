import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Image, Video, Send, Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BlastType = "text" | "image" | "video";

interface BlastResult {
    success: boolean;
    totalRecipients: number;
    sent: number;
    failed: number;
    failedNumbers: string[];
}

export default function BlastWhatsApp() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [blastType, setBlastType] = useState<BlastType>("text");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [result, setResult] = useState<BlastResult | null>(null);

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (files: File[]) => {
            const urls: string[] = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");
                const data = await response.json();
                urls.push(data.url || data.filePath);
            }
            return urls;
        },
        onSuccess: (urls) => {
            setUploadedUrls(urls);
            toast({ title: "Upload berhasil", description: `${urls.length} file berhasil diupload` });
        },
        onError: (error) => {
            toast({ title: "Upload gagal", description: String(error), variant: "destructive" });
        },
    });

    // Blast mutation
    const blastMutation = useMutation({
        mutationFn: async (data: { subject: string; message: string; type: BlastType; mediaUrls?: string[] }) => {
            let endpoint = "/api/whatsapp/blast/text";
            let body: any = { subject: data.subject, message: data.message };

            if (data.type === "image") {
                endpoint = "/api/whatsapp/blast/image";
                body.imageUrls = data.mediaUrls;
            } else if (data.type === "video") {
                endpoint = "/api/whatsapp/blast/video";
                body.videoUrl = data.mediaUrls?.[0];
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Blast failed");
            }
            return response.json();
        },
        onSuccess: (data) => {
            setResult(data);
            toast({
                title: "Blast Selesai!",
                description: `${data.sent} terkirim, ${data.failed} gagal`,
                variant: data.failed > 0 ? "destructive" : "default",
            });
        },
        onError: (error) => {
            toast({ title: "Blast gagal", description: String(error), variant: "destructive" });
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (blastType === "video" && files.length > 1) {
            toast({ title: "Maksimal 1 video", variant: "destructive" });
            return;
        }
        setUploadedFiles(files);
        setUploadedUrls([]);
    };

    const handleUpload = () => {
        if (uploadedFiles.length > 0) {
            uploadMutation.mutate(uploadedFiles);
        }
    };

    const handleRemoveFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setUploadedUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleBlast = () => {
        if (!message.trim()) {
            toast({ title: "Pesan wajib diisi", variant: "destructive" });
            return;
        }

        if (blastType !== "text" && uploadedUrls.length === 0) {
            toast({ title: "Upload file terlebih dahulu", variant: "destructive" });
            return;
        }

        blastMutation.mutate({
            subject,
            message,
            type: blastType,
            mediaUrls: uploadedUrls,
        });
    };

    const resetForm = () => {
        setSubject("");
        setMessage("");
        setUploadedFiles([]);
        setUploadedUrls([]);
        setResult(null);
    };

    // Test send state and mutation
    const [testPhone, setTestPhone] = useState("");
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const testSendMutation = useMutation({
        mutationFn: async () => {
            const body: any = {
                phone: testPhone,
                message,
                type: blastType,
            };

            if (blastType === "image" && uploadedUrls.length > 0) {
                body.imageUrl = uploadedUrls[0];
            } else if (blastType === "video" && uploadedUrls.length > 0) {
                body.videoUrl = uploadedUrls[0];
            }

            const response = await fetch("/api/whatsapp/test-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Test send failed");
            }
            return data;
        },
        onSuccess: (data) => {
            setTestResult({ success: true, message: "Pesan test berhasil dikirim!" });
            toast({ title: "Test Berhasil", description: `Pesan berhasil dikirim ke ${testPhone}` });
        },
        onError: (error) => {
            setTestResult({ success: false, message: String(error) });
            toast({ title: "Test Gagal", description: String(error), variant: "destructive" });
        },
    });

    const handleTestSend = () => {
        if (!testPhone.trim()) {
            toast({ title: "Masukkan nomor test", variant: "destructive" });
            return;
        }
        if (!message.trim()) {
            toast({ title: "Pesan wajib diisi", variant: "destructive" });
            return;
        }
        if (blastType !== "text" && uploadedUrls.length === 0) {
            toast({ title: "Upload file terlebih dahulu", variant: "destructive" });
            return;
        }
        testSendMutation.mutate();
    };

    return (
        <div className="space-y-6 p-4 lg:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Blast WhatsApp
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Kirim pengumuman massal ke semua karyawan via WhatsApp
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Buat Pengumuman</CardTitle>
                        <CardDescription>
                            Pilih jenis pesan dan isi konten yang akan dikirim
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Subject */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Judul (untuk tracking internal)</Label>
                            <Input
                                id="subject"
                                placeholder="Contoh: Pengumuman Libur Natal 2026"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        {/* Blast Type */}
                        <div className="space-y-3">
                            <Label>Jenis Pesan</Label>
                            <RadioGroup
                                value={blastType}
                                onValueChange={(v) => {
                                    setBlastType(v as BlastType);
                                    setUploadedFiles([]);
                                    setUploadedUrls([]);
                                }}
                                className="grid grid-cols-3 gap-4"
                            >
                                <div className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${blastType === "text" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 hover:border-gray-300"}`}>
                                    <RadioGroupItem value="text" id="text" />
                                    <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                                        <MessageSquare className="w-4 h-4" /> Teks
                                    </Label>
                                </div>
                                <div className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${blastType === "image" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 hover:border-gray-300"}`}>
                                    <RadioGroupItem value="image" id="image" />
                                    <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                                        <Image className="w-4 h-4" /> Gambar
                                    </Label>
                                </div>
                                <div className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${blastType === "video" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 hover:border-gray-300"}`}>
                                    <RadioGroupItem value="video" id="video" />
                                    <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                                        <Video className="w-4 h-4" /> Video
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <Label htmlFor="message">Isi Pesan *</Label>
                            <Textarea
                                id="message"
                                placeholder="Ketik pesan pengumuman di sini..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                            />
                        </div>

                        {/* Media URL Input (for image/video) */}
                        {blastType !== "text" && (
                            <div className="space-y-3">
                                <Label>
                                    {blastType === "image" ? "URL Gambar (URL Publik)" : "URL Video (URL Publik)"}
                                </Label>
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    ⚠️ WhatsApp API membutuhkan URL yang dapat diakses dari internet. Gunakan link dari hosting gambar (imgbb.com, imgur, Google Drive publik, dll).
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://example.com/image.jpg"
                                        value={uploadedUrls[0] || ""}
                                        onChange={(e) => setUploadedUrls([e.target.value])}
                                        className="flex-1"
                                    />
                                </div>
                                {blastType === "image" && uploadedUrls[0] && (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="URL gambar tambahan (opsional)"
                                            value={uploadedUrls[1] || ""}
                                            onChange={(e) => setUploadedUrls(prev => [prev[0] || "", e.target.value])}
                                            className="flex-1"
                                        />
                                    </div>
                                )}
                                {uploadedUrls[0] && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        URL disiapkan: {uploadedUrls.filter(u => u).length} media
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Test Send Section */}
                        <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg space-y-3">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                🧪 Test Kirim ke Satu Nomor
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Contoh: 081234567890"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTestSend}
                                    disabled={testSendMutation.isPending || !message.trim()}
                                >
                                    {testSendMutation.isPending ? "Mengirim..." : "Test Kirim"}
                                </Button>
                            </div>
                            {testResult && (
                                <p className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                    {testResult.message}
                                </p>
                            )}
                        </div>

                        {/* Send Button */}
                        <Button
                            onClick={handleBlast}
                            disabled={blastMutation.isPending || !message.trim()}
                            className="w-full bg-red-600 hover:bg-red-700"
                        >
                            {blastMutation.isPending ? (
                                <>Mengirim...</>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Kirim ke Semua Karyawan
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview & Result Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preview & Hasil</CardTitle>
                        <CardDescription>
                            Lihat preview pesan dan hasil pengiriman
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Preview */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-semibold text-sm text-gray-500 mb-2">Preview Pesan:</h4>
                            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                                <p className="whitespace-pre-wrap text-sm">
                                    {message || "Pesan akan muncul di sini..."}
                                </p>
                                {uploadedUrls.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        + {uploadedUrls.length} {blastType === "image" ? "gambar" : "video"} terlampir
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress */}
                        {blastMutation.isPending && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Mengirim pesan...</p>
                                <Progress value={undefined} className="animate-pulse" />
                                <p className="text-xs text-gray-400">
                                    Proses pengiriman batch (10 pesan/batch, delay 5 detik)
                                </p>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="space-y-3">
                                <Alert variant={result.failed > 0 ? "destructive" : "default"}>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Blast selesai! {result.sent} terkirim, {result.failed} gagal dari {result.totalRecipients} penerima.
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{result.totalRecipients}</p>
                                        <p className="text-xs text-gray-500">Total</p>
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{result.sent}</p>
                                        <p className="text-xs text-gray-500">Terkirim</p>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                                        <p className="text-xs text-gray-500">Gagal</p>
                                    </div>
                                </div>

                                {result.failedNumbers.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                        <p className="font-medium">Nomor gagal:</p>
                                        <p className="truncate">{result.failedNumbers.slice(0, 5).join(", ")}
                                            {result.failedNumbers.length > 5 && ` +${result.failedNumbers.length - 5} lainnya`}
                                        </p>
                                    </div>
                                )}

                                <Button variant="outline" onClick={resetForm} className="w-full">
                                    Buat Pengumuman Baru
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
