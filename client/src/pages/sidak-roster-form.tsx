import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ClipboardList, Check, X, ArrowLeft, ArrowRight, Save, Camera, Users, UserPlus } from "lucide-react";
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
import { SidakEmployeeScanner } from "@/components/sidak/sidak-employee-scanner";
import { SignaturePad } from "@/components/sidak/signature-pad";
import { DraftRecoveryDialog } from "@/components/sidak/draft-recovery-dialog";
import { useSidakDraft } from "@/hooks/use-sidak-draft";
import type { Employee } from "@shared/schema";

interface EmployeeRecord {
  employeeId?: string;
  nama: string;
  nik: string;
  nomorLambung: string;
  rosterSesuai: boolean | null;
  keterangan: string;
}

interface Observer {
  nama: string;
  nik: string;
  perusahaan: string;
  jabatan: string;
  signatureDataUrl: string;
}

interface RosterDraftData {
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
  employees: EmployeeRecord[];
  currentEmployee: EmployeeRecord;
  observers: Observer[];
  isLoadedFromQr: boolean;
}

const initialRosterDraftData: RosterDraftData = {
  step: 1,
  sessionId: null,
  headerData: {
    tanggal: new Date().toISOString().split('T')[0],
    waktu: "",
    shift: "Shift 1",
    perusahaan: "",
    departemen: "",
    lokasi: ""
  },
  employees: [],
  currentEmployee: {
    nama: "",
    nik: "",
    nomorLambung: "",
    rosterSesuai: null,
    keterangan: ""
  },
  observers: [],
  isLoadedFromQr: false
};

// Helper function to detect current shift based on system time
function getCurrentShift(): string {
  const now = new Date();
  const hour = now.getHours();

  // SHIFT 1: 06:00 - 18:00
  // SHIFT 2: 18:00 - 06:00
  if (hour >= 6 && hour < 18) {
    return "SHIFT 1";
  } else {
    return "SHIFT 2";
  }
}

