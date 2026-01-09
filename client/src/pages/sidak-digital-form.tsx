
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ClipboardCheck, Check, X, ArrowLeft, ArrowRight, Save, Trash2, Plus, Smartphone, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SignaturePad } from "@/components/sidak/signature-pad";
import { DraftRecoveryDialog } from "@/components/sidak/draft-recovery-dialog";
import { useSidakDraft } from "@/hooks/use-sidak-draft";
import { cn } from "@/lib/utils";

interface DigitalRecord {
    ordinal?: number;
    namaPengawas: string;
    nik: string;
    jabatan: string;
    appUsage: boolean;
    timelyReporting: boolean;
    feedbackQuality: string;
    keterangan: string;
}

interface Observer {
    nama: string;
    nik: string;
    perusahaan: string;
    tandaTangan: string;
}

interface DigitalDraftData {
    step: number;
    sessionId: string | null;
    headerData: {
        tanggal: string;
        shift: string;
        waktu: string;
        lokasi: string;
        departemen: string;
    };
    records: DigitalRecord[];
    observers: Observer[];
}

const initialDraftData: DigitalDraftData = {
    step: 1,
    sessionId: null,
    headerData: {
        tanggal: new Date().toISOString().split('T')[0],
        shift: "Shift 1",
        waktu: "",
        lokasi: "",
        departemen: ""
    },
    records: [],
    observers: []
};

