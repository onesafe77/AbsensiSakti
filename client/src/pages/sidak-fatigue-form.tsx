import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Activity, Check, X, ArrowLeft, ArrowRight, Save, Camera, Users, Pen, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SidakObserverScanner } from "@/components/sidak/sidak-observer-scanner";
import { SidakEmployeeScanner } from "@/components/sidak/sidak-employee-scanner";
import { SignaturePad } from "@/components/sidak/signature-pad";
import { DraftRecoveryDialog } from "@/components/sidak/draft-recovery-dialog";
import { useSidakDraft } from "@/hooks/use-sidak-draft";
import type { Employee } from "@shared/schema";

interface EmployeeRecord {
  employeeId?: string;
  nama: string;
  nik: string;
  jabatan: string;
  nomorLambung: string;
  jamTidur: number;
  konsumiObat: boolean | null;
  masalahPribadi: boolean | null;
  pemeriksaanRespon: boolean | null;
  pemeriksaanKonsentrasi: boolean | null;
  pemeriksaanKesehatan: boolean | null;
  karyawanSiapBekerja: boolean | null;
  fitUntukBekerja: boolean | null;
  istirahatDanMonitor: boolean | null;
  istirahatLebihdariSatuJam: boolean | null;
  tidakBolehBekerja: boolean | null;
  employeeSignature?: string; // Base64 encoded signature image
}

interface Observer {
  nama: string;
  nik: string;
  perusahaan: string;
  jabatan: string;
  signatureDataUrl: string;
}

interface FatigueDraftData {
  step: number;
  sessionId: string | null;
  headerData: {
    tanggal: string;
    shift: string;
    waktuMulai: string;
    waktuSelesai: string;
    lokasi: string;
    area: string;
    departemen: string;
  };
  employees: EmployeeRecord[];
  currentEmployee: EmployeeRecord;
  observers: Observer[];
  isLoadedFromQr: boolean;
}

const initialDraftData: FatigueDraftData = {
  step: 1,
  sessionId: null,
  headerData: {
    tanggal: new Date().toISOString().split('T')[0],
    shift: "Shift 1",
    waktuMulai: "",
    waktuSelesai: "",
    lokasi: "",
    area: "",
    departemen: ""
  },
  employees: [],
  currentEmployee: {
    nama: "",
    nik: "",
    jabatan: "",
    nomorLambung: "",
    jamTidur: 0,
    konsumiObat: null,
    masalahPribadi: null,
    pemeriksaanRespon: null,
    pemeriksaanKonsentrasi: null,
    pemeriksaanKesehatan: null,
    karyawanSiapBekerja: null,
    fitUntukBekerja: null,
    istirahatDanMonitor: null,
    istirahatLebihdariSatuJam: null,
    tidakBolehBekerja: null
  },
  observers: [],
  isLoadedFromQr: false
};

