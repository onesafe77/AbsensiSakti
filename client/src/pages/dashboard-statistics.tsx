import { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Edit, Sparkles, Loader2 } from "lucide-react";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Oct', 'Nov', 'Des'];
const STORAGE_KEY = 'gecl_dashboard_2026'; // Key updated for 2026
const DEFAULT_DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const DEFAULT_DATA = {
    manpower: Array(12).fill(100),
    days_in_month: [...DEFAULT_DAYS_IN_MONTH],
    leap_year: false,
    hours_per_day: 11,
    factor_mh: 0.85,
    // 2026 Defaults: Incidents all 0
    ti_incidents: Array(12).fill(0),
    tr_value: 6.42,
    mode_ytd_tifr: true,
    fatigue_incidents: Array(12).fill(0),
    mode_ytd_fatigue: true,
    menabrak: Array(12).fill(0),
    rebah: Array(12).fill(0),
    mode_ytd_cifr: true,
    aiInsights: [] as string[]
};

export default function DashboardStatistics() {
    const [data, setData] = useState(DEFAULT_DATA);
    const [chartsData, setChartsData] = useState<{ tifr: number[], fatigue: number[], cifr: number[] }>({ tifr: [], fatigue: [], cifr: [] });
    // MH panel toggle state (incidents are now always visible)
    const [mhOpen, setMhOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState({ mh: 0, tifr: 0, fatigue: 0, cifr: 0 });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeWithAI = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/analyze-statistics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data })
            });
            if (!res.ok) throw new Error("Analysis failed");
            const result = await res.json();
            const newData = { ...data, aiInsights: result.insights };
            setData(newData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        } catch (error) {
            alert("Gagal melakukan analisa AI. Pastikan server berjalan.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Ensure structure match for new year
                setData({ ...DEFAULT_DATA, ...parsed });
            } catch (e) {
                console.error("Data corrupt, resetting");
            }
        }
    }, []);

    useEffect(() => {
        calculate();
    }, [data]);

    const saveData = (newData: typeof DEFAULT_DATA) => {
        setData(newData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    };

    const calculate = () => {
        const MH = [];
        let cumMH = 0;
        let cumTI = 0;
        let cumFatigue = 0;
        let cumMenabrak = 0;
        let cumRebah = 0;

        const series = { tifr: [] as number[], fatigue: [] as number[], cifr: [] as number[] };

        const daysInMonth = [...data.days_in_month];
        daysInMonth[1] = data.leap_year ? 29 : 28;

        for (let i = 0; i < 12; i++) {
            const currentMH = data.manpower[i] * data.hours_per_day * daysInMonth[i] * data.factor_mh;
            MH.push(currentMH);
            cumMH += currentMH;

            cumTI += data.ti_incidents[i];
            cumFatigue += data.fatigue_incidents[i];
            cumMenabrak += data.menabrak[i];
            cumRebah += data.rebah[i];
            const cumCIFRInc = cumMenabrak + cumRebah;
            const currentCIFRInc = data.menabrak[i] + data.rebah[i];

            // TIFR
            series.tifr[i] = data.mode_ytd_tifr
                ? (cumMH > 0 ? (cumTI * 1000000 / cumMH) : 0)
                : (currentMH > 0 ? (data.ti_incidents[i] * 1000000 / currentMH) : 0);

            // Fatigue
            series.fatigue[i] = data.mode_ytd_fatigue
                ? (cumMH > 0 ? (cumFatigue * 1000000 / cumMH) : 0)
                : (currentMH > 0 ? (data.fatigue_incidents[i] * 1000000 / currentMH) : 0);

            // CIFR
            series.cifr[i] = data.mode_ytd_cifr
                ? (cumMH > 0 ? (cumCIFRInc * 1000000 / cumMH) : 0)
                : (currentMH > 0 ? (currentCIFRInc * 1000000 / currentMH) : 0);
        }
        setChartsData(series);
    };

    const commonOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, font: { weight: 'bold' } } },
            datalabels: {
                anchor: 'end', align: 'end', offset: -4,
                color: (ctx: any) => ctx.dataset.type === 'line' ? 'black' : 'white',
                font: { weight: 'bold', size: 10 },
                formatter: (value: number, ctx: any) => {
                    if (ctx.dataset.type === 'line') return value.toFixed(2).replace('.', ',');
                    return value > 0 ? value : '';
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { display: false }, title: { display: false } },
            y1: { beginAtZero: true, position: 'right', grid: { display: false } }
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-t-4 border-red-500">
                <h1 className="text-2xl font-bold text-red-600 uppercase tracking-wide">STATISTIK KESELAMATAN PT GECL 2026</h1>
                <div className="text-right">
                    <div className="text-xs text-gray-500">POWERED BY</div>
                    <div className="font-bold text-gray-800">ONETALENT</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-8">
                    {/* MH Panel (Global Input) */}
                    <Card className="border-slate-200">
                        <CardHeader className="py-3 cursor-pointer hover:bg-slate-50" onClick={() => setMhOpen(!mhOpen)}>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-blue-500" />
                                    INPUT GLOBAL & MANHOURS (MH)
                                </CardTitle>
                                {mhOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </CardHeader>
                        {mhOpen && (
                            <CardContent className="bg-slate-50 p-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <Label>Bulan</Label>
                                        <Select value={selectedMonth.mh.toString()} onValueChange={(v) => setSelectedMonth({ ...selectedMonth, mh: parseInt(v) })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Manpower</Label>
                                        <Input type="number" value={data.manpower[selectedMonth.mh]} onChange={(e) => {
                                            const newManpower = [...data.manpower];
                                            newManpower[selectedMonth.mh] = parseInt(e.target.value) || 0;
                                            setData({ ...data, manpower: newManpower });
                                        }} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Hari Kerja</Label>
                                        <Input type="number" value={data.days_in_month[selectedMonth.mh]} onChange={(e) => {
                                            const newDays = [...data.days_in_month];
                                            newDays[selectedMonth.mh] = parseInt(e.target.value) || 0;
                                            setData({ ...data, days_in_month: newDays });
                                        }} />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                        <Checkbox id="leap" checked={data.leap_year} onCheckedChange={(c) => setData({ ...data, leap_year: !!c })} />
                                        <Label htmlFor="leap">Kabisat (Feb 29)</Label>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Jam/Hari</Label>
                                        <Input type="number" value={data.hours_per_day} onChange={(e) => setData({ ...data, hours_per_day: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Faktor MH (0.85)</Label>
                                        <Input
                                            type="text"
                                            defaultValue={data.factor_mh}
                                            onBlur={(e) => {
                                                // Handle comma as decimal separator
                                                const val = e.target.value.replace(',', '.');
                                                const floatVal = parseFloat(val);
                                                setData({ ...data, factor_mh: isNaN(floatVal) ? 0.85 : floatVal });
                                            }}
                                            placeholder="Ex: 0.85 or 0,85"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-gray-500">MH Bulan Ini (Hasil)</Label>
                                        <Input readOnly disabled className="bg-slate-100 font-bold text-gray-700" value={(() => {
                                            const idx = selectedMonth.mh;
                                            const daysInMonth = [...data.days_in_month];
                                            daysInMonth[1] = data.leap_year ? 29 : 28;
                                            const mh = data.manpower[idx] * data.hours_per_day * daysInMonth[idx] * data.factor_mh;
                                            return mh.toLocaleString('id-ID', { maximumFractionDigits: 2 });
                                        })()} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-gray-500">MH YTD (Hasil)</Label>
                                        <Input readOnly disabled className="bg-slate-100 font-bold text-gray-700" value={(() => {
                                            const idx = selectedMonth.mh;
                                            const daysInMonth = [...data.days_in_month];
                                            daysInMonth[1] = data.leap_year ? 29 : 28;
                                            let ytd = 0;
                                            for (let i = 0; i <= idx; i++) {
                                                ytd += data.manpower[i] * data.hours_per_day * daysInMonth[i] * data.factor_mh;
                                            }
                                            return ytd.toLocaleString('id-ID', { maximumFractionDigits: 2 });
                                        })()} />
                                    </div>
                                    <div className="col-span-full pt-2 text-right">
                                        <Button size="sm" onClick={() => {
                                            saveData(data);
                                            alert("Data Manhours (MH) Berhasil Disimpan! 💾");
                                        }}>Simpan Perubahan MH</Button>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* TIFR Chart with Visible Input Panel */}
                    <Card className="relative">
                        <div className="bg-red-50 p-4 border-b border-red-100 mb-4 rounded-t-lg">
                            <h3 className="font-bold text-red-700 mb-2 text-sm">INPUT TIFR (INSIDEN)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div className="space-y-1">
                                    <Label className="text-xs">Bulan</Label>
                                    <Select value={selectedMonth.tifr.toString()} onValueChange={(v) => setSelectedMonth({ ...selectedMonth, tifr: parseInt(v) })}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Total Insiden</Label>
                                    <Input className="bg-white" type="number" placeholder="0" value={data.ti_incidents[selectedMonth.tifr]} onChange={(e) => {
                                        const newIncidents = [...data.ti_incidents];
                                        newIncidents[selectedMonth.tifr] = parseInt(e.target.value) || 0;
                                        setData({ ...data, ti_incidents: newIncidents });
                                    }} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Nilai TR (Global)</Label>
                                    <Input className="bg-white" type="number" step="0.01" value={data.tr_value} onChange={(e) => setData({ ...data, tr_value: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="flex items-center space-x-2 pb-2">
                                    <Checkbox id="ytd_tifr" checked={data.mode_ytd_tifr} onCheckedChange={(c) => setData({ ...data, mode_ytd_tifr: !!c })} />
                                    <Label htmlFor="ytd_tifr" className="text-xs font-semibold">Mode YTD</Label>
                                </div>
                                <Button size="sm" onClick={() => saveData(data)}>Simpan TIFR</Button>
                            </div>
                        </div>

                        <div className="p-4 h-[350px]">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mr-3 border border-green-200">1</div>
                                <h2 className="font-bold text-gray-800">TIFR (Total Injury Frequency Rate)</h2>
                            </div>
                            <Chart type='bar' data={{
                                labels: MONTHS,
                                datasets: [
                                    { type: 'bar' as const, label: 'Insiden', data: data.ti_incidents, backgroundColor: '#dc2626', order: 2, yAxisID: 'y' },
                                    { type: 'line' as const, label: 'TIFR', data: chartsData.tifr, borderColor: '#166534', backgroundColor: '#166534', borderWidth: 2, pointRadius: 4, order: 1, yAxisID: 'y1' },
                                    { type: 'line' as const, label: 'TR', data: Array(12).fill(data.tr_value), borderColor: '#ef4444', borderDash: [5, 5], pointRadius: 0, borderWidth: 2, order: 0, yAxisID: 'y1' }
                                ]
                            }} options={commonOptions} />
                        </div>
                    </Card>

                    {/* Fatigue Chart with Visible Input Panel */}
                    <Card className="relative">
                        <div className="bg-orange-50 p-4 border-b border-orange-100 mb-4 rounded-t-lg">
                            <h3 className="font-bold text-orange-700 mb-2 text-sm">INPUT FATIGUE (INSIDEN)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div className="space-y-1">
                                    <Label className="text-xs">Bulan</Label>
                                    <Select value={selectedMonth.fatigue.toString()} onValueChange={(v) => setSelectedMonth({ ...selectedMonth, fatigue: parseInt(v) })}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Insiden Fatigue</Label>
                                    <Input className="bg-white" type="number" placeholder="0" value={data.fatigue_incidents[selectedMonth.fatigue]} onChange={(e) => {
                                        const newFatigue = [...data.fatigue_incidents];
                                        newFatigue[selectedMonth.fatigue] = parseInt(e.target.value) || 0;
                                        setData({ ...data, fatigue_incidents: newFatigue });
                                    }} />
                                </div>
                                <div className="flex items-center space-x-2 pb-2">
                                    <Checkbox id="ytd_fat" checked={data.mode_ytd_fatigue} onCheckedChange={(c) => setData({ ...data, mode_ytd_fatigue: !!c })} />
                                    <Label htmlFor="ytd_fat" className="text-xs font-semibold">Mode YTD</Label>
                                </div>
                                <Button size="sm" onClick={() => saveData(data)} className="bg-orange-500 hover:bg-orange-600">Simpan Fatigue</Button>
                            </div>
                        </div>

                        <div className="p-4 h-[350px]">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mr-3 border border-green-200">2</div>
                                <h2 className="font-bold text-gray-800">Fatigue FR</h2>
                            </div>
                            <Chart type='bar' data={{
                                labels: MONTHS,
                                datasets: [
                                    { type: 'bar' as const, label: 'Insiden Fatigue', data: data.fatigue_incidents, backgroundColor: '#ea580c', order: 2, yAxisID: 'y' },
                                    { type: 'line' as const, label: 'Fatigue FR', data: chartsData.fatigue, borderColor: '#166534', backgroundColor: '#166534', borderWidth: 2, order: 1, yAxisID: 'y1' }
                                ]
                            }} options={commonOptions} />
                        </div>
                    </Card>

                    {/* CIFR Chart with Visible Input Panel */}
                    <Card className="relative">
                        <div className="bg-green-50 p-4 border-b border-green-100 mb-4 rounded-t-lg">
                            <h3 className="font-bold text-green-700 mb-2 text-sm">INPUT CIFR (INSIDEN)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div className="space-y-1">
                                    <Label className="text-xs">Bulan</Label>
                                    <Select value={selectedMonth.cifr.toString()} onValueChange={(v) => setSelectedMonth({ ...selectedMonth, cifr: parseInt(v) })}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Menabrak</Label>
                                    <Input className="bg-white" type="number" placeholder="0" value={data.menabrak[selectedMonth.cifr]} onChange={(e) => {
                                        const newMenabrak = [...data.menabrak];
                                        newMenabrak[selectedMonth.cifr] = parseInt(e.target.value) || 0;
                                        setData({ ...data, menabrak: newMenabrak });
                                    }} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Rebah</Label>
                                    <Input className="bg-white" type="number" placeholder="0" value={data.rebah[selectedMonth.cifr]} onChange={(e) => {
                                        const newRebah = [...data.rebah];
                                        newRebah[selectedMonth.cifr] = parseInt(e.target.value) || 0;
                                        setData({ ...data, rebah: newRebah });
                                    }} />
                                </div>
                                <div className="flex items-center space-x-2 pb-2">
                                    <Checkbox id="ytd_cifr" checked={data.mode_ytd_cifr} onCheckedChange={(c) => setData({ ...data, mode_ytd_cifr: !!c })} />
                                    <Label htmlFor="ytd_cifr" className="text-xs font-semibold">Mode YTD</Label>
                                </div>
                                <Button size="sm" onClick={() => saveData(data)} className="bg-green-600 hover:bg-green-700">Simpan CIFR</Button>
                            </div>
                        </div>

                        <div className="p-4 h-[350px]">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mr-3 border border-green-200">3</div>
                                <h2 className="font-bold text-gray-800">CIFR (Combined Injury Frequency Rate)</h2>
                            </div>
                            <Chart type='bar' data={{
                                labels: MONTHS,
                                datasets: [
                                    { type: 'bar' as const, label: 'Menabrak', data: data.menabrak, backgroundColor: '#dc2626', stack: 'stack1', order: 3, yAxisID: 'y' },
                                    { type: 'bar' as const, label: 'Rebah', data: data.rebah, backgroundColor: '#64748b', stack: 'stack1', order: 2, yAxisID: 'y' },
                                    { type: 'line' as const, label: 'CIFR', data: chartsData.cifr, borderColor: '#166534', backgroundColor: '#166534', borderWidth: 2, order: 1, yAxisID: 'y1' }
                                ]
                            }} options={commonOptions} />
                        </div>
                    </Card>

                    <div className="text-center pt-8">
                        <Button variant="outline" className="text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => {
                            if (confirm("Yakin ingin menghapus semua data 2026 dan kembali ke default 0?")) {
                                localStorage.removeItem(STORAGE_KEY);
                                setData(DEFAULT_DATA);
                            }
                        }}>Clear Data 2026</Button>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-[#dcfce7] rounded-3xl p-6 sticky top-6 shadow-md border-2 border-white">
                        <div className="flex justify-between items-center mb-4 border-b border-green-300 pb-2">
                            <h3 className="font-bold text-gray-800">Keterangan 2026:</h3>
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={analyzeWithAI}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                {isAnalyzing ? "Menganalisa..." : "Tanya AI"}
                            </Button>
                        </div>
                        {data.aiInsights && data.aiInsights.length > 0 ? (
                            <ul className="space-y-4 text-sm text-gray-700 leading-relaxed font-medium">
                                {data.aiInsights.map((insight, idx) => (
                                    <li key={idx} className="flex gap-2">
                                        <span className="text-green-600 text-lg">•</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-xs italic">
                                Belum ada analisa AI. Klik "Tanya AI" untuk generate insight.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
