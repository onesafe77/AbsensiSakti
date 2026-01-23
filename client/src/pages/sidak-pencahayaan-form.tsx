import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ClipboardCheck, Check, X, ArrowLeft, ArrowRight, Save, Trash2, Plus, Lightbulb, Sun, Eye } from "lucide-react";
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

interface PencahayaanRecord {
    ordinal?: number;
    titikPengambilan: string;
    sumberPenerangan: string;
    jenisPengukuran: string;
    intensitasLux: string;
    jarakDariSumber: string;
    secaraVisual: string;
    keterangan: string;
}

interface Observer {
    nama: string;
    nik: string;
    perusahaan: string;
    tandaTangan: string;
}

interface PencahayaanDraftData {
    step: number;
    sessionId: string | null;
    headerData: {
        tanggal: string;
        shift: string;
        waktu: string;
        lokasi: string;
        departemen: string;
        penanggungJawab: string;
    };
    records: PencahayaanRecord[];
    observers: Observer[];
}

const initialDraftData: PencahayaanDraftData = {
    step: 1,
    sessionId: null,
    headerData: {
        tanggal: new Date().toISOString().split('T')[0],
        shift: "Shift 1",
        waktu: "",
        lokasi: "",
        departemen: "",
        penanggungJawab: ""
    },
    records: [],
    observers: []
};