export default function SidakFatigueForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    saveDraft,
    clearDraft,
    restoreDraft,
    ignoreDraft,
    showRecoveryDialog,
    draftTimestamp
  } = useSidakDraft<FatigueDraftData>({
    key: "fatigue",
    initialData: initialDraftData,
    debounceMs: 1500
  });

  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [headerData, setHeaderData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: "Shift 1",
    waktuMulai: "",
    waktuSelesai: "",
    lokasi: "",
    area: "",
    departemen: ""
  });

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeRecord>({
    nama: "",
    nik: "",
    jabatan: "",
    nomorLambung: "",
    jamTidur: 0,
    konsumiObat: null,
    masalahPribadi: null,
    pemeriksaanRespon: null,
    pemeriksaanKonsentrasi: null,
    pemeriksaanKesehatan: null,
    karyawanSiapBekerja: null,
    fitUntukBekerja: null,
    istirahatDanMonitor: null,
    istirahatLebihdariSatuJam: null,
    tidakBolehBekerja: null
  });

  const [observers, setObservers] = useState<Observer[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showEmployeeScanner, setShowEmployeeScanner] = useState(false);
  const [isLoadedFromQr, setIsLoadedFromQr] = useState(false);

  // Manual observer input state
  const [manualObserver, setManualObserver] = useState({
    nama: "",
    perusahaan: "",
    signatureDataUrl: ""
  });

  // Auto-save effect - save current form state to draft
  useEffect(() => {
    saveDraft({
      step,
      sessionId,
      headerData,
      employees,
      currentEmployee,
      observers,
      isLoadedFromQr
    });
  }, [step, sessionId, headerData, employees, currentEmployee, observers, isLoadedFromQr, saveDraft]);

  // Handle draft restoration
  const handleRestoreDraft = async () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      setHeaderData(restoredData.headerData);
      setEmployees(restoredData.employees);
      setCurrentEmployee(restoredData.currentEmployee);
      setObservers(restoredData.observers);
      setIsLoadedFromQr(restoredData.isLoadedFromQr);

      // If the draft was from before sessionId was saved, create a new session
      if (!restoredData.sessionId && restoredData.step > 1) {
        try {
          const response = await apiRequest("/api/sidak-fatigue", "POST", restoredData.headerData);
          setSessionId(response.id);
          setStep(restoredData.step);
          toast({
            title: "Draft Dipulihkan",
            description: "Data SIDAK sebelumnya berhasil dipulihkan dan sesi baru dibuat",
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: "Gagal membuat sesi baru. Silakan mulai dari awal.",
            variant: "destructive",
          });
          // Reset to step 1 if session creation fails
          setStep(1);
          return;
        }
      } else {
        setSessionId(restoredData.sessionId);
        setStep(restoredData.step);
        toast({
          title: "Draft Dipulihkan",
          description: "Data SIDAK sebelumnya berhasil dipulihkan",
        });
      }
    }
  };

  const handleEmployeeScanned = (employee: Employee) => {
    setCurrentEmployee({
      ...currentEmployee,
      employeeId: employee.id,
      nama: employee.name,
      nik: employee.id, // Employee ID is used as NIK
      jabatan: employee.position || "",
      nomorLambung: employee.nomorLambung || ""
    });

    setIsLoadedFromQr(true); // Lock fields after QR scan

    toast({
      title: "Data Dimuat",
      description: `Data karyawan ${employee.name} berhasil dimuat dari QR Code`,
    });
  };

  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof headerData) => {
      const response = await apiRequest("/api/sidak-fatigue", "POST", data);
      return response;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      toast({
        title: "Sesi dibuat",
        description: "Sesi Sidak Fatigue berhasil dibuat",
      });
      setStep(2);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat sesi",
        variant: "destructive",
      });
    }
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: EmployeeRecord) => {
      if (!sessionId) throw new Error("Session ID not found");
      // Convert null to boolean before sending to API
      const employeeData = {
        ...employee,
        konsumiObat: employee.konsumiObat ?? false,
        masalahPribadi: employee.masalahPribadi ?? false,
        pemeriksaanRespon: employee.pemeriksaanRespon ?? false,
        pemeriksaanKonsentrasi: employee.pemeriksaanKonsentrasi ?? false,
        pemeriksaanKesehatan: employee.pemeriksaanKesehatan ?? false,
        karyawanSiapBekerja: employee.karyawanSiapBekerja ?? false,
        fitUntukBekerja: employee.fitUntukBekerja ?? false,
        istirahatDanMonitor: employee.istirahatDanMonitor ?? false,
        istirahatLebihdariSatuJam: employee.istirahatLebihdariSatuJam ?? false,
        tidakBolehBekerja: employee.tidakBolehBekerja ?? false,
        employeeSignature: employee.employeeSignature
      };
      const response = await apiRequest(`/api/sidak-fatigue/${sessionId}/records`, "POST", employeeData);
      return response;
    },
    onSuccess: () => {
      setEmployees(prev => {
        const updatedEmployees = [...prev, currentEmployee];
        toast({
          title: "Karyawan ditambahkan",
          description: `Karyawan ${updatedEmployees.length}/10 berhasil disimpan`,
        });
        return updatedEmployees;
      });
      setCurrentEmployee({
        nama: "",
        nik: "",
        jabatan: "",
        nomorLambung: "",
        jamTidur: 0,
        konsumiObat: null,
        masalahPribadi: null,
        pemeriksaanRespon: null,
        pemeriksaanKonsentrasi: null,
        pemeriksaanKesehatan: null,
        karyawanSiapBekerja: null,
        fitUntukBekerja: null,
        istirahatDanMonitor: null,
        istirahatLebihdariSatuJam: null,
        tidakBolehBekerja: null,
        employeeSignature: undefined
      });
      setIsLoadedFromQr(false); // Reset lock for next employee
    },
    onError: (error: any) => {
      if (error.message?.includes('Maksimal 20')) {
        toast({
          title: "Batas maksimal tercapai",
          description: "Maksimal 20 karyawan untuk Sidak Fatigue",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Gagal menambahkan karyawan",
          variant: "destructive",
        });
      }
    }
  });

  const handleStep1Submit = () => {
    if (!headerData.waktuMulai || !headerData.waktuSelesai || !headerData.lokasi) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field yang wajib",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate({
      ...headerData,
      waktu: headerData.waktuMulai // Map waktuMulai to mandatory 'waktu' field
    });
  };

  const handleSaveEmployee = () => {
    // Validate QR scan is required
    if (!isLoadedFromQr) {
      toast({
        title: "Scan QR Code Wajib",
        description: "Mohon scan QR karyawan terlebih dahulu untuk mengisi data Nama, NIK, dan Jabatan",
        variant: "destructive",
      });
      return;
    }

    if (!currentEmployee.nama || !currentEmployee.nik || !currentEmployee.jabatan) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi nama, NIK, dan jabatan karyawan",
        variant: "destructive",
      });
      return;
    }

    // Validate all boolean fields are explicitly set
    const booleanFields = [
      { key: 'konsumiObat', label: 'Ada konsumsi obat' },
      { key: 'masalahPribadi', label: 'Ada masalah pribadi' },
      { key: 'pemeriksaanRespon', label: 'Pemeriksaan respon' },
      { key: 'pemeriksaanKonsentrasi', label: 'Pemeriksaan konsentrasi' },
      { key: 'pemeriksaanKesehatan', label: 'Pemeriksaan kesehatan' },
      { key: 'karyawanSiapBekerja', label: 'Karyawan siap bekerja' },
      { key: 'fitUntukBekerja', label: 'Fit untuk bekerja' },
      { key: 'istirahatDanMonitor', label: 'Istirahat sebentar dan monitor' },
      { key: 'istirahatLebihdariSatuJam', label: 'Pekerja diistirahatkan >1jam' },
      { key: 'tidakBolehBekerja', label: 'Tidak diijinkan bekerja' }
    ];

    const unsetFields = booleanFields.filter(field => currentEmployee[field.key as keyof EmployeeRecord] === null);

    if (unsetFields.length > 0) {
      toast({
        title: "Pemeriksaan belum lengkap",
        description: `Mohon pilih Ya/Tidak untuk: ${unsetFields.map(f => f.label).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    addEmployeeMutation.mutate(currentEmployee);
  };

  const handleFinishEmployees = () => {
    if (employees.length === 0) {
      toast({
        title: "Belum ada karyawan",
        description: "Tambahkan minimal 1 karyawan",
        variant: "destructive",
      });
      return;
    }
    setStep(3);
  };

  const addObserverMutation = useMutation({
    mutationFn: async (observer: Observer) => {
      if (!sessionId) throw new Error("Session ID not found");
      const response = await apiRequest(`/api/sidak-fatigue/${sessionId}/observers`, "POST", observer);
      return response;
    },
    onSuccess: (_data, variables) => {
      // Only update state after successful backend save
      setObservers(prev => [...prev, variables]);
      toast({
        title: "Observer ditambahkan",
        description: `Observer ${variables.nama} berhasil disimpan`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan observer",
        description: error.message || "Silakan coba lagi",
        variant: "destructive",
      });
    }
  });

  const handleAddManualObserver = () => {
    // Validate manual input
    if (!manualObserver.nama || !manualObserver.perusahaan) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi nama dan perusahaan observer",
        variant: "destructive",
      });
      return;
    }

    if (!manualObserver.signatureDataUrl) {
      toast({
        title: "Tanda tangan diperlukan",
        description: "Mohon tanda tangani terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Create observer with manual input
    const newObserver: Observer = {
      nama: manualObserver.nama,
      nik: `OBS-${Date.now()}`, // Generate unique NIK for manual observer
      jabatan: "Observer",
      perusahaan: manualObserver.perusahaan,
      signatureDataUrl: manualObserver.signatureDataUrl
    };

    // Save to backend (state updated in onSuccess)
    addObserverMutation.mutate(newObserver);

    // Reset manual observer form
    setManualObserver({
      nama: "",
      perusahaan: "",
      signatureDataUrl: ""
    });
  };

  const progress = (step / 4) * 100;
  const maxEmployees = 20;
  const canAddMore = employees.length < maxEmployees;

  return (
    <>
      <DraftRecoveryDialog
        open={showRecoveryDialog}
        onRestore={handleRestoreDraft}
        onDiscard={ignoreDraft}
        timestamp={draftTimestamp}
        formType="fatigue"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4">
        <div className="container max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/workspace/sidak")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Sidak Fatigue
              </h1>
              <p className="text-sm text-blue-700 dark:text-blue-300">Form BIB-HSE-ES-F-3.02-16</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-blue-900 dark:text-blue-100">
              <span>Step {step} of 4</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
              <span>Header</span>
              <span>Karyawan</span>
              <span>Observer</span>
              <span>Selesai</span>
            </div>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Informasi Header</CardTitle>
                <CardDescription>Isi informasi dasar sidak fatigue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tanggal">Tanggal <span className="text-red-500">*</span></Label>
                    <Input
                      id="tanggal"
                      type="date"
                      value={headerData.tanggal}
                      onChange={(e) => setHeaderData({ ...headerData, tanggal: e.target.value })}
                      data-testid="input-tanggal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shift">Shift <span className="text-red-500">*</span></Label>
                    <Select
                      value={headerData.shift}
                      onValueChange={(value) => setHeaderData({ ...headerData, shift: value })}
                    >
                      <SelectTrigger data-testid="select-shift">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shift 1">Shift 1</SelectItem>
                        <SelectItem value="Shift 2">Shift 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="waktuMulai">Waktu Mulai <span className="text-red-500">*</span></Label>
                    <Input
                      id="waktuMulai"
                      type="time"
                      value={headerData.waktuMulai}
                      onChange={(e) => setHeaderData({ ...headerData, waktuMulai: e.target.value })}
                      data-testid="input-waktu-mulai"
                    />
                  </div>
                  <div>
                    <Label htmlFor="waktuSelesai">Waktu Selesai <span className="text-red-500">*</span></Label>
                    <Input
                      id="waktuSelesai"
                      type="time"
                      value={headerData.waktuSelesai}
                      onChange={(e) => setHeaderData({ ...headerData, waktuSelesai: e.target.value })}
                      data-testid="input-waktu-selesai"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lokasi">Lokasi <span className="text-red-500">*</span></Label>
                  <Input
                    id="lokasi"
                    value={headerData.lokasi}
                    onChange={(e) => setHeaderData({ ...headerData, lokasi: e.target.value })}
                    placeholder="Contoh: Workshop A"
                    data-testid="input-lokasi"
                  />
                </div>

                <div>
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    value={headerData.area}
                    onChange={(e) => setHeaderData({ ...headerData, area: e.target.value })}
                    placeholder="Contoh: Area Produksi"
                    data-testid="input-area"
                  />
                </div>

                <div>
                  <Label htmlFor="departemen">Departemen</Label>
                  <Input
                    id="departemen"
                    value={headerData.departemen}
                    onChange={(e) => setHeaderData({ ...headerData, departemen: e.target.value })}
                    placeholder="Contoh: Operasional"
                    data-testid="input-departemen"
                  />
                </div>

                <Button
                  onClick={handleStep1Submit}
                  className="w-full h-14 text-lg"
                  disabled={createSessionMutation.isPending}
                  data-testid="button-next-step"
                >
                  {createSessionMutation.isPending ? "Membuat Sesi..." : "Lanjut ke Step 2"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {employees.length} / {maxEmployees}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Karyawan Tercatat</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Data Karyawan #{employees.length + 1}</CardTitle>
                  <CardDescription>Isi data pemeriksaan karyawan secara sequential</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmployeeScanner(true)}
                    className="w-full h-14 text-lg border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    data-testid="button-scan-employee-qr"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scan QR Karyawan untuk Isi Otomatis
                  </Button>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nama">Nama Karyawan <span className="text-red-500">*</span></Label>
                      <Input
                        id="nama"
                        value={currentEmployee.nama}
                        readOnly
                        placeholder={isLoadedFromQr ? "" : "Scan QR untuk mengisi"}
                        className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        data-testid="input-emp-nama"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nik">NIK <span className="text-red-500">*</span></Label>
                      <Input
                        id="nik"
                        value={currentEmployee.nik}
                        readOnly
                        placeholder={isLoadedFromQr ? "" : "Scan QR untuk mengisi"}
                        className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        data-testid="input-emp-nik"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jabatan">Jabatan <span className="text-red-500">*</span></Label>
                      <Input
                        id="jabatan"
                        value={currentEmployee.jabatan}
                        readOnly
                        placeholder={isLoadedFromQr ? "" : "Scan QR untuk mengisi"}
                        className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        data-testid="input-emp-jabatan"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nomorLambung">Nomor Lambung</Label>
                      <Input
                        id="nomorLambung"
                        value={currentEmployee.nomorLambung}
                        onChange={(e) => setCurrentEmployee({ ...currentEmployee, nomorLambung: e.target.value })}
                        placeholder="No. Lambung (opsional)"
                        data-testid="input-emp-nomor-lambung"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="jamTidur">Jam Tidur (dalam jam)</Label>
                    <Input
                      id="jamTidur"
                      type="number"
                      min="0"
                      max="24"
                      value={currentEmployee.jamTidur}
                      onChange={(e) => setCurrentEmployee({ ...currentEmployee, jamTidur: parseInt(e.target.value) || 0 })}
                      placeholder="Contoh: 7"
                      className="text-2xl font-bold text-center h-16"
                      data-testid="input-emp-jam-tidur"
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Pemeriksaan Ya/Tidak</h3>

                    {[
                      { key: 'konsumiObat', label: 'Ada konsumsi obat' },
                      { key: 'masalahPribadi', label: 'Ada masalah pribadi' },
                      { key: 'pemeriksaanRespon', label: 'Pemeriksaan respon' },
                      { key: 'pemeriksaanKonsentrasi', label: 'Pemeriksaan konsentrasi' },
                      { key: 'pemeriksaanKesehatan', label: 'Pemeriksaan kesehatan' },
                      { key: 'karyawanSiapBekerja', label: 'Karyawan siap bekerja' },
                      { key: 'fitUntukBekerja', label: 'Fit untuk bekerja' },
                      { key: 'istirahatDanMonitor', label: 'Istirahat sebentar dan monitor' },
                      { key: 'istirahatLebihdariSatuJam', label: 'Pekerja diistirahatkan >1jam' },
                      { key: 'tidakBolehBekerja', label: 'Tidak diijinkan bekerja' }
                    ].map((field) => (
                      <div key={field.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-4">
                        <Label htmlFor={field.key} className="font-medium text-sm sm:text-base">{field.label}</Label>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            type="button"
                            variant={currentEmployee[field.key as keyof EmployeeRecord] === true ? "default" : "outline"}
                            onClick={() => setCurrentEmployee({ ...currentEmployee, [field.key]: true })}
                            className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                            data-testid={`button-${field.key}-ya`}
                          >
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                            Ya
                          </Button>
                          <Button
                            type="button"
                            variant={currentEmployee[field.key as keyof EmployeeRecord] === false ? "destructive" : "outline"}
                            onClick={() => setCurrentEmployee({ ...currentEmployee, [field.key]: false })}
                            className="flex-1 sm:flex-none w-auto sm:w-20 h-10 sm:h-12 text-sm"
                            data-testid={`button-${field.key}-tidak`}
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                            Tidak
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  {/* Employee Signature */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Pen className="h-5 w-5" />
                      Tanda Tangan Pekerja <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pekerja harus menandatangani untuk konfirmasi hasil pemeriksaan
                    </p>
                    <SignaturePad
                      onSave={(signatureDataUrl) => {
                        setCurrentEmployee({
                          ...currentEmployee,
                          employeeSignature: signatureDataUrl
                        });
                      }}
                      data-testid="signature-pad-employee"
                    />
                    {currentEmployee.employeeSignature && (
                      <Card className="bg-green-50 dark:bg-green-900/20 border-green-300">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <Check className="h-5 w-5" />
                            <span className="font-medium">Tanda tangan tersimpan</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSaveEmployee}
                      disabled={!canAddMore || addEmployeeMutation.isPending || !currentEmployee.employeeSignature}
                      className="w-full h-12 text-sm sm:text-base"
                      data-testid="button-save-continue"
                    >
                      <Save className="mr-2 h-4 w-4 flex-shrink-0" />
                      {addEmployeeMutation.isPending ? "Menyimpan..." : "Simpan & Lanjut"}
                    </Button>
                    <Button
                      onClick={handleFinishEmployees}
                      variant="outline"
                      className="w-full h-12 text-sm sm:text-base"
                      data-testid="button-finish-employees"
                    >
                      Selesai ({employees.length} karyawan)
                      <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </div>

                  {!canAddMore && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 rounded-lg p-4 text-center">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Batas maksimal 10 karyawan tercapai
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Observer & Tanda Tangan</CardTitle>
                <CardDescription>Scan QR Observer dan tambahkan tanda tangan digital</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Observer List */}
                {observers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Observer Terdaftar ({observers.length})
                    </h3>
                    {observers.map((obs, idx) => (
                      <Card key={idx} className="bg-green-50 dark:bg-green-900/20 border-green-300">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="font-semibold">{obs.nama}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">NIK: {obs.nik}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{obs.jabatan} - {obs.perusahaan}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {obs.signatureDataUrl && (
                                <div className="w-20 h-12 border rounded bg-white">
                                  <img src={obs.signatureDataUrl} alt="Signature" className="w-full h-full object-contain" />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add Observer - Manual Input */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="observer-nama">Nama Pemantau <span className="text-red-500">*</span></Label>
                      <Input
                        id="observer-nama"
                        value={manualObserver.nama}
                        onChange={(e) => setManualObserver({ ...manualObserver, nama: e.target.value })}
                        placeholder="Nama lengkap pemantau"
                        data-testid="input-observer-nama"
                      />
                    </div>
                    <div>
                      <Label htmlFor="observer-perusahaan">Perusahaan <span className="text-red-500">*</span></Label>
                      <Input
                        id="observer-perusahaan"
                        value={manualObserver.perusahaan}
                        onChange={(e) => setManualObserver({ ...manualObserver, perusahaan: e.target.value })}
                        placeholder="Nama perusahaan"
                        data-testid="input-observer-perusahaan"
                      />
                    </div>
                  </div>

                  <div>
                    <SignaturePad
                      onSave={(signatureDataUrl) => setManualObserver({ ...manualObserver, signatureDataUrl })}
                      disabled={addObserverMutation.isPending}
                      title="Tanda Tangan Pemantau"
                    />
                  </div>

                  <Button
                    onClick={handleAddManualObserver}
                    size="lg"
                    className="w-full h-12"
                    disabled={!manualObserver.nama || !manualObserver.perusahaan || !manualObserver.signatureDataUrl || addObserverMutation.isPending}
                    data-testid="button-add-observer"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Tambah Observer
                  </Button>
                </div>

                {/* Navigation */}
                <Separator />
                <Button
                  onClick={() => setStep(4)}
                  className="w-full h-14 text-lg"
                  disabled={observers.length === 0}
                  data-testid="button-next-preview"
                >
                  Lanjut ke Preview ({observers.length} observer)
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                {observers.length === 0 && (
                  <p className="text-sm text-center text-gray-500">
                    Tambahkan minimal 1 observer untuk melanjutkan
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Employee Scanner for Step 2 - Karyawan data input */}
          {showEmployeeScanner && (
            <SidakEmployeeScanner
              isOpen={showEmployeeScanner}
              onClose={() => setShowEmployeeScanner(false)}
              onEmployeeScanned={handleEmployeeScanned}
            />
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Preview & Simpan</CardTitle>
                <CardDescription>Review data sebelum menyimpan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Header Info:</h3>
                  <div className="text-sm space-y-1">
                    <p>Tanggal: {headerData.tanggal}</p>
                    <p>Shift: {headerData.shift}</p>
                    <p>Waktu: {headerData.waktuMulai} - {headerData.waktuSelesai}</p>
                    <p>Lokasi: {headerData.lokasi}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold">Total Karyawan: {employees.length}</h3>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      clearDraft();
                      navigate("/workspace/sidak");
                    }}
                    className="flex-1 h-14 text-lg"
                    data-testid="button-finish"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Selesai
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
