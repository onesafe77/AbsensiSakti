import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Loader2, Link2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
    kpi: {
        total: number;
        fast: number;
        slow: number;
        pctSlow: string;
    };
    hourlyTrend: number[];
    supervisorLeaderboard: Record<string, { fast: number; slow5: number; slow10: number; slow15: number }>;
    statusDistribution: Record<string, number>;
}

export default function FmsFatigueValidationDashboard() {
    const { toast } = useToast();

    // Filters
    const [selectedWeek, setSelectedWeek] = useState<string>("all");
    const [selectedShift, setSelectedShift] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState<string>("all");

    // Fetch Data
    const { data, isLoading, refetch } = useQuery<DashboardData>({
        queryKey: ["fms-fatigue-summary", selectedWeek, selectedShift, selectedMonth],
        queryFn: async () => {
            const params = new URLSearchParams({
                week: selectedWeek,
                shift: selectedShift,
                month: selectedMonth
            });
            const res = await fetch(`/api/fms/fatigue/summary?${params}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            return res.json();
        }
    });

    // Link Sync Handler
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (!linkUrl) {
            toast({ title: "Error", description: "Link URL tidak boleh kosong", variant: "destructive" });
            return;
        }

        setIsSyncing(true);
        try {
            const res = await fetch('/api/fms/fatigue/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: linkUrl }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || errData.error || "Sync failed");
            }

            toast({
                title: "Berhasil Sync!",
                description: "Data dari link berhasil diproses.",
                variant: "default",
            });

            setLinkUrl("");
            setIsLinkDialogOpen(false);
            refetch();

        } catch (error: any) {
            toast({
                title: "Gagal Sync",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Prepare Chart Data
    const hourlyData = data?.hourlyTrend.map((count, hour) => ({
        name: `${hour}:00`,
        alerts: count
    })) || [];

    const pieData = [
        { name: 'Fast (< 5 Min)', value: data?.kpi.fast || 0, color: '#22c55e' }, // Green
        { name: 'Slow (> 5 Min)', value: data?.kpi.slow || 0, color: '#ef4444' }, // Red
    ];

    const supervisors = data?.supervisorLeaderboard
        ? Object.entries(data.supervisorLeaderboard).map(([name, stats]) => ({
            name,
            ...stats,
            total: stats.fast + stats.slow5 + stats.slow10 + stats.slow15
        })).sort((a, b) => b.total - a.total)
        : [];

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard Monitoring Kecepatan Validasi Alert Fatigue FMS 2026</h1>
                    <p className="text-sm text-slate-500">Analisis Kinerja Pengawas (SLA Validasi)</p>
                </div>
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link2 className="w-4 h-4 mr-2" />
                            Sync from Link
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Sync Data Fatigue</DialogTitle>
                            <DialogDescription>
                                Masukkan Link Publish (CSV/Excel/Google Sheets) untuk sinkronisasi data terbaru.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="url" className="text-right">
                                    Link URL
                                </Label>
                                <Input
                                    id="url"
                                    placeholder="https://..."
                                    className="col-span-3"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleSync} disabled={isSyncing}>
                                {isSyncing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Syncing...
                                    </>
                                ) : "Sync Now"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">

                {/* Filters */}
                <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-sm border">
                    <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pilih Week" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Weeks</SelectItem>
                            {[...Array(52)].map((_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>Week {i + 1}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pilih Shift" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Shifts</SelectItem>
                            <SelectItem value="Shift 1">Shift 1</SelectItem>
                            <SelectItem value="Shift 2">Shift 2</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pilih Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            <SelectItem value="Januari">Januari</SelectItem>
                            <SelectItem value="Februari">Februari</SelectItem>
                            {/* Add more months */}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        {/* Top Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Validation Status Pie */}
                            <Card className="col-span-1 shadow-sm border-slate-200">
                                <CardHeader className="items-center pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Status Validasi (Fast vs Slow)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[250px] w-full flex items-center justify-center relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-[-20px]">
                                            <span className="text-3xl font-bold text-slate-800">{data?.kpi.pctSlow}%</span>
                                            <span className="text-xs text-slate-500">Slow {">"} 5m</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Hourly Trend Bar */}
                            <Card className="col-span-1 md:col-span-2 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle className="bg-emerald-600 text-white px-4 py-2 rounded-full w-fit text-sm">Trend Jam Validasi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={hourlyData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" fontSize={11} />
                                                <YAxis fontSize={11} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    cursor={{ fill: '#f1f5f9' }}
                                                />
                                                <Bar dataKey="alerts" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Supervisor Leaderboard */}
                        <div className="grid grid-cols-1 gap-6">
                            <h3 className="text-lg font-bold text-slate-800 border-l-4 border-emerald-600 pl-3">Kinerja Validasi Pengawas</h3>

                            {supervisors.slice(0, 5).map((sup, idx) => (
                                <Card key={idx} className="shadow-sm border-slate-200 overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row items-stretch">
                                            {/* Profile Side */}
                                            <div className="flex items-center justify-center p-6 bg-slate-50 w-full md:w-[200px] border-r border-slate-100 flex-col gap-2">
                                                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <span className="text-2xl">👷</span>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-slate-800 line-clamp-1">{sup.name}</p>
                                                    <p className="text-xs text-slate-500">Pengawas FMS</p>
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                                                <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-lg hover:border-emerald-500 transition-colors">
                                                    <span className="text-xs font-semibold text-emerald-600 mb-1 rounded-full bg-emerald-50 px-2 py-0.5">{"< 5 Menit"}</span>
                                                    <span className="text-3xl font-bold text-slate-900">{sup.fast}</span>
                                                    <span className="text-[10px] text-slate-400">Validasi Cepat</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-lg hover:border-yellow-500 transition-colors">
                                                    <span className="text-xs font-semibold text-yellow-600 mb-1 rounded-full bg-yellow-50 px-2 py-0.5">{"> 5 Menit"}</span>
                                                    <span className="text-3xl font-bold text-slate-900">{sup.slow5}</span>
                                                    <span className="text-[10px] text-slate-400">Sedang</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-lg hover:border-orange-500 transition-colors">
                                                    <span className="text-xs font-semibold text-orange-600 mb-1 rounded-full bg-orange-50 px-2 py-0.5">{"> 10 Menit"}</span>
                                                    <span className="text-3xl font-bold text-slate-900">{sup.slow10}</span>
                                                    <span className="text-[10px] text-slate-400">Lambat</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-lg hover:border-red-500 transition-colors">
                                                    <span className="text-xs font-semibold text-red-600 mb-1 rounded-full bg-red-50 px-2 py-0.5">{"> 15 Menit"}</span>
                                                    <span className="text-3xl font-bold text-slate-900">{sup.slow15}</span>
                                                    <span className="text-[10px] text-slate-400">Sangat Lambat</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
