
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ClipboardCheck, Check, X, ArrowLeft, ArrowRight, Save, Trash2, Plus, Gauge } from "lucide-react";
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

interface KecepatanRecord {
    ordinal?: number;
    noKendaraan: string;
    tipeUnit: string;
    arahMuatan: boolean; // Muatan = true
    arahKosongan: boolean; // Kosongan = true
    kecepatanMph: string;
    kecepatanKph: string;
    keterangan: string;
}

interface Observer {
    nama: string;
    nik: string;
    perusahaan: string;
    tandaTangan: string;
}

interface KecepatanDraftData {
    step: number;
    sessionId: string | null;
    headerData: {
        tanggal: string;
        waktu: string;
        shift: string;
        lokasi: string;
        subLokasi: string;
        batasKecepatanKph: number;
    };
    records: KecepatanRecord[];
    observers: Observer[];
}

const initialDraftData: KecepatanDraftData = {
    step: 1,
    sessionId: null,
    headerData: {
        tanggal: new Date().toISOString().split('T')[0],
        waktu: "",
        shift: "Shift 1",
        lokasi: "",
        subLokasi: "",
        batasKecepatanKph: 40
    },
    records: [],
    observers: []
};

export default function SidakKecepatanForm() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Draft system
    const {
        saveDraft,
        ignoreDraft,
        restoreDraft,
        showRecoveryDialog,
        draftTimestamp
    } = useSidakDraft<KecepatanDraftData>({
        key: "kecepatan",
        initialData: initialDraftData,
        debounceMs: 1500
    });

    const [draft, setDraft] = useState<KecepatanDraftData>(initialDraftData);

    const [currentRecord, setCurrentRecord] = useState<KecepatanRecord>({
        noKendaraan: "",
        tipeUnit: "",
        arahMuatan: false,
        arahKosongan: true, // Default kosongan
        kecepatanMph: "",
        kecepatanKph: "",
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

    // Auto convert MPH to KPH (approx) if user inputs MPH
    useEffect(() => {
        if (currentRecord.kecepatanMph && !currentRecord.kecepatanKph) {
            const mph = parseFloat(currentRecord.kecepatanMph);
            if (!isNaN(mph)) {
                setCurrentRecord(prev => ({ ...prev, kecepatanKph: (mph * 1.60934).toFixed(0) }));
            }
        }
    }, [currentRecord.kecepatanMph]);

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
            const res = await apiRequest("/api/sidak-kecepatan", "POST", payload); // Verify endpoint
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, sessionId: data.id, step: 2 }));
            toast({ title: "Sesi Dimulai", description: "Silakan input data kecepatan unit." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddRecord = useMutation({
        mutationFn: async (record: KecepatanRecord) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-kecepatan/${draft.sessionId}/records`, "POST", {
                ...record,
                sessionId: draft.sessionId,
                kecepatanKph: record.kecepatanKph.toString(),
                kecepatanMph: record.kecepatanMph ? record.kecepatanMph.toString() : null,
            });
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, records: [...prev.records, data] }));
            setCurrentRecord({
                noKendaraan: "",
                tipeUnit: "",
                arahMuatan: false,
                arahKosongan: true,
                kecepatanMph: "",
                kecepatanKph: "",
                keterangan: ""
            });
            toast({ title: "Data Disimpan", description: "Unit berhasil ditambahkan." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        }
    });

    const handleAddObserver = useMutation({
        mutationFn: async (observer: Observer) => {
            if (!draft.sessionId) throw new Error("No active session");
            const res = await apiRequest(`/api/sidak-kecepatan/${draft.sessionId}/observers`, "POST", {
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
        navigate("/workspace/sidak/kecepatan/history");
        toast({ title: "Selesai", description: "Laporan SIDAK Kecepatan telah disimpan." });
    };

    const maxRecords = 20;
    const canAddMore = draft.records.length < maxRecords;
    const progress = (draft.step / 3) * 100;

    const renderStep1 = () => (
        <Card className="border-t-4 border-t-red-500 shadow-lg">
            <CardHeader>
                <CardTitle>Informasi Pelaksanaan Sidak</CardTitle>
                <CardDescription>Isi detail waktu, lokasi, dan batas kecepatan</CardDescription>
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
                        <Label>Batas Kecepatan (KM/Jam)</Label>
                        <Input
                            type="number"
                            value={draft.headerData.batasKecepatanKph}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, batasKecepatanKph: parseInt(e.target.value) || 0 } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Lokasi</Label>
                        <Input
                            placeholder="Contoh: Hauling Road KM 10"
                            value={draft.headerData.lokasi}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, lokasi: e.target.value } }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Sub Lokasi (Opsional)</Label>
                        <Input
                            placeholder="Detail lokasi..."
                            value={draft.headerData.subLokasi}
                            onChange={(e) => setDraft(prev => ({ ...prev, headerData: { ...prev.headerData, subLokasi: e.target.value } }))}
                        />
                    </div>
                </div>
                <Button
                    className="w-full mt-4 bg-red-600 hover:bg-red-700"
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
            <Card className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300">
                <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                        {draft.records.length} / {maxRecords}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">Unit Diperiksa</p>
                </CardContent>
            </Card>

            <Card className="border-t-4 border-t-red-500 shadow-md">
                <CardHeader>
                    <CardTitle>Input Kecepatan Unit</CardTitle>
                    <CardDescription>Catat kecepatan unit yang melintas melalui speed gun</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nomor Unit <span className="text-red-500">*</span></Label>
                            <Input
                                value={currentRecord.noKendaraan}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, noKendaraan: e.target.value }))}
                                placeholder="Contoh: DT-104"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipe Unit <span className="text-red-500">*</span></Label>
                            <Input
                                value={currentRecord.tipeUnit}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, tipeUnit: e.target.value }))}
                                placeholder="Contoh: OHT 777"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Kondisi Muatan</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    className={`flex-1 ${currentRecord.arahMuatan ? "bg-red-600 hover:bg-red-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, arahMuatan: true, arahKosongan: false }))}
                                >
                                    Muatan (Loaded)
                                </Button>
                                <Button
                                    type="button"
                                    className={`flex-1 ${currentRecord.arahKosongan ? "bg-green-600 hover:bg-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, arahMuatan: false, arahKosongan: true }))}
                                >
                                    Kosongan (Empty)
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Kecepatan (MPH)</Label>
                            <Input
                                type="number"
                                value={currentRecord.kecepatanMph}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, kecepatanMph: e.target.value }))}
                                placeholder="Speed Gun Reading"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kecepatan (KM/H) <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                value={currentRecord.kecepatanKph}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, kecepatanKph: e.target.value }))}
                                placeholder="Otomatis atau Manual"
                            />
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
                        className="w-full bg-red-600 hover:bg-red-700 mt-4"
                        onClick={() => handleAddRecord.mutate(currentRecord)}
                        disabled={!currentRecord.noKendaraan || !currentRecord.tipeUnit || !currentRecord.kecepatanKph || !canAddMore || handleAddRecord.isPending}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {canAddMore ? "Tambahkan Data Unit" : "Batas Maksimal Mencapai"}
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
                                        <th className="p-2 border">Unit</th>
                                        <th className="p-2 border">Muatan</th>
                                        <th className="p-2 border text-center">Kecepatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draft.records.map((rec, idx) => {
                                        const isOverspeed = (parseInt(rec.kecepatanKph) || 0) > draft.headerData.batasKecepatanKph;
                                        return (
                                            <tr key={idx} className={`border-b ${isOverspeed ? "bg-red-50" : ""}`}>
                                                <td className="p-2 border">{idx + 1}</td>
                                                <td className="p-2 border">
                                                    <div className="font-bold">{rec.noKendaraan}</div>
                                                    <div className="text-xs text-gray-500">{rec.tipeUnit}</div>
                                                </td>
                                                <td className="p-2 border text-xs">
                                                    {rec.arahMuatan ? "LOADED" : "EMPTY"}
                                                </td>
                                                <td className={`p-2 border text-center font-bold ${isOverspeed ? "text-red-600" : "text-green-600"}`}>
                                                    {rec.kecepatanKph} KM/H
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setDraft(prev => ({ ...prev, step: 3 }))} className="bg-red-600 hover:bg-red-700">
                                Lanjut ke Observer <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderStep3 = () => (
        <Card className="border-t-4 border-t-red-500 shadow-lg">
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
                    className="w-full bg-red-600 mt-4"
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
                formType="kecepatan"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                <div className="bg-red-600 text-white p-4 shadow-md sticky top-0 z-50">
                    <div className="container max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-3">
                            <Button variant="ghost" size="icon" className="hover:bg-red-700 text-white" onClick={() => navigate("/workspace/sidak")}>
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold">Sidak Kecepatan</h1>
                                <p className="text-xs text-red-100">Form Observasi Kecepatan Unit</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Langkah {draft.step} dari 3</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3 bg-red-800" />
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