export default function SidakDigitalForm() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Draft system
    const {
        saveDraft,
        ignoreDraft,
        restoreDraft,
        showRecoveryDialog,
        draftTimestamp
    } = useSidakDraft<DigitalDraftData>({
        key: "digital",
        initialData: initialDraftData,
        debounceMs: 1500
    });

    const [draft, setDraft] = useState<DigitalDraftData>(initialDraftData);

    const [currentRecord, setCurrentRecord] = useState<DigitalRecord>({
        namaPengawas: "",
        nik: "",
        jabatan: "",
        appUsage: true,
        timelyReporting: true,
        feedbackQuality: "Baik",
        keterangan: ""
    });

    const [currentObserver, setCurrentObserver] = useState<Observer>({
        nama: "",
        nik: "",
        perusahaan: "",
        tandaTangan: ""
    });

    // Auto-save
    useEffect(() => {
        saveDraft(draft);
    }, [draft, saveDraft]);

    // Initial time set
    useEffect(() => {
        if (!draft.headerData.waktu && draft.step === 1) {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            setDraft(prev => ({
                ...prev,
                headerData: { ...prev.headerData, waktu: timeString }
            }));
        }
    }, []);

    const handleRestoreDraft = async () => {
        const restored = restoreDraft();
        if (restored) {
            setDraft(restored);
            toast({ title: "Draft Dipulihkan", description: "Melanjutkan pengisian form sebelumnya." });
        }
    };

    const handleCreateSession = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                ...data,
                activityPhotos: []
            };
            const res = await apiRequest("/api/sidak-digital", "POST", payload);
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, sessionId: data.id, step: 2 }));
            toast({ title: "Sesi Dimulai", description: "Silakan audit penggunaan digital apps." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddRecord = useMutation({
        mutationFn: async (record: DigitalRecord) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-digital/${draft.sessionId}/records`, "POST", {
                ...record,
                sessionId: draft.sessionId
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, records: [...prev.records, data] }));
            setCurrentRecord({
                namaPengawas: "",
                nik: "",
                jabatan: "",
                appUsage: true,
                timelyReporting: true,
                feedbackQuality: "Baik",
                keterangan: ""
            });
            toast({ title: "Data Disimpan", description: "Audit digital berhasil ditambahkan." });
        }
    });

    const handleAddObserver = useMutation({
        mutationFn: async (observer: Observer) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-digital/${draft.sessionId}/observers`, "POST", {
                ...observer,
                sessionId: draft.sessionId
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, observers: [...prev.observers, data] }));
            setCurrentObserver({ nama: "", nik: "", perusahaan: "", tandaTangan: "" });
            toast({ title: "Observer Disimpan" });
        }
    });

    const handleFinish = () => {
        navigate("/workspace/sidak/digital/history");
        toast({ title: "Selesai", description: "Laporan SIDAK Digital telah disimpan." });
    };

    const maxRecords = 20;
    const canAddMore = draft.records.length < maxRecords;
    const progress = (draft.step / 3) * 100;

    const renderStep1 = () => (
        <Card className="border-t-4 border-t-teal-600 shadow-lg">
            <CardHeader>
                <CardTitle>Informasi Pelaksanaan Sidak</CardTitle>
                <CardDescription>Isi detail waktu dan lokasi inspeksi digital</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input
                            type="date"
                            value={draft.headerData.tanggal}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, tanggal: e.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Waktu</Label>
                        <Input
                            type="time"
                            value={draft.headerData.waktu}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, waktu: e.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Shift</Label>
                        <Select
                            value={draft.headerData.shift}
                            onValueChange={(val) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, shift: val } }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Shift 1">Shift 1</SelectItem>
                                <SelectItem value="Shift 2">Shift 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Departemen</Label>
                        <Input
                            value={draft.headerData.departemen}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, departemen: e.target.value } }))}
                            placeholder="Contoh: Dispatch, IT"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Lokasi</Label>
                        <Input
                            placeholder="Contoh: Office, Control Room"
                            value={draft.headerData.lokasi}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, lokasi: e.target.value } }))}
                        />
                    </div>
                </div>
                <Button
                    className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={!draft.headerData.lokasi || handleCreateSession.isPending}
                    onClick={() => handleCreateSession.mutate(draft.headerData)}
                >
                    {handleCreateSession.isPending ? "Membuat Sesi..." : "Lanjut ke Audit"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <Card className="bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-300">
                <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-teal-700 dark:text-teal-200">
                        {draft.records.length} / {maxRecords}
                    </p>
                    <p className="text-sm text-teal-600 dark:text-teal-300">Pengawas Diaudit</p>
                </CardContent>
            </Card>

            <Card className="border-t-4 border-t-teal-600 shadow-md">
                <CardHeader>
                    <CardTitle>Audit Pengawas Digital</CardTitle>
                    <CardDescription>Cek penggunaan aplikasi dan pelaporan digital</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nama Pengawas <span className="text-red-500">*</span></Label>
                            <Input
                                value={currentRecord.namaPengawas}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, namaPengawas: e.target.value }))}
                                placeholder="Nama Pengawas"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>NIK</Label>
                            <Input
                                value={currentRecord.nik}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, nik: e.target.value }))}
                                placeholder="NIK"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Jabatan</Label>
                            <Input
                                value={currentRecord.jabatan}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, jabatan: e.target.value }))}
                                placeholder="Contoh: Foreman, Supervisor"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kualitas Feedback</Label>
                            <Select
                                value={currentRecord.feedbackQuality}
                                onValueChange={(val) => setCurrentRecord(prev => ({ ...prev, feedbackQuality: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Baik">Baik</SelectItem>
                                    <SelectItem value="Cukup">Cukup</SelectItem>
                                    <SelectItem value="Kurang">Kurang</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <Label className="font-semibold">Menggunakan Aplikasi?</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, appUsage: true }))}
                                    variant={currentRecord.appUsage ? "default" : "outline"}
                                    className={cn("flex-1", currentRecord.appUsage ? "bg-teal-600 hover:bg-teal-700" : "")}
                                >
                                    <Smartphone className="w-4 h-4 mr-2" />
                                    Ya (Aktif)
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, appUsage: false }))}
                                    variant={!currentRecord.appUsage ? "destructive" : "outline"}
                                    className="flex-1"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Tidak
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <Label className="font-semibold">Pelaporan Tepat Waktu?</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, timelyReporting: true }))}
                                    variant={currentRecord.timelyReporting ? "default" : "outline"}
                                    className={cn("flex-1", currentRecord.timelyReporting ? "bg-teal-600 hover:bg-teal-700" : "")}
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Ya (Tepat)
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, timelyReporting: false }))}
                                    variant={!currentRecord.timelyReporting ? "destructive" : "outline"}
                                    className="flex-1"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Terlambat
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <Label>Keterangan</Label>
                        <Textarea
                            value={currentRecord.keterangan}
                            onChange={(e) => setCurrentRecord(prev => ({ ...prev, keterangan: e.target.value }))}
                            placeholder="Catatan tambahan (opsional)"
                        />
                    </div>

                    <Button
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-4"
                        onClick={() => handleAddRecord.mutate(currentRecord)}
                        disabled={!currentRecord.namaPengawas || !canAddMore || handleAddRecord.isPending}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {canAddMore ? "Tambahkan Hasil Audit" : "Batas Maksimal Mencapai"}
                    </Button>
                </CardContent>
            </Card>

            {draft.records.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Daftar Audit ({draft.records.length})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                                        <th className="p-2 border">No</th>
                                        <th className="p-2 border">Pengawas</th>
                                        <th className="p-2 border text-center">App</th>
                                        <th className="p-2 border text-center">Lapor</th>
                                        <th className="p-2 border">Feedback</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draft.records.map((rec, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-2 border">{idx + 1}</td>
                                            <td className="p-2 border">
                                                <div className="font-bold">{rec.namaPengawas}</div>
                                                <div className="text-xs text-gray-500">{rec.jabatan}</div>
                                            </td>
                                            <td className="p-2 border text-center">
                                                {rec.appUsage ?
                                                    <Check className="w-5 h-5 text-green-600 mx-auto" /> :
                                                    <X className="w-5 h-5 text-red-500 mx-auto" />
                                                }
                                            </td>
                                            <td className="p-2 border text-center">
                                                {rec.timelyReporting ?
                                                    <Check className="w-5 h-5 text-green-600 mx-auto" /> :
                                                    <X className="w-5 h-5 text-red-500 mx-auto" />
                                                }
                                            </td>
                                            <td className="p-2 border text-center font-bold text-teal-700">
                                                {rec.feedbackQuality}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setDraft(prev => ({ ...prev, step: 3 }))} className="bg-teal-600 hover:bg-teal-700 text-white">
                                Lanjut ke Observer <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderStep3 = () => (
        <Card className="border-t-4 border-t-teal-600 shadow-lg">
            <CardHeader>
                <CardTitle>Data Pengawas (Observer)</CardTitle>
                <CardDescription>Masukkan data pengawas dan tanda tangan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nama Pengawas <span className="text-red-500">*</span></Label>
                        <Input
                            value={currentObserver.nama}
                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, nama: e.target.value }))}
                            placeholder="Nama Lengkap"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>NIK</Label>
                        <Input
                            value={currentObserver.nik}
                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, nik: e.target.value }))}
                            placeholder="NIK"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Perusahaan</Label>
                        <Input
                            value={currentObserver.perusahaan}
                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, perusahaan: e.target.value }))}
                            placeholder="PT ..."
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Tanda Tangan <span className="text-red-500">*</span></Label>
                    <div className="border rounded-md p-2 bg-gray-50">
                        <SignaturePad
                            onSave={(dataUrl) => setCurrentObserver(prev => ({ ...prev, tandaTangan: dataUrl }))}
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-teal-600 text-white mt-4"
                    onClick={() => handleAddObserver.mutate(currentObserver)}
                    disabled={!currentObserver.nama || !currentObserver.tandaTangan || handleAddObserver.isPending}
                >
                    <Plus className="w-4 h-4 mr-2" /> Tambahkan Observer
                </Button>

                {draft.observers.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="font-semibold">Daftar Observer ({draft.observers.length})</h4>
                        {draft.observers.map((obs, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded bg-white">
                                <div>
                                    <div className="font-medium">{obs.nama}</div>
                                    <div className="text-xs text-gray-500">{obs.nik} - {obs.perusahaan}</div>
                                </div>
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                        ))}
                        <Separator />
                        <Button className="w-full h-14 text-lg font-bold bg-green-700 hover:bg-green-800 text-white" onClick={handleFinish}>
                            <Save className="w-5 h-5 mr-3" /> SELESAI & SIMPAN
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <>
            <DraftRecoveryDialog
                open={showRecoveryDialog}
                onRestore={handleRestoreDraft}
                onDiscard={ignoreDraft}
                timestamp={draftTimestamp}
                formType="digital"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                <div className="bg-teal-600 text-white p-4 shadow-md sticky top-0 z-50">
                    <div className="container max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-3">
                            <Button variant="ghost" size="icon" className="hover:bg-teal-700 text-white" onClick={() => navigate("/workspace/sidak")}>
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold">Sidak Digital</h1>
                                <p className="text-xs text-teal-100">Form Inspeksi Pengawas Digital</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Langkah {draft.step} dari 3</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3 bg-teal-800" />
                        </div>
                    </div>
                </div>

                <div className="container max-w-2xl mx-auto p-4 space-y-6">
                    {draft.step === 1 && renderStep1()}
                    {draft.step === 2 && renderStep2()}
                    {draft.step === 3 && renderStep3()}
                </div>
            </div>
        </>
    );
}
