
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ClipboardCheck, Check, X, ArrowLeft, ArrowRight, Save, Trash2, Plus } from "lucide-react";
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

interface AntrianRecord {
    ordinal?: number;
    namaNik: string;
    noLambung: string;
    handbrakeAktif: boolean;
    jarakUnitAman: boolean;
    keterangan: string;
}

interface Observer {
    nama: string;
    jabatan: string;
    tandaTangan: string;
}

interface AntrianDraftData {
    step: number;
    sessionId: string | null;
    headerData: {
        tanggal: string;
        waktu: string;
        shift: string;
        perusahaan: string;
        departemen: string;
        lokasi: string;
    };
    records: AntrianRecord[];
    observers: Observer[];
}

const initialDraftData: AntrianDraftData = {
    step: 1,
    sessionId: null,
    headerData: {
        tanggal: new Date().toISOString().split('T')[0],
        waktu: "",
        shift: "Shift 1",
        perusahaan: "PT Borneo Indobara",
        departemen: "HSE",
        lokasi: ""
    },
    records: [],
    observers: []
};

export default function SidakAntrianForm() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Draft system
    const {
        saveDraft,
        ignoreDraft,
        restoreDraft,
        showRecoveryDialog,
        draftTimestamp
    } = useSidakDraft<AntrianDraftData>({
        key: "antrian",
        initialData: initialDraftData,
        debounceMs: 1500
    });

    const [draft, setDraft] = useState<AntrianDraftData>(initialDraftData);

    const [currentRecord, setCurrentRecord] = useState<AntrianRecord>({
        namaNik: "",
        noLambung: "",
        handbrakeAktif: true,
        jarakUnitAman: true,
        keterangan: ""
    });

    const [currentObserver, setCurrentObserver] = useState<Observer>({
        nama: "",
        jabatan: "",
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
            // Logic to handle restored session ID validity could be added here
            setDraft(restored);
            toast({ title: "Draft Dipulihkan", description: "Melanjutkan pengisian form sebelumnya." });
        }
    };

    const handleCreateSession = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                ...data,
                activityPhotos: [] // Placeholder
            };
            const res = await apiRequest("/api/sidak-antrian", "POST", payload);
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, sessionId: data.id, step: 2 }));
            toast({ title: "Sesi Dimulai", description: "Silakan input data pemeriksaan." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddRecord = useMutation({
        mutationFn: async (record: AntrianRecord) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-antrian/${draft.sessionId}/records`, "POST", {
                ...record,
                sessionId: draft.sessionId
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, records: [...prev.records, data] }));
            setCurrentRecord({
                namaNik: "",
                noLambung: "",
                handbrakeAktif: true,
                jarakUnitAman: true,
                keterangan: ""
            });
            toast({ title: "Data Disimpan", description: "Unit berhasil ditambahkan ke daftar." });
        }
    });

    const handleAddObserver = useMutation({
        mutationFn: async (observer: Observer) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-antrian/${draft.sessionId}/observers`, "POST", {
                ...observer,
                sessionId: draft.sessionId
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, observers: [...prev.observers, data] }));
            setCurrentObserver({ nama: "", jabatan: "", tandaTangan: "" });
            toast({ title: "Observer Disimpan" });
        }
    });

    const handleFinish = () => {
        navigate("/workspace/sidak/antrian/history");
        toast({ title: "Selesai", description: "Laporan SIDAK Antrian telah disimpan." });
    };

    const maxRecords = 10;
    const canAddMore = draft.records.length < maxRecords;
    const progress = (draft.step / 3) * 100;

    const renderStep1 = () => (
        <Card className="border-t-4 border-t-orange-500 shadow-lg">
            <CardHeader>
                <CardTitle>Informasi Pelaksanaan Sidak</CardTitle>
                <CardDescription>Isi detail waktu dan lokasi pelaksanaan observasi antrian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tanggal Pelaksanaan</Label>
                        <Input
                            type="date"
                            value={draft.headerData.tanggal}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, tanggal: e.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Jam Pelaksanaan</Label>
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
                        <Label>Perusahaan</Label>
                        <Input
                            value={draft.headerData.perusahaan}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, perusahaan: e.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Departemen</Label>
                        <Input
                            value={draft.headerData.departemen}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, departemen: e.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Lokasi</Label>
                        <Input
                            placeholder="Contoh: Loading Point PIT XYZ"
                            value={draft.headerData.lokasi}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, lokasi: e.target.value } }))}
                        />
                    </div>
                </div>
                <Button
                    className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                    disabled={!draft.headerData.lokasi || handleCreateSession.isPending}
                    onClick={() => handleCreateSession.mutate(draft.headerData)}
                >
                    {handleCreateSession.isPending ? "Membuat Sesi..." : "Lanjut ke Pemeriksaan"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <Card className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300">
                <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {draft.records.length} / {maxRecords}
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Unit Terperiksa</p>
                </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500 shadow-md">
                <CardHeader>
                    <CardTitle>Input Data Pemeriksaan</CardTitle>
                    <CardDescription>Masukkan data unit dan hasil observasi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nama & NIK (Manual) <span className="text-red-500">*</span></Label>
                            <Input
                                value={currentRecord.namaNik}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, namaNik: e.target.value }))}
                                placeholder="Ketik Nama dan NIK Karyawan"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nomor Lambung</Label>
                            <Input
                                value={currentRecord.noLambung}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, noLambung: e.target.value }))}
                                placeholder="Nomor Unit"
                            />
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-base font-medium">1. Apakah Handbrake Aktif?</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={currentRecord.handbrakeAktif ? "default" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, handbrakeAktif: true }))}
                                    className={currentRecord.handbrakeAktif ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                                >
                                    <Check className="mr-2 h-4 w-4" /> Ya
                                </Button>
                                <Button
                                    type="button"
                                    variant={!currentRecord.handbrakeAktif ? "destructive" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, handbrakeAktif: false }))}
                                    className="flex-1"
                                >
                                    <X className="mr-2 h-4 w-4" /> Tidak
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-medium">2. Apakah Jarak Unit Aman?</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={currentRecord.jarakUnitAman ? "default" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, jarakUnitAman: true }))}
                                    className={currentRecord.jarakUnitAman ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                                >
                                    <Check className="mr-2 h-4 w-4" /> Ya
                                </Button>
                                <Button
                                    type="button"
                                    variant={!currentRecord.jarakUnitAman ? "destructive" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, jarakUnitAman: false }))}
                                    className="flex-1"
                                >
                                    <X className="mr-2 h-4 w-4" /> Tidak
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
                        className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                        onClick={() => handleAddRecord.mutate(currentRecord)}
                        disabled={!currentRecord.namaNik || !canAddMore || handleAddRecord.isPending}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {canAddMore ? "Tambahkan Data" : "Batas Maksimal Mencapai"}
                    </Button>
                </CardContent>
            </Card>

            {draft.records.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Daftar Unit ({draft.records.length})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                                        <th className="p-2 border">No</th>
                                        <th className="p-2 border">Nama/Unit</th>
                                        <th className="p-2 border text-center">Handbrake</th>
                                        <th className="p-2 border text-center">Jarak</th>
                                        <th className="p-2 border">Ket</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draft.records.map((rec, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-2 border">{idx + 1}</td>
                                            <td className="p-2 border">
                                                <div className="font-medium">{rec.namaNik}</div>
                                                <div className="text-xs text-gray-500">{rec.noLambung || '-'}</div>
                                            </td>
                                            <td className={`p-2 border text-center font-bold ${rec.handbrakeAktif ? "text-green-600" : "text-red-600"}`}>
                                                {rec.handbrakeAktif ? "YA" : "TIDAK"}
                                            </td>
                                            <td className={`p-2 border text-center font-bold ${rec.jarakUnitAman ? "text-green-600" : "text-red-600"}`}>
                                                {rec.jarakUnitAman ? "YA" : "TIDAK"}
                                            </td>
                                            <td className="p-2 border truncate max-w-[150px]">{rec.keterangan}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setDraft(prev => ({ ...prev, step: 3 }))} className="bg-orange-600 hover:bg-orange-700">
                                Lanjut ke Observer <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderStep3 = () => (
        <Card className="border-t-4 border-t-orange-500 shadow-lg">
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
                        <Label>Jabatan</Label>
                        <Input
                            value={currentObserver.jabatan}
                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, jabatan: e.target.value }))}
                            placeholder="Posisi / Jabatan"
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
                    className="w-full bg-blue-600 mt-4"
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
                                    <div className="text-xs text-gray-500">{obs.jabatan}</div>
                                </div>
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                        ))}
                        <Separator />
                        <Button className="w-full h-14 text-lg font-bold bg-green-700 hover:bg-green-800" onClick={handleFinish}>
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
                formType="antrian"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                <div className="bg-orange-600 text-white p-4 shadow-md sticky top-0 z-50">
                    <div className="container max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-3">
                            <Button variant="ghost" size="icon" className="hover:bg-orange-700 text-white" onClick={() => navigate("/workspace/sidak")}>
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold">Sidak Antrian</h1>
                                <p className="text-xs text-orange-100">Form Observasi Antrian Unit</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Langkah {draft.step} dari 3</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3 bg-orange-800" />
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