export default function SidakRosterForm() {
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
  } = useSidakDraft<RosterDraftData>({
    key: "roster",
    initialData: initialRosterDraftData,
    debounceMs: 1500
  });

  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [headerData, setHeaderData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    waktu: "",
    shift: "Shift 1",
    perusahaan: "",
    departemen: "",
    lokasi: ""
  });

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeRecord>({
    nama: "",
    nik: "",
    nomorLambung: "",
    rosterSesuai: null,
    keterangan: ""
  });

  const [observers, setObservers] = useState<Observer[]>([]);
  const [showEmployeeScanner, setShowEmployeeScanner] = useState(false);
  const [isLoadedFromQr, setIsLoadedFromQr] = useState(false); // Track if data loaded from QR
  const [isLookingUpRoster, setIsLookingUpRoster] = useState(false); // Loading state for roster lookup

  // Manual observer input state (replacing dropdown and QR scanner)
  const [manualObserver, setManualObserver] = useState({
    nama: "",
    nik: "",
    perusahaan: "",
    jabatan: "",
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
          const response = await apiRequest("/api/sidak-roster", "POST", restoredData.headerData);
          setSessionId(response.id);
          setStep(restoredData.step);
          toast({
            title: "Draft Dipulihkan",
            description: "Data SIDAK Roster sebelumnya berhasil dipulihkan dan sesi baru dibuat",
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
          description: "Data SIDAK Roster sebelumnya berhasil dipulihkan",
        });
      }
    }
  };

  const handleEmployeeScanned = async (employee: Employee) => {
    try {
      // Check for duplicate employee
      if (employees.some(emp => emp.employeeId === employee.id)) {
        toast({
          title: "Karyawan Duplikat",
          description: `${employee.name} sudah ditambahkan sebelumnya`,
          variant: "destructive",
        });
        return;
      }

      setIsLookingUpRoster(true);

      // Detect current shift based on system time
      const currentShift = getCurrentShift();

      // Call roster lookup API to auto-fill roster data with shift validation
      const rosterLookupUrl = `/api/roster-lookup/${employee.id}/${headerData.tanggal}?currentShift=${encodeURIComponent(currentShift)}`;
      const rosterResponse = await fetch(rosterLookupUrl);

      if (!rosterResponse.ok) {
        const errorData = await rosterResponse.json();
        throw new Error(errorData.message || 'Gagal mengambil data roster');
      }

      const rosterData = await rosterResponse.json();

      // Check if shift validation failed
      if (rosterData.shiftMismatch) {
        toast({
          title: "Shift Tidak Sesuai",
          description: rosterData.message || `Driver terjadwal di ${rosterData.scheduledShift} tetapi inspeksi dilakukan di ${currentShift}`,
          variant: "destructive",
        });
        return;
      }

      // Auto-fill all fields
      setCurrentEmployee({
        employeeId: employee.id,
        nama: employee.name,
        nik: employee.id, // Employee ID is used as NIK
        nomorLambung: rosterData.nomorLambung || employee.nomorLambung || "",
        rosterSesuai: rosterData.rosterSesuai,
        keterangan: rosterData.keterangan
      });

      setIsLoadedFromQr(true); // Lock all fields except Nomor Lambung

      toast({
        title: "Data Dimuat",
        description: `Data karyawan ${employee.name} berhasil dimuat dari QR Code`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data karyawan",
        variant: "destructive",
      });
    } finally {
      setIsLookingUpRoster(false);
    }
  };

  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof headerData) => {
      const response = await apiRequest("/api/sidak-roster", "POST", data);
      return response;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      toast({
        title: "Sesi dibuat",
        description: "Sesi Sidak Roster berhasil dibuat",
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
      const response = await apiRequest(`/api/sidak-roster/${sessionId}/records`, "POST", {
        ...employee,
        rosterSesuai: employee.rosterSesuai ?? false
      });
      return response;
    },
    onSuccess: (data) => {
      // Use API response (backend-normalized data) instead of request payload
      setEmployees(prev => [...prev, data]);
      setCurrentEmployee({
        nama: "",
        nik: "",
        nomorLambung: "",
        rosterSesuai: null,
        keterangan: ""
      });
      setIsLoadedFromQr(false); // Reset locked state for next employee
      setShowEmployeeScanner(false); // Close scanner
      toast({
        title: "Karyawan ditambahkan",
        description: `Karyawan berhasil disimpan`,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('Maksimal 15')) {
        toast({
          title: "Batas maksimal tercapai",
          description: "Maksimal 15 karyawan untuk Sidak Roster",
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
    if (!headerData.waktu || !headerData.perusahaan || !headerData.lokasi) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field yang wajib",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate(headerData);
  };

  const handleSaveEmployee = () => {
    if (!isLoadedFromQr) {
      toast({
        title: "Scan QR Required",
        description: "Silakan scan QR Code karyawan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }
    if (!currentEmployee.nama || !currentEmployee.nik) {
      toast({
        title: "Data tidak lengkap",
        description: "Data karyawan tidak valid",
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
      const response = await apiRequest(`/api/sidak-roster/${sessionId}/observers`, "POST", observer);
      return response;
    },
    onSuccess: (data) => {
      // Use API response (backend-normalized data) instead of request payload
      setObservers(prev => [...prev, data]);

      // Reset manual form after successful save
      setManualObserver({
        nama: "",
        nik: "",
        perusahaan: "",
        jabatan: "",
        signatureDataUrl: ""
      });

      toast({
        title: "Observer ditambahkan",
        description: `Observer berhasil disimpan`,
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
    // Validate manual input fields
    if (!manualObserver.nama || !manualObserver.nik || !manualObserver.perusahaan || !manualObserver.jabatan) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field observer (Nama, NIK, Perusahaan, Jabatan)",
        variant: "destructive",
      });
      return;
    }

    // Validate signature
    if (!manualObserver.signatureDataUrl) {
      toast({
        title: "Tanda tangan diperlukan",
        description: "Mohon tambahkan tanda tangan observer",
        variant: "destructive",
      });
      return;
    }

    // Check duplicate observer by NIK
    if (observers.some(obs => obs.nik === manualObserver.nik)) {
      toast({
        title: "Observer sudah ditambahkan",
        description: `Observer dengan NIK ${manualObserver.nik} sudah ada dalam daftar`,
        variant: "destructive",
      });
      return;
    }

    // Create complete observer object
    const completeObserver: Observer = {
      nama: manualObserver.nama,
      nik: manualObserver.nik,
      perusahaan: manualObserver.perusahaan,
      jabatan: manualObserver.jabatan,
      signatureDataUrl: manualObserver.signatureDataUrl
    };

    // Save to backend (state updated in onSuccess, form reset in onSuccess)
    addObserverMutation.mutate(completeObserver);
  };


  const progress = (step / 4) * 100;
  const maxEmployees = 15;
  const canAddMore = employees.length < maxEmployees;

  return (
    <>
      <DraftRecoveryDialog
        open={showRecoveryDialog}
        onRestore={handleRestoreDraft}
        onDiscard={ignoreDraft}
        timestamp={draftTimestamp}
        formType="roster"
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4">
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
              <h1 className="text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <ClipboardList className="h-8 w-8" />
                Sidak Roster
              </h1>
              <p className="text-sm text-purple-700 dark:text-purple-300">Form BIB-HSE-PPO-F</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-purple-900 dark:text-purple-100">
              <span>Step {step} of 4</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300">
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
                <CardDescription>Isi informasi dasar sidak roster</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Pelaksanaan</Label>
                    <Input
                      type="date"
                      value={headerData.tanggal}
                      onChange={(e) => setHeaderData(prev => ({ ...prev, tanggal: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jam Pelaksanaan</Label>
                    <Input
                      type="time"
                      value={headerData.waktu}
                      onChange={(e) => setHeaderData(prev => ({ ...prev, waktu: e.target.value }))}
                    />
                  </div>
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

                <div>
                  <Label htmlFor="perusahaan">Perusahaan <span className="text-red-500">*</span></Label>
                  <Input
                    id="perusahaan"
                    value={headerData.perusahaan}
                    onChange={(e) => setHeaderData({ ...headerData, perusahaan: e.target.value })}
                    placeholder="Nama perusahaan"
                    data-testid="input-perusahaan"
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

                <div>
                  <Label htmlFor="lokasi">Lokasi <span className="text-red-500">*</span></Label>
                  <Input
                    id="lokasi"
                    value={headerData.lokasi}
                    onChange={(e) => setHeaderData({ ...headerData, lokasi: e.target.value })}
                    placeholder="Contoh: Area Produksi"
                    data-testid="input-lokasi"
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
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {employees.length} / {maxEmployees}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Karyawan Tercatat</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Data Karyawan #{employees.length + 1}</CardTitle>
                  <CardDescription>Isi data pemeriksaan kesesuaian roster</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isLoadedFromQr ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowEmployeeScanner(true)}
                      className="w-full h-14 text-lg border-2 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      data-testid="button-scan-employee-qr"
                      disabled={isLookingUpRoster}
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      {isLookingUpRoster ? "Memuat Data..." : "Scan QR Karyawan untuk Isi Otomatis"}
                    </Button>
                  ) : (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 rounded-lg p-4 text-center">
                        <p className="font-semibold text-green-800 dark:text-green-200">
                          ✓ Data dimuat dari QR Code - Hanya Nomor Lambung yang dapat diedit
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nama Karyawan <span className="text-red-500">*</span></Label>
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border-2 border-gray-300 dark:border-gray-600" data-testid="display-emp-nama">
                            <p className="font-medium">{currentEmployee.nama}</p>
                          </div>
                        </div>
                        <div>
                          <Label>NIK <span className="text-red-500">*</span></Label>
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border-2 border-gray-300 dark:border-gray-600" data-testid="display-emp-nik">
                            <p className="font-medium">{currentEmployee.nik}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="nomorLambung">Nomor Lambung (Dapat Diedit)</Label>
                        <Input
                          id="nomorLambung"
                          value={currentEmployee.nomorLambung}
                          onChange={(e) => setCurrentEmployee({ ...currentEmployee, nomorLambung: e.target.value })}
                          placeholder="No. Lambung"
                          data-testid="input-emp-nomor-lambung"
                          className="border-2 border-purple-400"
                        />
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Roster Sesuai? (Otomatis dari sistem)</h3>

                        <div className="flex items-center justify-center p-6 border-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center gap-3">
                            {currentEmployee.rosterSesuai ? (
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400" data-testid="display-roster-ya">
                                <Check className="h-8 w-8" />
                                <span className="text-2xl font-bold">YA</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600 dark:text-red-400" data-testid="display-roster-tidak">
                                <X className="h-8 w-8" />
                                <span className="text-2xl font-bold">TIDAK</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Keterangan (Otomatis dari sistem)</Label>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border-2 border-gray-300 dark:border-gray-600 min-h-[100px]" data-testid="display-emp-keterangan">
                          <p className="font-medium">{currentEmployee.keterangan || "-"}</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSaveEmployee}
                      disabled={!canAddMore || addEmployeeMutation.isPending}
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
                        Batas maksimal 15 karyawan tercapai
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
                      <Label htmlFor="observer-nama">Nama Observer <span className="text-red-500">*</span></Label>
                      <Input
                        id="observer-nama"
                        value={manualObserver.nama}
                        onChange={(e) => setManualObserver({ ...manualObserver, nama: e.target.value })}
                        placeholder="Nama lengkap observer"
                        data-testid="input-observer-nama"
                      />
                    </div>
                    <div>
                      <Label htmlFor="observer-nik">NIK <span className="text-red-500">*</span></Label>
                      <Input
                        id="observer-nik"
                        value={manualObserver.nik}
                        onChange={(e) => setManualObserver({ ...manualObserver, nik: e.target.value })}
                        placeholder="NIK observer"
                        data-testid="input-observer-nik"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <Label htmlFor="observer-jabatan">Jabatan <span className="text-red-500">*</span></Label>
                      <Input
                        id="observer-jabatan"
                        value={manualObserver.jabatan}
                        onChange={(e) => setManualObserver({ ...manualObserver, jabatan: e.target.value })}
                        placeholder="Jabatan observer"
                        data-testid="input-observer-jabatan"
                      />
                    </div>
                  </div>

                  <div>
                    <SignaturePad
                      onSave={(signatureDataUrl) => setManualObserver({ ...manualObserver, signatureDataUrl })}
                      disabled={addObserverMutation.isPending}
                      title="Tanda Tangan Observer"
                    />
                  </div>

                  <Button
                    onClick={handleAddManualObserver}
                    size="lg"
                    className="w-full h-12"
                    disabled={!manualObserver.nama || !manualObserver.nik || !manualObserver.perusahaan || !manualObserver.jabatan || !manualObserver.signatureDataUrl || addObserverMutation.isPending}
                    data-testid="button-add-observer"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Tambah Observer
                  </Button>
                </div>

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
                    <p>Jam: {headerData.waktu}</p>
                    <p>Shift: {headerData.shift}</p>
                    <p>Perusahaan: {headerData.perusahaan}</p>
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
