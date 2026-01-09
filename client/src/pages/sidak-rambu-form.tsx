import { useState } from "react";
import { useLocation } from "wouter";
import { Check, X, ArrowLeft, ArrowRight, Save, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { SignaturePad } from "@/components/sidak/signature-pad";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ObservationRecord {
    nama: string;
    noKendaraan: string;
    perusahaan: string;
    rambuStop: boolean;
    rambuGiveWay: boolean;
    rambuKecepatanMax: boolean;
    rambuLaranganMasuk: boolean;
    rambuLaranganParkir: boolean;
    rambuWajibHelm: boolean;
    rambuLaranganUTurn: boolean;
    keterangan: string;
}

interface Observer {
    nama: string;
    perusahaan: string;
    signatureDataUrl: string;
}

const initialObservation: ObservationRecord = {
    nama: "",
    noKendaraan: "",
    perusahaan: "",
    rambuStop: true,
    rambuGiveWay: true,
    rambuKecepatanMax: true,
    rambuLaranganMasuk: true,
    rambuLaranganParkir: true,
    rambuWajibHelm: true,
    rambuLaranganUTurn: true,
    keterangan: ""
};

export default function SidakRambuForm() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    const [step, setStep] = useState(1);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const [headerData, setHeaderData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        shift: "Shift 1",
        waktuMulai: "",
        waktuSelesai: "",
        lokasi: "",
        totalSampel: ""
    });

    const [observations, setObservations] = useState<ObservationRecord[]>([]);
    const [currentObservation, setCurrentObservation] = useState<ObservationRecord>(initialObservation);

    const [observers, setObservers] = useState<Observer[]>([]);
    const [manualObserver, setManualObserver] = useState({
        nama: "",
        perusahaan: "",
        signatureDataUrl: ""
    });

    const handleStep1Submit = async () => {
        if (!headerData.waktuMulai || !headerData.waktuSelesai || !headerData.lokasi || !headerData.totalSampel) {
            toast({
                title: "Data tidak lengkap",
                description: "Mohon lengkapi semua field yang wajib",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch("/api/sidak-rambu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(headerData)
            });

            if (!response.ok) throw new Error("Gagal membuat sesi");

            const data = await response.json();
            setSessionId(data.id);
            toast({ title: "Sesi dibuat", description: "Sesi Sidak Rambu berhasil dibuat" });
            setStep(2);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Gagal membuat sesi: " + JSON.stringify(error),
                variant: "destructive",
            });
        }
    };

    const handleSaveObservation = async () => {
        if (!currentObservation.nama || !currentObservation.noKendaraan || !currentObservation.perusahaan) {
            toast({
                title: "Data tidak lengkap",
                description: "Mohon lengkapi Nama, No Kendaraan, dan Perusahaan",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch(`/api/sidak-rambu/${sessionId}/observations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentObservation)
            });

            if (!response.ok) throw new Error("Gagal menambahkan observasi");

            const data = await response.json();
            setObservations(prev => [...prev, data]);
            setCurrentObservation(initialObservation);

            toast({ title: "Observasi ditambahkan", description: "Data observasi berhasil disimpan" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Gagal menambahkan observasi",
                variant: "destructive",
            });
        }
    };

    const handleAddObserver = async () => {
        if (!manualObserver.nama || !manualObserver.perusahaan || !manualObserver.signatureDataUrl) {
            toast({
                title: "Data tidak lengkap",
                description: "Mohon lengkapi Nama, Perusahaan, dan Tanda Tangan",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch(`/api/sidak-rambu/${sessionId}/observers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(manualObserver)
            });

            if (!response.ok) throw new Error("Gagal menambahkan observer");

            const data = await response.json();
            setObservers(prev => [...prev, data]);
            setManualObserver({ nama: "", perusahaan: "", signatureDataUrl: "" });

            toast({ title: "Observer ditambahkan", description: "Observer berhasil disimpan" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Gagal menambahkan observer",
                variant: "destructive",
            });
        }
    };

    const handleGeneratePDF = async () => {
        if (observers.length === 0) {
            toast({
                title: "Belum ada observer",
                description: "Tambahkan minimal 1 observer",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch(`/api/sidak-rambu/${sessionId}/pdf`, {
                method: "GET"
            });

            if (!response.ok) throw new Error("Gagal generate PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Sidak_Rambu_${headerData.tanggal}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: "PDF Generated", description: "PDF berhasil didownload" });

            // Clear draft and redirect to history
            localStorage.removeItem('sidak-rambu-draft');
            navigate("/workspace/sidak/rambu/history");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Gagal generate PDF",
                variant: "destructive",
            });
        }
    };

    const progress = (step / 4) * 100;
    const maxObservations = 10;
    const canAddMore = observations.length < maxObservations;

    const ComplianceButton = ({
        value,
        onChange,
        label
    }: {
        value: boolean;
        onChange: (val: boolean) => void;
        label: string;
    }) => (
        <div className="space-y-2">
            <Label className="text-sm">{label}</Label>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant={value ? "default" : "outline"}
                    className={value ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1"}
                    onClick={() => onChange(true)}
                >
                    <Check className="mr-1 h-4 w-4" />
                    Ya
                </Button>
                <Button
                    type="button"
                    variant={!value ? "destructive" : "outline"}
                    className="flex-1"
                    onClick={() => onChange(false)}
                >
                    <X className="mr-1 h-4 w-4" />
                    Tidak
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-4">
            <div className="container max-w-4xl mx-auto space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/workspace/sidak")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-amber-900 dark:text-amber-100">
                            Observasi Kepatuhan Rambu
                        </h1>
                        <p className="text-sm text-amber-700 dark:text-amber-300">Form BIB-HSE-PPO-F-072-24</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/workspace/sidak/rambu/history")}
                        className="hidden md:flex"
                    >
                        Lihat Riwayat
                    </Button>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-amber-900 dark:text-amber-100">
                        <span>Step {step} of 4</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300">
                        <span>Header</span>
                        <span>Observasi</span>
                        <span>Observer</span>
                        <span>Selesai</span>
                    </div>
                </div>

                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1: Informasi Header</CardTitle>
                            <CardDescription>Isi informasi dasar observasi</CardDescription>
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
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="shift">Shift <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={headerData.shift}
                                        onValueChange={(value) => setHeaderData({ ...headerData, shift: value })}
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="waktuMulai">Waktu Mulai <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="waktuMulai"
                                        type="time"
                                        value={headerData.waktuMulai}
                                        onChange={(e) => setHeaderData({ ...headerData, waktuMulai: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="waktuSelesai">Waktu Selesai <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="waktuSelesai"
                                        type="time"
                                        value={headerData.waktuSelesai}
                                        onChange={(e) => setHeaderData({ ...headerData, waktuSelesai: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="lokasi">Lokasi <span className="text-red-500">*</span></Label>
                                <Input
                                    id="lokasi"
                                    value={headerData.lokasi}
                                    onChange={(e) => setHeaderData({ ...headerData, lokasi: e.target.value })}
                                    placeholder="Contoh: Area Produksi"
                                />
                            </div>

                            <div>
                                <Label htmlFor="totalSampel">Total Sampel <span className="text-red-500">*</span></Label>
                                <Input
                                    id="totalSampel"
                                    type="number"
                                    value={headerData.totalSampel}
                                    onChange={(e) => setHeaderData({ ...headerData, totalSampel: e.target.value })}
                                    placeholder="Jumlah kendaraan yang diobservasi"
                                />
                            </div>

                            <Button
                                onClick={handleStep1Submit}
                                className="w-full h-14 text-lg"
                            >
                                Lanjut ke Step 2
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <Card className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                                        {observations.length} / {maxObservations}
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">Kendaraan Tercatat</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Step 2: Data Observasi #{observations.length + 1}</CardTitle>
                                <CardDescription>Isi data observasi kendaraan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="nama">Nama Pengemudi <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="nama"
                                            value={currentObservation.nama}
                                            onChange={(e) => setCurrentObservation({ ...currentObservation, nama: e.target.value })}
                                            placeholder="Nama lengkap"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="noKendaraan">No Kendaraan <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="noKendaraan"
                                            value={currentObservation.noKendaraan}
                                            onChange={(e) => setCurrentObservation({ ...currentObservation, noKendaraan: e.target.value })}
                                            placeholder="No. Polisi/ID"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="perusahaan">Perusahaan <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="perusahaan"
                                            value={currentObservation.perusahaan}
                                            onChange={(e) => setCurrentObservation({ ...currentObservation, perusahaan: e.target.value })}
                                            placeholder="Nama perusahaan"
                                        />
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Checklist Kepatuhan Rambu</h3>

                                    <ComplianceButton
                                        value={currentObservation.rambuStop}
                                        onChange={(val) => setCurrentObservation({ ...currentObservation, rambuStop: val })}
                                        label="Apakah kendaraan berhenti pada rambu Stop (Sp> Sign)?"
                                    />

                                    <ComplianceButton
                                        value={currentObservation.rambuGiveWay}
                                        onChange={(val) => setCurrentObservation({ ...currentObservation, rambuGiveWay: val })}
                                        label="Apakah kendaraan memberikan prioritas jalan (Give Way Sign)?"
                                    />

                                    <ComplianceButton
                                        value={currentObservation.rambuKecepatanMax}
                                        onChange={(val) => setCurrentObservation({ ...currentObservation, rambuKecepatanMax: val })}
                                        label="Apakah kendaraan tidak dijalankan melebihi kecepatan yang diproses?"
                                    />

                                    <ComplianceButton
                                        value={currentObservation.rambuLaranganMasuk}
                                        onChange={(val) => setCurrentObservation({ ...currentObservation, rambuLaranganMasuk: val })}
                                        label="Apakah tidak memasuki area larangan masuk/tidak boleh lewat?"
                                    />

                                    <ComplianceButton
                                        value={currentObservation.rambuLaranganParkir}
                                        onChange={(val) => setCurrentObservation({ ...currentObservation, rambuLaranganParkir: val })}
                                        label="Apakah kendaraan tidak parkir di area larangan parkir?"
                                    />

                                    <ComplianceButton
                                        value={currentObservation.rambuWajibHelm}
                                        onChange={(val) => setCurrentObservation({ ...currentObservation, rambuWajibHelm: val })}
                                        label="Apakah menggunakan kelengkapan yang wajib seperti helm/sabuk pengaman?"
                                    />

                                    <ComplianceButton
                                        value={currentObservation.rambuLaranganUTurn}
                                        onChange={(val) => setCurrentObservation({ ...currentObservation, rambuLaranganUTurn: val })}
                                        label="Apakah tidak melakukan u-turn/berbalik di area yang tidak diizinkan?"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="keterangan">Keterangan</Label>
                                    <Textarea
                                        id="keterangan"
                                        value={currentObservation.keterangan}
                                        onChange={(e) => setCurrentObservation({ ...currentObservation, keterangan: e.target.value })}
                                        placeholder="Catatan tambahan (opsional)"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={handleSaveObservation}
                                        disabled={!canAddMore}
                                        className="w-full h-12"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Simpan & Lanjut
                                    </Button>
                                    <Button
                                        onClick={() => setStep(3)}
                                        variant="outline"
                                        className="w-full h-12"
                                    >
                                        Selesai ({observations.length} observasi)
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>

                                {!canAddMore && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 rounded-lg p-4 text-center">
                                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                                            Batas maksimal 10 observasi tercapai
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
                            <CardDescription>Tambahkan observer dan tanda tangan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {observers.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold">Observer Terdaftar ({observers.length})</h3>
                                    {observers.map((obs, idx) => (
                                        <Card key={idx} className="bg-green-50 dark:bg-green-900/20 border-green-300">
                                            <CardContent className="pt-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{obs.nama}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{obs.perusahaan}</p>
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

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="observer-nama">Nama Observer <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="observer-nama"
                                            value={manualObserver.nama}
                                            onChange={(e) => setManualObserver({ ...manualObserver, nama: e.target.value })}
                                            placeholder="Nama lengkap observer"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="observer-perusahaan">Perusahaan <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="observer-perusahaan"
                                            value={manualObserver.perusahaan}
                                            onChange={(e) => setManualObserver({ ...manualObserver, perusahaan: e.target.value })}
                                            placeholder="Nama perusahaan"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Tanda Tangan <span className="text-red-500">*</span></Label>
                                    <SignaturePad
                                        onSave={(dataUrl: string) => setManualObserver({ ...manualObserver, signatureDataUrl: dataUrl })}
                                    />
                                </div>

                                <Button onClick={handleAddObserver} variant="outline" className="w-full">
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Observer
                                </Button>
                            </div>

                            <Separator className="my-6" />

                            <Button
                                onClick={() => setStep(4)}
                                className="w-full h-14 text-lg"
                                disabled={observations.length === 0}
                            >
                                Lanjut ke Step 4
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
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
                                    <p>Total Sampel: {observations.length}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h3 className="font-semibold">Total Kendaraan: {observations.length}</h3>
                                <h3 className="font-semibold">Total Observer: {observers.length}</h3>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => navigate("/workspace/sidak/rambu/history")}
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
    );
}
