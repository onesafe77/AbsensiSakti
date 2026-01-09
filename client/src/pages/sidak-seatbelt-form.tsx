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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SignaturePad } from "@/components/sidak/signature-pad";
import { Checkbox } from "@/components/ui/checkbox";
import { DraftRecoveryDialog } from "@/components/sidak/draft-recovery-dialog";
import { useSidakDraft } from "@/hooks/use-sidak-draft";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Employee } from "@shared/schema";

interface SeatbeltRecord {
    ordinal?: number; // Added for tracking
    nama: string;
    nik: string;
    nomorLambung: string;
    perusahaan: string;
    seatbeltDriverCondition: boolean;
    seatbeltPassengerCondition: boolean;
    seatbeltDriverUsage: boolean;
    seatbeltPassengerUsage: boolean;
    keterangan: string;
}

interface Observer {
    nama: string;
    nik: string;
    perusahaan: string;
    jabatan: string;
    signatureDataUrl: string;
}

interface SeatbeltDraftData {
    step: number;
    sessionId: string | null;
    headerData: {
        tanggal: string;
        waktu: string;
        shift: string;
        lokasi: string;
    };
    records: SeatbeltRecord[];
    observers: Observer[];
}

const initialDraftData: SeatbeltDraftData = {
    step: 1,
    sessionId: null,
    headerData: {
        tanggal: new Date().toISOString().split('T')[0],
        waktu: "",
        shift: "Shift 1",
        lokasi: ""
    },
    records: [],
    observers: []
};

function getCurrentShift(): string {
    const now = new Date();
    const hour = now.getHours();
    // SHIFT 1: 06:00 - 18:00
    // SHIFT 2: 18:00 - 06:00
    if (hour >= 6 && hour < 18) {
        return "Shift 1";
    } else {
        return "Shift 2";
    }
}

