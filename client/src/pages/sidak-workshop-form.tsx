import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ClipboardCheck, Check, X, ArrowLeft, ArrowRight, Save, Trash2, Plus, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SignaturePad } from "@/components/sidak/signature-pad";
import { DraftRecoveryDialog } from "@/components/sidak/draft-recovery-dialog";
import { useSidakDraft } from "@/hooks/use-sidak-draft";
import { MobileSidakLayout } from "@/components/sidak/mobile-sidak-layout";
import { cn } from "@/lib/utils";

interface WorkshopRecord {
    ordinal?: number;
    namaAlat: string;
    kondisi: boolean;
    kebersihan: boolean;
    sertifikasi: boolean;
    keterangan: string;
}

interface Observer {
    nama: string;
    nik: string;
    perusahaan: string;
    tandaTangan: string;
}

interface WorkshopDraftData {
    step: number;
    sessionId: string | null;
    headerData: {
        tanggal: string;
        shift: string;
        waktu: string;
        lokasi: string;
        departemen: string;
    };
    records: WorkshopRecord[];
    observers: Observer[];
}

const initialDraftData: WorkshopDraftData = {
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

export default function SidakWorkshopForm() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Draft system
    const {
        saveDraft,
        ignoreDraft,
        restoreDraft,
        showRecoveryDialog,
        draftTimestamp
    } = useSidakDraft<WorkshopDraftData>({
        key: "workshop",
        initialData: initialDraftData,
        debounceMs: 1500
    });

    const [draft, setDraft] = useState<WorkshopDraftData>(initialDraftData);

    const [currentRecord, setCurrentRecord] = useState<WorkshopRecord>({
        namaAlat: "",
        kondisi: true,
        kebersihan: true,
        sertifikasi: true,
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
            const res = await apiRequest("/api/sidak-workshop", "POST", payload);
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, sessionId: data.id, step: 2 }));
            toast({ title: "Sesi Dimulai", description: "Silakan inspeksi peralatan workshop." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddRecord = useMutation({
        mutationFn: async (record: WorkshopRecord) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-workshop/${draft.sessionId}/records`, "POST", {
                ...record,
                sessionId: draft.sessionId,
                ordinal: draft.records.length + 1
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, records: [...prev.records, data] }));
            setCurrentRecord({
                namaAlat: "",
                kondisi: true,
                kebersihan: true,
                sertifikasi: true,
                keterangan: ""
            });
            toast({ title: "Data Disimpan", description: "Alat berhasil ditambahkan." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddObserver = useMutation({
        mutationFn: async (observer: Observer) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-workshop/${draft.sessionId}/observers`, "POST", {
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
        navigate("/workspace/sidak/workshop/history");
        toast({ title: "Selesai", description: "Laporan SIDAK Workshop telah disimpan." });
    };

    const maxRecords = 20;
    const canAddMore = draft.records.length < maxRecords;


    const renderBottomAction = () => {
        if (draft.step === 1) {
            return (
                <Button
                    className="w-full h-12 text-lg font-medium shadow-md shadow-indigo-200 dark:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={!draft.headerData.lokasi || !draft.headerData.waktu || handleCreateSession.isPending}
                    onClick={() => handleCreateSession.mutate(draft.headerData)}
                >
                    {handleCreateSession.isPending ? "Membuat Sesi..." : "Lanjut ke Inspeksi"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            );
        }
        if (draft.step === 2) {
            return (
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => handleAddRecord.mutate(currentRecord)}
                        disabled={!currentRecord.namaAlat || !canAddMore || handleAddRecord.isPending}
                        className="w-full h-12 text-lg font-medium shadow-md shadow-indigo-200 dark:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {canAddMore ? "Simpan Alat" : "Batas Maksimal"}
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
                formType="workshop"
            />

            <MobileSidakLayout
                title="Sidak Workshop"
                subtitle="Inspeksi Peralatan Workshop"
                step={draft.step}
                totalSteps={3}
                onBack={() => navigate("/workspace/sidak")}
                bottomAction={renderBottomAction()}
            >
                {/* STEP 1 */}
                {draft.step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                    <ClipboardCheck className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Info Pelaksanaan</h3>
                            </div>
                            <p className="text-xs text-indigo-600 dark:text-indigo-300">
                                Lengkapi data waktu dan lokasi inspeksi workshop.
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
                                    value={draft.headerData.departemen}
                                    onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, departemen: e.target.value } }))}
                                    className="h-12 bg-gray-50 border-gray-200"
                                    placeholder="Contoh: Maintenance, Welding"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-500">Lokasi Workshop</Label>
                                <Input
                                    className="h-12 bg-gray-50 border-gray-200"
                                    placeholder="Contoh: Workshop Tyre"
                                    value={draft.headerData.lokasi}
                                    onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, lokasi: e.target.value } }))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {draft.step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats */}
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Alat Diinspeksi</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{draft.records.length} <span className="text-sm text-gray-400 font-normal">/ {maxRecords}</span></p>
                            </div>
                            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
                                <Wrench className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Form Inspeksi</h2>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-5 shadow-sm">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Nama Alat / Mesin <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={currentRecord.namaAlat}
                                            onChange={(e) => setCurrentRecord(prev => ({ ...prev, namaAlat: e.target.value }))}
                                            placeholder="Contoh: Mesin Bubut"
                                            className="h-12 bg-gray-50 border-gray-200"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-2">
                                        {/* Physical Condition */}
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <Label className="font-semibold text-sm">Kondisi Fisik</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => setCurrentRecord(prev => ({ ...prev, kondisi: true }))}
                                                    variant={currentRecord.kondisi ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(currentRecord.kondisi ? "bg-indigo-600 hover:bg-indigo-700" : "")}
                                                >
                                                    <Check className="w-3 h-3 mr-1" /> Baik
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => setCurrentRecord(prev => ({ ...prev, kondisi: false }))}
                                                    variant={!currentRecord.kondisi ? "destructive" : "outline"}
                                                    size="sm"
                                                >
                                                    <X className="w-3 h-3 mr-1" /> Rusak
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Cleanliness */}
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <Label className="font-semibold text-sm">Kebersihan</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => setCurrentRecord(prev => ({ ...prev, kebersihan: true }))}
                                                    variant={currentRecord.kebersihan ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(currentRecord.kebersihan ? "bg-indigo-600 hover:bg-indigo-700" : "")}
                                                >
                                                    <Check className="w-3 h-3 mr-1" /> Rapi
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => setCurrentRecord(prev => ({ ...prev, kebersihan: false }))}
                                                    variant={!currentRecord.kebersihan ? "destructive" : "outline"}
                                                    size="sm"
                                                >
                                                    <X className="w-3 h-3 mr-1" /> Kotor
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Certification */}
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <Label className="font-semibold text-sm">Sertifikasi / Tag</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => setCurrentRecord(prev => ({ ...prev, sertifikasi: true }))}
                                                    variant={currentRecord.sertifikasi ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(currentRecord.sertifikasi ? "bg-indigo-600 hover:bg-indigo-700" : "")}
                                                >
                                                    <Check className="w-3 h-3 mr-1" /> Valid
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => setCurrentRecord(prev => ({ ...prev, sertifikasi: false }))}
                                                    variant={!currentRecord.sertifikasi ? "destructive" : "outline"}
                                                    size="sm"
                                                >
                                                    <X className="w-3 h-3 mr-1" /> Expired
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

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
                                    {draft.records.map((rec, idx) => {
                                        const hasIssue = !rec.kondisi || !rec.kebersihan || !rec.sertifikasi;
                                        return (
                                            <div key={idx} className={cn("p-3 rounded-lg border shadow-sm flex justify-between items-center", hasIssue ? "bg-red-50 border-red-100" : "bg-white border-gray-100")}>
                                                <div>
                                                    <p className="font-medium text-sm">{rec.namaAlat}</p>
                                                    <div className="flex gap-1 mt-1">
                                                        <Badge variant={rec.kondisi ? "outline" : "destructive"} className="text-[10px] h-5 px-1">Fisik</Badge>
                                                        <Badge variant={rec.kebersihan ? "outline" : "destructive"} className="text-[10px] h-5 px-1">Area</Badge>
                                                        <Badge variant={rec.sertifikasi ? "outline" : "destructive"} className="text-[10px] h-5 px-1">Tag</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {hasIssue ?
                                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">TEMUAN</span>
                                                        :
                                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">BAIK</span>
                                                    }
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3 */}
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
                                                <p className="text-xs text-gray-500">{obs.perusahaan} • {obs.nik}</p>
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