export default function SidakPencahayaanForm() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Draft system
    const {
        saveDraft,
        ignoreDraft,
        restoreDraft,
        showRecoveryDialog,
        draftTimestamp
    } = useSidakDraft<PencahayaanDraftData>({
        key: "pencahayaan",
        initialData: initialDraftData,
        debounceMs: 1500
    });

    const [draft, setDraft] = useState<PencahayaanDraftData>(initialDraftData);

    const [currentRecord, setCurrentRecord] = useState<PencahayaanRecord>({
        titikPengambilan: "",
        sumberPenerangan: "",
        jenisPengukuran: "",
        intensitasLux: "",
        jarakDariSumber: "",
        secaraVisual: "",
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
            const res = await apiRequest("/api/sidak-pencahayaan", "POST", payload);
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, sessionId: data.id, step: 2 }));
            toast({ title: "Sesi Dimulai", description: "Silakan input data pengukuran cahaya." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddRecord = useMutation({
        mutationFn: async (record: PencahayaanRecord) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-pencahayaan/${draft.sessionId}/records`, "POST", {
                ...record,
                intensitasLux: parseInt(record.intensitasLux) || 0,
                sessionId: draft.sessionId,
                ordinal: draft.records.length + 1
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, records: [...prev.records, data] }));
            setCurrentRecord({
                titikPengambilan: "",
                sumberPenerangan: "",
                jenisPengukuran: "",
                intensitasLux: "",
                jarakDariSumber: "",
                secaraVisual: "",
                keterangan: ""
            });
            toast({ title: "Data Disimpan", description: "Titik pengukuran berhasil ditambahkan." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddObserver = useMutation({
        mutationFn: async (observer: Observer) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-pencahayaan/${draft.sessionId}/observers`, "POST", {
                ...observer,
                sessionId: draft.sessionId
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, observers: [...prev.observers, data] }));
            setCurrentObserver({ nama: "", nik: "", perusahaan: "", tandaTangan: "" });
            toast({ title: "Observer Disimpan" });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleFinish = () => {
        navigate("/workspace/sidak/pencahayaan/history");
        toast({ title: "Selesai", description: "Laporan SIDAK Pencahayaan telah disimpan." });
    };

    const maxRecords = 20;
    const canAddMore = draft.records.length < maxRecords;


    const renderBottomAction = () => {
        if (draft.step === 1) {
            return (
                <Button
                    className="w-full h-12 text-lg font-medium shadow-md shadow-amber-200 dark:shadow-none bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={!draft.headerData.lokasi || handleCreateSession.isPending}
                    onClick={() => handleCreateSession.mutate(draft.headerData)}
                >
                    {handleCreateSession.isPending ? "Membuat Sesi..." : "Lanjut ke Pengukuran"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            );
        }
        if (draft.step === 2) {
            return (
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => handleAddRecord.mutate(currentRecord)}
                        disabled={!currentRecord.titikPengambilan || !currentRecord.intensitasLux || !canAddMore || handleAddRecord.isPending}
                        className="w-full h-12 text-lg font-medium shadow-md shadow-amber-200 dark:shadow-none bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {canAddMore ? "Simpan Titik" : "Batas Maksimal"}
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
                formType="pencahayaan"
            />

            <MobileSidakLayout
                title="Sidak Pencahayaan"
                subtitle="Form Pengukuran Intensitas Cahaya"
                step={draft.step}
                totalSteps={3}
                onBack={() => navigate("/workspace/sidak")}
                bottomAction={renderBottomAction()}
            >
                {draft.step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                                    <ClipboardCheck className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Info Pelaksanaan</h3>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-300">
                                Isi detail waktu dan lokasi pengukuran pencahayaan.
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
                                    placeholder="Contoh: Plant, Mining"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-500">Lokasi</Label>
                                <Input
                                    className="h-12 bg-gray-50 border-gray-200"
                                    placeholder="Contoh: Workshop, Office"
                                    value={draft.headerData.lokasi}
                                    onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, lokasi: e.target.value } }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-500">PJ Area</Label>
                                <Input
                                    className="h-12 bg-gray-50 border-gray-200"
                                    value={draft.headerData.penanggungJawab}
                                    onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, penanggungJawab: e.target.value } }))}
                                    placeholder="Nama PIC Area"
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
                                <p className="text-xs text-gray-500 uppercase font-semibold">Titik Diukur</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{draft.records.length} <span className="text-sm text-gray-400 font-normal">/ {maxRecords}</span></p>
                            </div>
                            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                        </div>

                        {/* Input Form */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Input Hasil Pengukuran</h2>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-gray-500">Titik Pengambilan <span className="text-red-500">*</span></Label>
                                    <Input
                                        className="h-12 bg-gray-50 border-gray-200"
                                        value={currentRecord.titikPengambilan}
                                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, titikPengambilan: e.target.value }))}
                                        placeholder="Contoh: Meja Kerja, Lorong"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Sumber Cahaya</Label>
                                        <Input
                                            className="h-12 bg-gray-50 border-gray-200"
                                            value={currentRecord.sumberPenerangan}
                                            onChange={(e) => setCurrentRecord(prev => ({ ...prev, sumberPenerangan: e.target.value }))}
                                            placeholder="Lampu/Matahari"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Jenis Ukur</Label>
                                        <Select
                                            value={currentRecord.jenisPengukuran}
                                            onValueChange={(val) => setCurrentRecord(prev => ({ ...prev, jenisPengukuran: val }))}
                                        >
                                            <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                                                <SelectValue placeholder="Pilih Jenis" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Penerangan Umum">Umum</SelectItem>
                                                <SelectItem value="Penerangan Lokal">Lokal</SelectItem>
                                                <SelectItem value="Darurat">Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold uppercase text-gray-500">Intensitas (Lux) <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-12 bg-white border-gray-200 font-bold text-lg text-amber-600 pl-10"
                                                    value={currentRecord.intensitasLux}
                                                    onChange={(e) => setCurrentRecord(prev => ({ ...prev, intensitasLux: e.target.value }))}
                                                    placeholder="0"
                                                />
                                                <Sun className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold uppercase text-gray-500">Jarak Sumber</Label>
                                                <Input
                                                    className="h-12 bg-white border-gray-200"
                                                    value={currentRecord.jarakDariSumber}
                                                    onChange={(e) => setCurrentRecord(prev => ({ ...prev, jarakDariSumber: e.target.value }))}
                                                    placeholder="2 Meter"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold uppercase text-gray-500">Kondisi Visual</Label>
                                                <Select
                                                    value={currentRecord.secaraVisual}
                                                    onValueChange={(val) => setCurrentRecord(prev => ({ ...prev, secaraVisual: val }))}
                                                >
                                                    <SelectTrigger className="h-12 bg-white border-gray-200">
                                                        <SelectValue placeholder="Pilih" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Terang">Terang</SelectItem>
                                                        <SelectItem value="Cukup">Cukup</SelectItem>
                                                        <SelectItem value="Redup">Redup</SelectItem>
                                                        <SelectItem value="Gelap">Gelap</SelectItem>
                                                        <SelectItem value="Silau">Silau</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
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
                                                <p className="font-medium text-sm">{rec.titikPengambilan}</p>
                                                <p className="text-xs text-gray-500">{rec.jenisPengukuran} • <span className="text-amber-600">{rec.secaraVisual}</span></p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                    {rec.intensitasLux} Lux
                                                </span>
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
