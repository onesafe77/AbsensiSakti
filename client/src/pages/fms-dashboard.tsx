
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
    ArcElement
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Calendar, AlertTriangle, CheckCircle, XCircle, FileSpreadsheet, Sparkles, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

export default function FmsDashboard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State - Combined DateTime (format: "YYYY-MM-DDTHH:mm")
    const [dateTimeRange, setDateTimeRange] = useState({
        start: format(startOfMonth(new Date()), "yyyy-MM-dd") + "T00:00",
        end: format(endOfMonth(new Date()), "yyyy-MM-dd") + "T23:59"
    });
    // Multi-select filters (arrays)
    const [filters, setFilters] = useState({
        violationTypes: [] as string[],   // Multi-select
        shifts: [] as string[],           // Multi-select
        validationStatuses: [] as string[] // Multi-select
    });
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Build query string from state
    const buildQueryString = () => {
        const params = new URLSearchParams();
        // Split datetime into date and time parts
        const [startDate, startTime] = dateTimeRange.start.split("T");
        const [endDate, endTime] = dateTimeRange.end.split("T");
        params.append("startDate", startDate);
        params.append("endDate", endDate);
        if (startTime) params.append("startTime", startTime);
        if (endTime) params.append("endTime", endTime);
        // Multi-select: send comma-separated values
        if (filters.violationTypes.length > 0) params.append("violationType", filters.violationTypes.join(","));
        if (filters.shifts.length > 0) params.append("shift", filters.shifts.join(","));
        if (filters.validationStatuses.length > 0) params.append("validationStatus", filters.validationStatuses.join(","));
        return params.toString();
    };

    // Queries
    const { data: analytics, isLoading, isError, error } = useQuery({
        queryKey: ["fms-analytics", dateTimeRange, filters],
        queryFn: async () => {
            const res = await apiRequest(`/api/fms/analytics?${buildQueryString()}`, "GET");
            return res;
        }
    });

    // Mutations
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/fms/upload", {
                method: "POST",
                body: formData
            });
            if (!res.ok) throw new Error("Upload failed");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["fms-analytics"] });
            toast({
                title: "Upload Berhasil",
                description: `Memproses ${data.processed} baris data.`,
                variant: "default"
            });
            setIsUploadOpen(false);
        },
        onError: (err) => {
            toast({
                title: "Upload Gagal",
                description: err.message,
                variant: "destructive"
            });
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    // derived data for charts
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            datalabels: {
                color: 'black',
                font: { weight: 'bold' as const },
                formatter: (value: number) => value > 0 ? value : ''
            }
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-red-500">
                <AlertTriangle className="w-10 h-10 mb-2" />
                <p>Gagal memuat data: {error ? String(error) : "Unknown error"}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Coba Lagi</Button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen space-y-6 font-sans">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">FMS VIOLATION COMMAND CENTER</h1>
                    <p className="text-slate-500 text-sm mt-1">Monitoring Pelanggaran & Validasi Keselamatan Operasional</p>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <input
                            type="datetime-local"
                            className="bg-transparent text-sm outline-none w-40"
                            value={dateTimeRange.start}
                            onChange={(e) => setDateTimeRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="datetime-local"
                            className="bg-transparent text-sm outline-none w-40"
                            value={dateTimeRange.end}
                            onChange={(e) => setDateTimeRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Excel
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload Data FMS Harian</DialogTitle>
                            </DialogHeader>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <p className="text-sm text-slate-600 font-medium">Klik untuk upload file Excel (.xlsx)</p>
                                <p className="text-xs text-slate-400 mt-2">Mendukung fitur "Smart Upsert" (Update data jika duplikat)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                            {uploadMutation.isPending && (
                                <div className="text-center text-sm text-blue-600 animate-pulse mt-4">
                                    Sedang memproses data, mohon tunggu...
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* FILTER SECTION - Multi-Select Checkboxes */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-4 border">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-600">Filter:</span>
                </div>

                {/* Violation Type Multi-Select */}
                <div className="relative">
                    <details className="group">
                        <summary className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm bg-white hover:bg-slate-50 min-w-[180px]">
                            <span className="truncate">
                                {filters.violationTypes.length === 0
                                    ? "Semua Jenis"
                                    : `${filters.violationTypes.length} Jenis`}
                            </span>
                            <span className="ml-auto">▼</span>
                        </summary>
                        <div className="absolute z-10 mt-1 w-64 bg-white border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto">
                            {(analytics?.availableViolationTypes || analytics?.byViolation)?.map((v: any) => (
                                <label key={v.type} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={filters.violationTypes.includes(v.type)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFilters(prev => ({ ...prev, violationTypes: [...prev.violationTypes, v.type] }));
                                            } else {
                                                setFilters(prev => ({ ...prev, violationTypes: prev.violationTypes.filter(t => t !== v.type) }));
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    {v.type}
                                </label>
                            ))}
                        </div>
                    </details>
                </div>

                {/* Shift Multi-Select */}
                <div className="relative">
                    <details className="group">
                        <summary className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm bg-white hover:bg-slate-50 min-w-[120px]">
                            <span className="truncate">
                                {filters.shifts.length === 0
                                    ? "Semua Shift"
                                    : filters.shifts.join(", ")}
                            </span>
                            <span className="ml-auto">▼</span>
                        </summary>
                        <div className="absolute z-10 mt-1 w-40 bg-white border rounded-lg shadow-lg p-2">
                            {["Shift 1", "Shift 2"].map((shift) => (
                                <label key={shift} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={filters.shifts.includes(shift)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFilters(prev => ({ ...prev, shifts: [...prev.shifts, shift] }));
                                            } else {
                                                setFilters(prev => ({ ...prev, shifts: prev.shifts.filter(s => s !== shift) }));
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    {shift}
                                </label>
                            ))}
                        </div>
                    </details>
                </div>

                {/* Validation Status Multi-Select */}
                <div className="relative">
                    <details className="group">
                        <summary className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm bg-white hover:bg-slate-50 min-w-[140px]">
                            <span className="truncate">
                                {filters.validationStatuses.length === 0
                                    ? "Semua Status"
                                    : filters.validationStatuses.join(", ")}
                            </span>
                            <span className="ml-auto">▼</span>
                        </summary>
                        <div className="absolute z-10 mt-1 w-44 bg-white border rounded-lg shadow-lg p-2">
                            {["Valid", "Tidak Valid"].map((status) => (
                                <label key={status} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={filters.validationStatuses.includes(status)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFilters(prev => ({ ...prev, validationStatuses: [...prev.validationStatuses, status] }));
                                            } else {
                                                setFilters(prev => ({ ...prev, validationStatuses: prev.validationStatuses.filter(s => s !== status) }));
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    {status}
                                </label>
                            ))}
                        </div>
                    </details>
                </div>

                {/* Reset Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setFilters({ violationTypes: [], shifts: [], validationStatuses: [] });
                    }}
                >
                    Reset
                </Button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Total Violation"
                    value={analytics?.summary?.totalViolations || 0}
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                    trend="vs Last Month"
                    color="bg-red-50 text-red-700"
                />
                <KPICard
                    title="Valid Data"
                    value={analytics?.summary?.validCount || 0}
                    icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                    subValue={`${((analytics?.summary?.validCount / (analytics?.summary?.totalViolations || 1)) * 100).toFixed(1)}%`}
                    color="bg-green-50 text-green-700"
                />
                <KPICard
                    title="Invalid Data"
                    value={analytics?.summary?.invalidCount || 0}
                    icon={<XCircle className="w-5 h-5 text-slate-500" />}
                    subValue={`${((analytics?.summary?.invalidCount / (analytics?.summary?.totalViolations || 1)) * 100).toFixed(1)}%`}
                    color="bg-slate-50 text-slate-700"
                />
                <KPICard
                    title="Unit Terlibat"
                    value={analytics?.summary?.totalUnits || 0}
                    icon={<FileSpreadsheet className="w-5 h-5 text-blue-500" />}
                    color="bg-blue-50 text-blue-700"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: Main Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* PARETO CHART */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pareto Jenis Pelanggaran</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <Bar
                                data={{
                                    labels: analytics?.byViolation?.map((v: any) => v.type),
                                    datasets: [{
                                        label: 'Jumlah Pelanggaran',
                                        data: analytics?.byViolation?.map((v: any) => v.count),
                                        backgroundColor: '#3b82f6',
                                        borderRadius: 4
                                    }]
                                }}
                                options={chartOptions}
                            />
                        </CardContent>
                    </Card>

                    {/* SHIFT ANALYSIS CHART */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi Pelanggaran per Shift</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <Bar
                                data={{
                                    labels: analytics?.byShift?.map((v: any) => v.shift || "Unknown"),
                                    datasets: [{
                                        label: 'Jumlah',
                                        data: analytics?.byShift?.map((v: any) => v.count),
                                        backgroundColor: ['#8b5cf6', '#ec4899', '#f59e0b'],
                                    }]
                                }}
                                options={chartOptions}
                            />
                        </CardContent>
                    </Card>

                    {/* TABLE MATRIX (REQUESTED BY USER) */}
                    <Card className="border-t-4 border-t-yellow-400 shadow-md">
                        <CardHeader className="dir-header bg-yellow-50">
                            <CardTitle className="text-yellow-800 flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5" />
                                Alert FMS Summary Matrix
                            </CardTitle>
                            <CardDescription>Rekapitulasi Validasi Pelanggaran</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-yellow-100 text-yellow-900 border-b border-yellow-200">
                                        <tr>
                                            <th className="p-3 text-left font-bold border-r border-yellow-200">Alert FMS Type</th>
                                            <th className="p-3 text-center font-bold border-r border-yellow-200">Total Monitoring</th>
                                            <th className="p-3 text-center font-bold border-r border-yellow-200">Valid</th>
                                            <th className="p-3 text-center font-bold border-r border-yellow-200">Tidak Valid</th>
                                            <th className="p-3 text-center font-bold border-r border-yellow-200">Valid %</th>
                                            <th className="p-3 text-center font-bold">Tidak Valid %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics?.validationStats?.map((row: any, i: number) => {
                                            const validPct = row.total > 0 ? (row.valid / row.total * 100).toFixed(0) + '%' : '0%';
                                            const invalidPct = row.total > 0 ? (row.invalid / row.total * 100).toFixed(0) + '%' : '0%';
                                            return (
                                                <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <td className="p-3 font-medium text-slate-700 border-r">{row.violationType}</td>
                                                    <td className="p-3 text-center font-bold border-r">{row.total}</td>
                                                    <td className="p-3 text-center text-green-600 font-bold border-r bg-green-50/30">{row.valid}</td>
                                                    <td className="p-3 text-center text-red-600 font-bold border-r bg-red-50/30">{row.invalid}</td>
                                                    <td className="p-3 text-center font-bold text-green-700 border-r">{validPct}</td>
                                                    <td className="p-3 text-center font-bold text-red-700">{invalidPct}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-[#84cc16] text-white font-bold">
                                        <tr>
                                            <td className="p-3">Total Monitoring</td>
                                            <td className="p-3 text-center">{analytics?.summary?.totalViolations}</td>
                                            <td className="p-3 text-center">{analytics?.summary?.validCount}</td>
                                            <td className="p-3 text-center">{analytics?.summary?.invalidCount}</td>
                                            <td className="p-3 text-center">
                                                {analytics?.summary?.totalViolations ? (analytics.summary.validCount / analytics.summary.totalViolations * 100).toFixed(0) : 0}%
                                            </td>
                                            <td className="p-3 text-center">
                                                {analytics?.summary?.totalViolations ? (analytics.summary.invalidCount / analytics.summary.totalViolations * 100).toFixed(0) : 0}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Mystic AI & Heatmap */}
                <div className="space-y-6">
                    {/* MYSTIC AI CARD */}
                    <MysticAnalysisCard data={analytics} />

                    {/* HEATMAP / HOURLY DISTRIBUTION */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Hourly Distribution (Heatmap)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 24 }).map((_, hour) => {
                                    const hourData = analytics?.byHour?.find((h: any) => h.hour === hour);
                                    const count = hourData?.count || 0;
                                    // Calculate intensity (0-100 based on max)
                                    const maxCount = Math.max(...(analytics?.byHour?.map((h: any) => h.count) || [1]));
                                    const intensity = count / maxCount;

                                    let bgClass = "bg-slate-100";
                                    if (count > 0) bgClass = "bg-red-200";
                                    if (intensity > 0.3) bgClass = "bg-red-300";
                                    if (intensity > 0.6) bgClass = "bg-red-400";
                                    if (intensity > 0.8) bgClass = "bg-red-500 text-white";

                                    return (
                                        <div key={hour} className={`p-2 rounded text-center text-xs font-bold ${bgClass} transition-all hover:scale-105 cursor-help`} title={`${count} violations at ${hour}:00`}>
                                            {String(hour).padStart(2, '0')}:00
                                            <div className="text-[10px] opacity-80">{count}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* TOP 5 COMPANIES */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Trend Harian</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            <Line
                                data={{
                                    labels: analytics?.byDate?.map((v: any) => format(new Date(v.date), 'dd MMM')),
                                    datasets: [{
                                        label: 'Total',
                                        data: analytics?.byDate?.map((v: any) => v.count),
                                        borderColor: '#10b981',
                                        tension: 0.4,
                                        pointRadius: 2
                                    }]
                                }}
                                options={{ ...chartOptions, plugins: { legend: { display: false } } }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* WEEKLY STATS TABLE */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        📅 Statistik Mingguan
                    </CardTitle>
                    <CardDescription>Breakdown pelanggaran per minggu</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700">
                                    <th className="px-4 py-2 text-left font-semibold">Minggu</th>
                                    <th className="px-4 py-2 text-center font-semibold">Total</th>
                                    <th className="px-4 py-2 text-center font-semibold">Valid</th>
                                    <th className="px-4 py-2 text-center font-semibold">Invalid</th>
                                    <th className="px-4 py-2 text-center font-semibold">% Valid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics?.byWeek?.length > 0 ? analytics.byWeek.map((w: any, idx: number) => (
                                    <tr key={idx} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-2">Week {w.week || "N/A"}</td>
                                        <td className="px-4 py-2 text-center font-medium">{w.total}</td>
                                        <td className="px-4 py-2 text-center text-green-600 font-medium">{w.valid}</td>
                                        <td className="px-4 py-2 text-center text-red-600 font-medium">{w.invalid}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${w.valid / (w.total || 1) > 0.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {((w.valid / (w.total || 1)) * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="text-center py-4 text-slate-400">Tidak ada data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* TOP 10 DRIVER LEADERBOARD */}
            <Card className="shadow-sm border-l-4 border-amber-500">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        🏆 Top 10 Driver Pelanggaran Valid Terbanyak
                    </CardTitle>
                    <CardDescription>Leaderboard driver dengan pelanggaran yang sudah divalidasi</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-amber-50 text-amber-900">
                                    <th className="px-4 py-2 text-left font-semibold">#</th>
                                    <th className="px-4 py-2 text-left font-semibold">Nama Driver</th>
                                    <th className="px-4 py-2 text-left font-semibold">NIK</th>
                                    <th className="px-4 py-2 text-left font-semibold">No. Lambung</th>
                                    <th className="px-4 py-2 text-center font-semibold">Pelanggaran Valid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics?.topDrivers?.length > 0 ? analytics.topDrivers.map((d: any) => (
                                    <tr key={d.rank} className="border-b hover:bg-amber-50/50">
                                        <td className="px-4 py-2 font-bold text-lg">
                                            {d.rank === 1 ? "🥇" : d.rank === 2 ? "🥈" : d.rank === 3 ? "🥉" : d.rank}
                                        </td>
                                        <td className="px-4 py-2 font-medium">{d.driverName}</td>
                                        <td className="px-4 py-2 text-slate-500 font-mono text-xs">{d.driverNik}</td>
                                        <td className="px-4 py-2">{d.vehicleNo}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">{d.validCount}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="text-center py-4 text-slate-400">Tidak ada data driver</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function KPICard({ title, value, icon, subValue, trend, color }: any) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">{title}</p>
                        <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
                        {subValue && <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${color}`}>{subValue}</span>}
                    </div>
                    <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function MysticAnalysisCard({ data }: any) {
    // Generate Heuristic Insights
    const insights = [];

    if (data) {
        // 1. Dominant Violation
        const topV = data.byViolation?.[0];
        if (topV) {
            insights.push(`Pelanggaran terbanyak adalah "${topV.type}" dengan total ${topV.count} kejadian (${parseInt(topV.percentage)}%).`);
        }

        // 2. High Invalid Rate
        const invalidRate = data.summary?.invalidCount / data.summary?.totalViolations;
        if (invalidRate > 0.5) {
            insights.push(`⚠️ Perhatian: Tingkat data "Tidak Valid" sangat tinggi (${(invalidRate * 100).toFixed(0)}%). Disarankan review proses validasi.`);
        }

        // 3. Shift Pattern
        const shift1 = data.byShift?.find((s: any) => s.shift === 'Shift 1')?.count || 0;
        const shift2 = data.byShift?.find((s: any) => s.shift === 'Shift 2')?.count || 0;

        if (shift2 > shift1 * 1.5) {
            insights.push(`🌙 Pola Shift: Shift 2 memiliki pelanggaraan ${(shift2 / shift1).toFixed(1)}x lipat lebih tinggi dibanding Shift 1. Indikasi kelelahan malam hari.`);
        }

        // 4. Peak Hour
        // Find hour with max count
        const peakHour = data.byHour?.reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current, { count: -1 });
        if (peakHour && peakHour.count > 0) {
            insights.push(`⏰ Waktu Rawan: Puncak pelanggaran terjadi pada jam ${peakHour.hour}:00.`);
        }
    }

    return (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                    <CardTitle className="text-lg">Mystic AI Insights</CardTitle>
                </div>
                <CardDescription className="text-slate-300 text-xs">Analisa otomatis berbasis pola data</CardDescription>
            </CardHeader>
            <CardContent>
                {insights.length > 0 ? (
                    <ul className="space-y-3">
                        {insights.map((insight, i) => (
                            <li key={i} className="text-sm leading-relaxed flex gap-2">
                                <span className="text-yellow-400 mt-1">•</span>
                                <span className="opacity-90">{insight}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-4 text-slate-500 text-sm">Belum cukup data untuk analisa.</div>
                )}

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Powered by Mystic Engine v2.1</span>
                    <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-0">
                        Generate Report
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
