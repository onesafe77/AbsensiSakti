import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ClipboardCheck, Check, X, ArrowLeft, ArrowRight, Save, Trash2, Plus, Smartphone, Tablet } from "lucide-react";
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
import { MobileSidakLayout } from "@/components/sidak/mobile-sidak-layout";
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
                sessionId: draft.sessionId,
                ordinal: draft.records.length + 1
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
                sessionId: draft.sessionId,
                ordinal: draft.observers.length + 1
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

    const renderBottomAction = () => {
        if (draft.step === 1) {
            return (
                <Button
                    className="w-full h-12 text-lg font-medium shadow-md shadow-teal-200 dark:shadow-none bg-teal-600 hover:bg-teal-700"
                    disabled={!draft.headerData.lokasi || handleCreateSession.isPending}
                    onClick={() => handleCreateSession.mutate(draft.headerData)}
                >
                    {handleCreateSession.isPending ? "Membuat Sesi..." : "Lanjut ke Audit"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            );
        }
        if (draft.step === 2) {
            return (
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => handleAddRecord.mutate(currentRecord)}
                        disabled={!currentRecord.namaPengawas || !canAddMore || handleAddRecord.isPending}
                        className="w-full h-12 text-lg font-medium shadow-md shadow-teal-200 dark:shadow-none bg-teal-600 hover:bg-teal-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {canAddMore ? "Simpan Audit" : "Batas Maksimal"}
                    </Button>
                    {draft.records.length > 0 && (
                        <Button
                            onClick={() => setDraft(prev => ({ ...prev, step: 3 }))}
                            variant="outline"
                            className="w-full h-12 border-2 border-gray-200"
                        >
                            Lanjut ke Observer ({draft.records.length})
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                </div>
            );
        }
        if (draft.step === 3) {
            return (
                <Button
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 dark:shadow-none"
                    onClick={handleFinish}
                    disabled={draft.observers.length === 0}
                >
                    <Save className="w-5 h-5 mr-3" /> SELESAI & SIMPAN
                </Button>
            );
        }
        return null;
    };


    return (
        <>
            <DraftRecoveryDialog
                open={showRecoveryDialog}
                onRestore={handleRestoreDraft}
                onDiscard={ignoreDraft}
                timestamp={draftTimestamp}
                formType="digital"
            />

            <MobileSidakLayout
                title="Sidak Digital"
                subtitle="Form Inspeksi Pengawas Digital"
                step={draft.step}
                totalSteps={3}
                onBack={() => navigate("/workspace/sidak")}
                bottomAction={renderBottomAction()}
            >
                {draft.step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-teal-50 dark:bg-teal-900/10 p-4 rounded-2xl border border-teal-100 dark:border-teal-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                                    <ClipboardCheck className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-teal-900 dark:text-teal-100">Info Pelaksanaan</h3>
                            </div>
                            <p className="text-xs text-teal-600 dark:text-teal-300">
                                Audit penggunaan aplikasi digital di lapangan.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-gray-500">Tanggal</Label>
                                    <Input
                                        type="date"
                                        className="h-12 bg-gray-50 border-gray-200"
                                        value={draft.headerData.tanggal}
                                        onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, tanggal: e.target.value } }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-gray-500">Waktu</Label>
                                    <Input
                                        type="time"
                                        className="h-12 bg-gray-50 border-gray-200"
                                        value={draft.headerData.waktu}
                                        onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, waktu: e.target.value } }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-500">Shift</Label>
                                <Select
                                    value={draft.headerData.shift}
                                    onValueChange={(val) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, shift: val } }))}
                                >
                                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Shift 1">Shift 1</SelectItem>
                                        <SelectItem value="Shift 2">Shift 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-500">Departemen</Label>
                                <Input
                                    className="h-12 bg-gray-50 border-gray-200"
                                    value={draft.headerData.departemen}
                                    onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, departemen: e.target.value } }))}
                                    placeholder="Contoh: Produksi, IT"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-500">Lokasi</Label>
                                <Input
                                    className="h-12 bg-gray-50 border-gray-200"
                                    placeholder="Contoh: Office, Control Room"
                                    value={draft.headerData.lokasi}
                                    onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, lokasi: e.target.value } }))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {draft.step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats */}
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Total Pengawas</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{draft.records.length} <span className="text-sm text-gray-400 font-normal">/ {maxRecords}</span></p>
                            </div>
                            <div className="h-10 w-10 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600">
                                <Tablet className="h-5 w-5" />
                            </div>
                        </div>

                        {/* Input Form */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Audit Pengawas Digital</h2>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-gray-500">Nama Pengawas <span className="text-red-500">*</span></Label>
                                    <Input
                                        className="h-12 bg-gray-50 border-gray-200"
                                        value={currentRecord.namaPengawas}
                                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, namaPengawas: e.target.value }))}
                                        placeholder="Nama Pengawas"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">NIK</Label>
                                        <Input
                                            className="h-12 bg-gray-50 border-gray-200"
                                            value={currentRecord.nik}
                                            onChange={(e) => setCurrentRecord(prev => ({ ...prev, nik: e.target.value }))}
                                            placeholder="NIK"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Jabatan</Label>
                                        <Input
                                            className="h-12 bg-gray-50 border-gray-200"
                                            value={currentRecord.jabatan}
                                            onChange={(e) => setCurrentRecord(prev => ({ ...prev, jabatan: e.target.value }))}
                                            placeholder="Jabatan"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Checklist */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 px-1">Checklist Digital</h3>

                                <div className="space-y-3">
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                        <p className="font-medium text-sm">Menggunakan Aplikasi?</p>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentRecord(prev => ({ ...prev, appUsage: true }))}
                                                variant={currentRecord.appUsage ? "default" : "outline"}
                                                className={cn("flex-1 h-12", currentRecord.appUsage ? "bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-200 dark:shadow-none" : "hover:bg-teal-50 text-gray-600")}
                                            >
                                                <Smartphone className="w-4 h-4 mr-2" />
                                                Ya (Aktif)
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentRecord(prev => ({ ...prev, appUsage: false }))}
                                                variant={!currentRecord.appUsage ? "destructive" : "outline"}
                                                className={cn("flex-1 h-12", !currentRecord.appUsage ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 dark:shadow-none" : "hover:bg-red-50 text-gray-600")}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Tidak
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                        <p className="font-medium text-sm">Pelaporan Tepat Waktu?</p>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentRecord(prev => ({ ...prev, timelyReporting: true }))}
                                                variant={currentRecord.timelyReporting ? "default" : "outline"}
                                                className={cn("flex-1 h-12", currentRecord.timelyReporting ? "bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-200 dark:shadow-none" : "hover:bg-teal-50 text-gray-600")}
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Ya (Tepat)
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentRecord(prev => ({ ...prev, timelyReporting: false }))}
                                                variant={!currentRecord.timelyReporting ? "destructive" : "outline"}
                                                className={cn("flex-1 h-12", !currentRecord.timelyReporting ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 dark:shadow-none" : "hover:bg-red-50 text-gray-600")}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Terlambat
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                        <p className="font-medium text-sm">Kualitas Feedback</p>
                                        <Select
                                            value={currentRecord.feedbackQuality}
                                            onValueChange={(val) => setCurrentRecord(prev => ({ ...prev, feedbackQuality: val }))}
                                        >
                                            <SelectTrigger className="h-12 bg-white border-gray-200">
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

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-gray-500">Keterangan</Label>
                                    <Textarea
                                        value={currentRecord.keterangan}
                                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, keterangan: e.target.value }))}
                                        placeholder="Catatan tambahan"
                                        className="bg-gray-50 border-gray-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recent List */}
                        {draft.records.length > 0 && (
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-3">Tercatat ({draft.records.length})</h3>
                                <div className="space-y-2">
                                    {draft.records.map((rec, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm">{rec.namaPengawas}</p>
                                                <p className="text-xs text-gray-500">{rec.jabatan}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className={cn("text-[10px] font-bold px-2 py-1 rounded", rec.appUsage ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                                    APP
                                                </div>
                                                <div className={cn("text-[10px] font-bold px-2 py-1 rounded", rec.timelyReporting ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                                    RPT
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {draft.step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Data Pengawas</h3>
                                <p className="text-sm text-gray-500">Minimal 1 observer wajib diisi</p>
                            </div>

                            {/* Observer List */}
                            {draft.observers.length > 0 && (
                                <div className="grid gap-3">
                                    {draft.observers.map((obs, idx) => (
                                        <div key={idx} className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{obs.nama}</p>
                                                <p className="text-xs text-gray-500">{obs.perusahaan}</p>
                                            </div>
                                            <Check className="h-5 w-5 text-green-600" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Observer Form */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <p className="font-semibold text-gray-900 dark:text-white">Tambah Pengawas Baru</p>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Nama Pengawas</Label>
                                        <Input
                                            value={currentObserver.nama}
                                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, nama: e.target.value }))}
                                            className="bg-gray-50 border-gray-200"
                                            placeholder="Nama Lengkap"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">NIK</Label>
                                        <Input
                                            value={currentObserver.nik}
                                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, nik: e.target.value }))}
                                            className="bg-gray-50 border-gray-200"
                                            placeholder="NIK"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Perusahaan</Label>
                                        <Input
                                            value={currentObserver.perusahaan}
                                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, perusahaan: e.target.value }))}
                                            className="bg-gray-50 border-gray-200"
                                            placeholder="PT..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Tanda Tangan</Label>
                                        <SignaturePad
                                            onSave={(dataUrl) => setCurrentObserver(prev => ({ ...prev, tandaTangan: dataUrl }))}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleAddObserver.mutate(currentObserver)}
                                        disabled={!currentObserver.nama || !currentObserver.tandaTangan || handleAddObserver.isPending}
                                        className="w-full mt-2"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Tambahkan
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </MobileSidakLayout>
        </>
    );
}