export default function SidakSeatbeltForm() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Draft recovery system
    const {
        saveDraft,
        clearDraft,
        restoreDraft,
        ignoreDraft,
        showRecoveryDialog,
        draftTimestamp
    } = useSidakDraft<SeatbeltDraftData>({
        key: "seatbelt",
        initialData: initialDraftData,
        debounceMs: 1500
    });

    const [draft, setDraft] = useState<SeatbeltDraftData>(initialDraftData);
    const [currentRecord, setCurrentRecord] = useState<SeatbeltRecord>({
        nama: "",
        nik: "",
        nomorLambung: "",
        perusahaan: "",
        seatbeltDriverCondition: true,
        seatbeltPassengerCondition: true,
        seatbeltDriverUsage: true,
        seatbeltPassengerUsage: true,
        keterangan: ""
    });

    const [currentObserver, setCurrentObserver] = useState<Observer>({
        nama: "",
        nik: "",
        perusahaan: "",
        jabatan: "",
        signatureDataUrl: ""
    });

    // Calculate progress
    const progress = (draft.step / 3) * 100;
    const maxRecords = 10;
    const canAddMore = draft.records.length < maxRecords;

    // Autocomplete state
    const [searchOpen, setSearchOpen] = useState(false);
    const [nameSearch, setNameSearch] = useState("");

    useEffect(() => {
        // Set default draft if new
        if (!draft.headerData.waktu) {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            setDraft(prev => ({
                ...prev,
                headerData: {
                    ...prev.headerData,
                    waktu: timeString,
                    shift: getCurrentShift()
                }
            }));
        }
    }, []);

    // Auto-save effect - save current form state to draft
    useEffect(() => {
        saveDraft(draft);
    }, [draft, saveDraft]);

    // Handle draft restoration
    const handleRestoreDraft = async () => {
        const restoredData = restoreDraft();
        if (restoredData) {
            // If the draft was from before sessionId was saved, create a new session
            if (!restoredData.sessionId && restoredData.step > 1) {
                try {
                    const response = await apiRequest("/api/sidak-seatbelt", "POST", restoredData.headerData);
                    setDraft({ ...restoredData, sessionId: response.id });
                    toast({
                        title: "Draft Dipulihkan",
                        description: "Data SIDAK Seatbelt sebelumnya berhasil dipulihkan dan sesi baru dibuat",
                    });
                } catch (error: any) {
                    toast({
                        title: "Error",
                        description: "Gagal membuat sesi baru. Silakan mulai dari awal.",
                        variant: "destructive",
                    });
                    setDraft({ ...restoredData, step: 1 });
                    return;
                }
            } else {
                setDraft(restoredData);
                toast({
                    title: "Draft Dipulihkan",
                    description: "Data SIDAK Seatbelt sebelumnya berhasil dipulihkan",
                });
            }
        }
    };

    // Fetch employees for autocomplete (optional optimization: fetch on search)
    const { data: employees } = useQuery<Employee[]>({
        queryKey: ["/api/employees"],
        staleTime: 5 * 60 * 1000
    });

    const handleCreateSession = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                ...data,
                shiftType: data.shift || "Shift 1",
                activityPhotos: [], // Ensure this is sent as empty array if required
            };
            const res = await apiRequest("/api/sidak-seatbelt", "POST", payload);
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({ ...prev, sessionId: data.id, step: 2 }));
            toast({
                title: "Sesi Sidak Dimulai",
                description: "Silakan input data pemeriksaan seatbelt.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Gagal membuat sesi",
                description: error.message || "Terjadi kesalahan saat menyimpan data sesi.",
                variant: "destructive",
            });
        }
    });

    const handleAddRecord = useMutation({
        mutationFn: async (record: SeatbeltRecord) => {
            const res = await apiRequest(`/api/sidak-seatbelt/${draft.sessionId}/records`, "POST", record);
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({
                ...prev,
                records: [...prev.records, data]
            }));
            // Reset form
            setCurrentRecord({
                nama: "",
                nik: "",
                nomorLambung: "",
                perusahaan: "",
                seatbeltDriverCondition: true,
                seatbeltPassengerCondition: true,
                seatbeltDriverUsage: true,
                seatbeltPassengerUsage: true,
                keterangan: ""
            });
            toast({
                title: "Data Tersimpan",
                description: "Data pemeriksaan berhasil ditambahkan.",
            });
        }
    });

    const handleAddObserver = useMutation({
        mutationFn: async (observer: Observer) => {
            const res = await apiRequest(`/api/sidak-seatbelt/${draft.sessionId}/observers`, "POST", observer);
            return res;
        },
        onSuccess: (data) => {
            setDraft(prev => ({
                ...prev,
                observers: [...prev.observers, data]
            }));
            // Reset observer form
            setCurrentObserver({
                nama: "",
                nik: "",
                perusahaan: "",
                jabatan: "",
                signatureDataUrl: ""
            });
            toast({
                title: "Observer Ditambahkan",
                description: "Data pengawas berhasil disimpan.",
            });
        }
    });

    const handleFinish = () => {
        navigate("/workspace/sidak/seatbelt/history");
        toast({
            title: "Sidak Selesai",
            description: "Seluruh data sidak seatbelt telah disimpan.",
        });
    };

    // Filter employees based on search
    const filteredEmployees = employees?.filter(emp =>
        emp.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
        emp.id.toLowerCase().includes(nameSearch.toLowerCase())
    ).slice(0, 10) || [];

    const handleEmployeeSelect = (employee: Employee) => {
        setCurrentRecord(prev => ({
            ...prev,
            nama: employee.name,
            nik: employee.id,
            nomorLambung: employee.nomorLambung || "",
            perusahaan: employee.investorGroup || "PT Borneo Indobara"
        }));
        setNameSearch(employee.name);
        setSearchOpen(false);
    };

    // Render Steps
    const renderStep1 = () => (
        <Card className="border-t-4 border-t-green-500 shadow-lg">
            <CardHeader>
                <CardTitle>Informasi Pelaksanaan Sidak</CardTitle>
                <CardDescription>Isi detail waktu dan lokasi pelaksanaan sidak seatbelt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tanggal Pelaksanaan</Label>
                        <Input
                            type="date"
                            value={draft.headerData.tanggal}
                            onChange={(e) => setDraft(prev => ({
                                ...prev,
                                headerData: { ...prev.headerData, tanggal: e.target.value }
                            }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Jam Pelaksanaan</Label>
                        <Input
                            type="time"
                            value={draft.headerData.waktu}
                            onChange={(e) => setDraft(prev => ({
                                ...prev,
                                headerData: { ...prev.headerData, waktu: e.target.value }
                            }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Shift</Label>
                        <Select
                            value={draft.headerData.shift}
                            onValueChange={(val) => setDraft(prev => ({
                                ...prev,
                                headerData: { ...prev.headerData, shift: val }
                            }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Shift" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Shift 1">Shift 1 (06:00 - 18:00)</SelectItem>
                                <SelectItem value="Shift 2">Shift 2 (18:00 - 06:00)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Lokasi</Label>
                        <Input
                            placeholder="Contoh: KM 6, Simpang 4, dll"
                            value={draft.headerData.lokasi}
                            onChange={(e) => setDraft(prev => ({
                                ...prev,
                                headerData: { ...prev.headerData, lokasi: e.target.value }
                            }))}
                        />
                    </div>
                </div>

                <Button
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    disabled={!draft.headerData.lokasi || !draft.headerData.waktu}
                    onClick={() => handleCreateSession.mutate(draft.headerData)}
                >
                    {handleCreateSession.isPending ? "Menyimpan Sesi..." : "Lanjut ke Pemeriksaan"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Record Counter Card */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                            {draft.records.length} / {maxRecords}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">Unit Tercatat</p>
                    </div>
                </CardContent>
            </Card>

            {/* Input Form */}
            <Card className="border-t-4 border-t-green-500 shadow-md">
                <CardHeader>
                    <CardTitle>Input Data Pemeriksaan</CardTitle>
                    <CardDescription>Masukkan data unit dan hasil pemeriksaan seatbelt</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nama Driver/Karyawan <span className="text-red-500">*</span></Label>
                            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Input
                                        value={nameSearch || currentRecord.nama}
                                        onChange={(e) => {
                                            setNameSearch(e.target.value);
                                            setCurrentRecord(prev => ({ ...prev, nama: e.target.value }));
                                            setSearchOpen(true);
                                        }}
                                        placeholder="Ketik nama atau NIK untuk mencari..."
                                        className="w-full"
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Cari karyawan..."
                                            value={nameSearch}
                                            onValueChange={setNameSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>Tidak ada karyawan ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredEmployees.map((emp) => (
                                                    <CommandItem
                                                        key={emp.id}
                                                        value={emp.name}
                                                        onSelect={() => handleEmployeeSelect(emp)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{emp.name}</span>
                                                            <span className="text-xs text-gray-500">NIK: {emp.id}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Nomor Lambung</Label>
                            <Input
                                value={currentRecord.nomorLambung}
                                onChange={(e) => setCurrentRecord(prev => ({ ...prev, nomorLambung: e.target.value }))}
                                placeholder="CN-123 / DT-456"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Perusahaan <span className="text-red-500">*</span></Label>
                        <Input
                            value={currentRecord.perusahaan}
                            onChange={(e) => setCurrentRecord(prev => ({ ...prev, perusahaan: e.target.value }))}
                            placeholder="PT..."
                        />
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Kondisi Sabuk Pengaman (Berfungsi Baik?)</h3>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-4">
                            <Label className="font-medium text-sm sm:text-base">Kursi Pengemudi</Label>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltDriverCondition === true ? "default" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltDriverCondition: true }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Ya
                                </Button>
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltDriverCondition === false ? "destructive" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltDriverCondition: false }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Tidak
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-4">
                            <Label className="font-medium text-sm sm:text-base">Kursi Penumpang</Label>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltPassengerCondition === true ? "default" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltPassengerCondition: true }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Ya
                                </Button>
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltPassengerCondition === false ? "destructive" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltPassengerCondition: false }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Tidak
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Penggunaan Sabuk Pengaman (Benar?)</h3>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-4">
                            <Label className="font-medium text-sm sm:text-base">Pengemudi</Label>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltDriverUsage === true ? "default" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltDriverUsage: true }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Ya
                                </Button>
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltDriverUsage === false ? "destructive" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltDriverUsage: false }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Tidak
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-4">
                            <Label className="font-medium text-sm sm:text-base">Penumpang</Label>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltPassengerUsage === true ? "default" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltPassengerUsage: true }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Ya
                                </Button>
                                <Button
                                    type="button"
                                    variant={currentRecord.seatbeltPassengerUsage === false ? "destructive" : "outline"}
                                    onClick={() => setCurrentRecord(prev => ({ ...prev, seatbeltPassengerUsage: false }))}
                                    className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                                >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                                    Tidak
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Keterangan</Label>
                        <Textarea
                            value={currentRecord.keterangan}
                            onChange={(e) => setCurrentRecord(prev => ({ ...prev, keterangan: e.target.value }))}
                            placeholder="Catatan tambahan (optional)"
                            className="h-20"
                        />
                    </div>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAddRecord.mutate(currentRecord)}
                        disabled={!currentRecord.nama || !currentRecord.perusahaan || handleAddRecord.isPending || !canAddMore}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {canAddMore ? "Tambahkan Data" : `Maksimal ${maxRecords} Unit`}
                    </Button>

                    {!canAddMore && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 rounded-lg p-4 text-center">
                            <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                                Batas maksimal {maxRecords} unit tercapai
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* List Table */}
            {draft.records.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Data Tersimpan ({draft.records.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                                        <th className="p-2 border">No</th>
                                        <th className="p-2 border">Nama/Unit</th>
                                        <th className="p-2 border">Seatbelt Unit</th>
                                        <th className="p-2 border">Pemakaian</th>
                                        <th className="p-2 border">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draft.records.map((rec, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-2 border">{idx + 1}</td>
                                            <td className="p-2 border">
                                                <div className="font-medium">{rec.nama}</div>
                                                <div className="text-xs text-gray-500">{rec.nomorLambung || '-'} | {rec.perusahaan}</div>
                                            </td>
                                            <td className="p-2 border">
                                                <div className="flex flex-col gap-1">
                                                    <span className={rec.seatbeltDriverCondition ? "text-green-600" : "text-red-600"}>
                                                        Drv: {rec.seatbeltDriverCondition ? '✓' : '✗'}
                                                    </span>
                                                    <span className={rec.seatbeltPassengerCondition ? "text-green-600" : "text-red-600"}>
                                                        Psng: {rec.seatbeltPassengerCondition ? '✓' : '✗'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-2 border">
                                                <div className="flex flex-col gap-1">
                                                    <span className={rec.seatbeltDriverUsage ? "text-green-600" : "text-red-600"}>
                                                        Drv: {rec.seatbeltDriverUsage ? '✓' : '✗'}
                                                    </span>
                                                    <span className={rec.seatbeltPassengerUsage ? "text-green-600" : "text-red-600"}>
                                                        Psng: {rec.seatbeltPassengerUsage ? '✓' : '✗'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-2 border truncate max-w-[150px]">{rec.keterangan}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setDraft(prev => ({ ...prev, step: 3 }))} className="bg-green-600">
                                Lanjut ke Tanda Tangan Observer <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderStep3 = () => (
        <Card className="border-t-4 border-t-green-500 shadow-lg">
            <CardHeader>
                <CardTitle>Data Pengawas (Observer)</CardTitle>
                <CardDescription>Masukkan data pengawas dan tanda tangan (Input Manual)</CardDescription>
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
                        <Label>NIK <span className="text-red-500">*</span></Label>
                        <Input
                            value={currentObserver.nik}
                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, nik: e.target.value }))}
                            placeholder="NIK"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Jabatan <span className="text-red-500">*</span></Label>
                        <Input
                            value={currentObserver.jabatan}
                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, jabatan: e.target.value }))}
                            placeholder="Jabatan"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Perusahaan <span className="text-red-500">*</span></Label>
                        <Input
                            value={currentObserver.perusahaan}
                            onChange={(e) => setCurrentObserver(prev => ({ ...prev, perusahaan: e.target.value }))}
                            placeholder="Perusahaan"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Tanda Tangan Digital <span className="text-red-500">*</span></Label>
                    <div className="border rounded-md p-2 bg-gray-50">
                        <SignaturePad
                            onSave={(dataUrl) => setCurrentObserver(prev => ({ ...prev, signatureDataUrl: dataUrl }))}
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-blue-600 mt-4"
                    onClick={() => handleAddObserver.mutate(currentObserver)}
                    disabled={!currentObserver.nama || !currentObserver.nik || !currentObserver.signatureDataUrl || handleAddObserver.isPending}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambahkan Observer
                </Button>

                {draft.observers.length > 0 && (
                    <div className="mt-6">
                        <h4 className="font-semibold mb-2">Daftar Observer ({draft.observers.length})</h4>
                        <div className="space-y-2">
                            {draft.observers.map((obs, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded bg-white dark:bg-gray-800">
                                    <div>
                                        <div className="font-medium">{obs.nama} ({obs.nik})</div>
                                        <div className="text-xs text-gray-500">{obs.jabatan} - {obs.perusahaan}</div>
                                    </div>
                                    <div className="text-green-600 text-sm flex items-center">
                                        <Check className="w-4 h-4 mr-1" /> Sukses
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator className="my-6" />

                        <Button
                            className="w-full h-14 text-lg font-bold bg-green-700 hover:bg-green-800"
                            onClick={handleFinish}
                        >
                            <Save className="w-5 h-5 mr-3" />
                            SELESAI & SIMPAN SIDAK
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
                formType="seatbelt"
            />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                <div className="bg-green-600 text-white p-4 shadow-md sticky top-0 z-50">
                    <div className="container max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-3">
                            <Button variant="ghost" size="icon" className="text white hover:bg-green-700" onClick={() => navigate("/workspace/sidak")}>
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div className="flex-1">
                                <h1 className="text-lg font-bold">Sidak Seatbelt</h1>
                                <p className="text-xs text-green-100">Form BIB-HSE-ES-F-3.02-86</p>
                            </div>
                        </div>

                        {/* Enhanced Progress Indicator */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Step {draft.step} of 3</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3 bg-green-800" />
                            <div className="flex justify-between text-xs text-green-100">
                                <span>Header</span>
                                <span>Data</span>
                                <span>Observer</span>
                            </div>
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
