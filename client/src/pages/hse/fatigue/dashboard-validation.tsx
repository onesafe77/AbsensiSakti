
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Loader2, AlertTriangle, CheckCircle, Clock, Link as LinkIcon, HardHat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
interface KPI {
    total: number;
    fast: number;
    slow: number;
    pctSlow: number;
}

interface SupervisorStats {
    fast: number;
    slow5: number;
    slow10: number;
    slow15: number;
}

interface DailyTrend {
    date: string;
    fast: number;
    slow5: number;
    slow10: number;
    slow15: number;
}

interface FatigueSummary {
    kpi: KPI;
    hourlyTrend: number[];
    dailyTrend: DailyTrend[];
    supervisorLeaderboard: Record<string, SupervisorStats>;
    statusDistribution: Record<string, number>;
    sample: any[];
}

export default function FatigueValidationDashboard() {
    const { toast } = useToast();

    // Filters
    const [week, setWeek] = useState<string>("all");
    const [month, setMonth] = useState<string>("all");
    const [shift, setShift] = useState<string>("all");
    const [supervisor, setSupervisor] = useState<string>("all");

    // Link Sync State
    const [linkUrl, setLinkUrl] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch Data
    const { data, isLoading, refetch } = useQuery<FatigueSummary>({
        queryKey: ["fatigue-summary", week, month, shift, supervisor],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (week !== "all") params.append("week", week);
            if (month !== "all") params.append("month", month);
            if (shift !== "all") params.append("shift", shift);
            if (supervisor !== "all") params.append("supervisor", supervisor);

            const res = await fetch(`/api/fms/fatigue/summary?${params}`);
            if (!res.ok) throw new Error("Failed to fetch summary");
            return res.json() as Promise<FatigueSummary>;
        },
    });

    // Handle Sync
    const handleSync = async () => {
        // Default URL from the project context if not provided
        const targetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpFp6S3NlTR7jWkjXVv3I2xXlfMgaDsM68GT9LFc22LR41mPn63MEAFDVCS6ef6LvY9r2BCMQI8NSX/pub?gid=0&single=true&output=csv";

        try {
            setIsSyncing(true);
            const res = await fetch("/api/fms/fatigue/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: targetUrl }),
            });

            if (!res.ok) throw new Error("Sync failed");

            const result = await res.json();
            toast({ title: "Success", description: "Data synced successfully!" });
            refetch();
        } catch (error) {
            toast({ title: "Error", description: "Failed to sync data", variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-yellow-600" /></div>;
    if (!data) return <div className="p-8">No data available</div>;

    // Prepare Chart Data
    const pieData = data?.kpi ? [
        { name: "Fast (< 5 Min)", value: data.kpi.fast, color: "#22c55e" }, // Green
        { name: "Slow (> 5 Min)", value: data.kpi.slow, color: "#ef4444" }, // Red
    ] : [];

    const hourlyData = data?.hourlyTrend?.map((count, i) => ({
        hour: `${i}:00`,
        count
    })) || [];

    const dailyTrendData = data?.dailyTrend || [];

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

            {/* --- HEADER (Gold Theme) --- */}
            <div className="bg-yellow-400 p-4 shadow-md flex justify-between items-center text-black">
                <div className="flex items-center gap-3">
                    {/* Placeholder Logo */}
                    <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs p-1 text-center leading-3">
                        PT GEC
                    </div>
                    <div>
                        <h1 className="text-xl font-bold leading-tight">Dashboard Monitoring Kecepatan Validasi Alert Fatigue FMS Tahun 2026 <span className="text-xs font-normal bg-black text-white px-1 rounded ml-2">v1.1</span></h1>
                        <p className="text-sm opacity-80">PT Goden Energi Cemelang Lestari</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 text-white border-none gap-2 hover:text-white"
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        <LinkIcon className="h-4 w-4" />
                        {isSyncing ? "Syncing..." : "Sync from Link"}
                    </Button>
                </div>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="bg-white p-4 shadow-sm border-b flex flex-wrap gap-4 items-center">
                {/* Supervisor Filter */}
                <div className="flex flex-col gap-1 w-[200px]">
                    <label className="text-xs font-semibold text-gray-500">Pengawas FMS</label>
                    <Select value={supervisor} onValueChange={setSupervisor}>
                        <SelectTrigger className="h-8 text-sm rounded-full border-gray-300">
                            <SelectValue placeholder="All Supervisors" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Supervisors</SelectItem>
                            {Object.keys(data.supervisorLeaderboard).map(sup => (
                                <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Week Filter */}
                <div className="flex flex-col gap-1 w-[120px]">
                    <label className="text-xs font-semibold text-gray-500">Week</label>
                    <Select value={week} onValueChange={setWeek}>
                        <SelectTrigger className="h-8 text-sm rounded-full border-gray-300">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {/* Generate weeks 1-52 */}
                            {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                                <SelectItem key={w} value={w.toString()}>Week {w}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Shift Filter */}
                <div className="flex flex-col gap-1 w-[120px]">
                    <label className="text-xs font-semibold text-gray-500">Shift</label>
                    <Select value={shift} onValueChange={setShift}>
                        <SelectTrigger className="h-8 text-sm rounded-full border-gray-300">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Shift 1">Shift 1</SelectItem>
                            <SelectItem value="Shift 2">Shift 2</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* LEFT COLUMN: Donut Chart & Trends */}
                <div className="space-y-4">
                    {/* STATUS CARD */}
                    <Card className="rounded-[20px] shadow-sm overflow-hidden border-none">
                        <div className="bg-yellow-400 p-2 text-center text-xs font-bold text-black uppercase tracking-wide">
                            Status Validasi
                        </div>
                        <CardContent className="flex flex-col items-center justify-center p-6 bg-white min-h-[200px]">
                            <div className="relative w-[180px] h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-gray-700">{data.kpi.pctSlow}%</span>
                                    <span className="text-xs text-gray-400">Slow {">"} 5m</span>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-4 text-xs font-medium">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Fast</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Slow</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* HOURLY TREND */}
                    <Card className="rounded-[20px] shadow-sm overflow-hidden border-none">
                        <div className="bg-green-600 p-2 text-center text-xs font-bold text-white uppercase tracking-wide">
                            Trend Jam Validasi
                        </div>
                        <CardContent className="p-4 bg-white h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* DAILY TREND BY CATEGORY */}
                    <Card className="rounded-[20px] shadow-sm overflow-hidden border-none">
                        <div className="bg-green-600 p-2 text-center text-xs font-bold text-white uppercase tracking-wide">
                            Jumlah Validasi by Kategori Validasi
                        </div>
                        <CardContent className="p-4 bg-white h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.dailyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => format(new Date(val), 'dd-MMM')} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy')} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    <Bar name="< 5 Menit" dataKey="fast" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                                    <Bar name="> 5 Menit" dataKey="slow5" stackId="a" fill="#ea580c" radius={[0, 0, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Supervisor Stats */}
                <div className="space-y-4">
                    {Object.entries(data.supervisorLeaderboard).map(([name, stats]) => (
                        <Card key={name} className="rounded-[20px] bg-white shadow-sm border-none overflow-hidden">
                            <div className="grid grid-cols-[120px_1fr] h-full">
                                {/* Avatar / Name Section */}
                                <div className="flex flex-col items-center justify-center p-4 border-r border-gray-100 bg-gray-50">
                                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-2">
                                        <HardHat className="text-white w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold text-center leading-tight">Pengawas FMS<br />{name}</span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 divide-x divide-gray-100">
                                    {/* < 5 Menit */}
                                    <div className="flex flex-col">
                                        <div className="bg-yellow-400 text-[10px] font-bold text-center py-1 truncate px-1">Validasi {"<"} 5 Menit</div>
                                        <div className="flex-1 flex items-center justify-center text-2xl font-bold p-2 text-gray-800">
                                            {stats.fast}
                                        </div>
                                    </div>
                                    {/* > 5 Menit */}
                                    <div className="flex flex-col">
                                        <div className="bg-yellow-400 text-[10px] font-bold text-center py-1 truncate px-1">Validasi {">"} 5 Menit</div>
                                        <div className="flex-1 flex items-center justify-center text-2xl font-bold p-2 text-gray-800">
                                            {stats.slow5}
                                        </div>
                                    </div>
                                    {/* > 10 Menit */}
                                    <div className="flex flex-col">
                                        <div className="bg-yellow-400 text-[10px] font-bold text-center py-1 truncate px-1">Validasi {">"} 10 Menit</div>
                                        <div className="flex-1 flex items-center justify-center text-2xl font-bold p-2 text-gray-800">
                                            {stats.slow10}
                                        </div>
                                    </div>
                                    {/* > 15 Menit */}
                                    <div className="flex flex-col">
                                        <div className="bg-yellow-400 text-[10px] font-bold text-center py-1 truncate px-1">Validasi {">"} 15 Menit</div>
                                        <div className="flex-1 flex items-center justify-center text-2xl font-bold p-2 text-gray-800">
                                            {stats.slow15}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Additional Trend Chart (Daily > 5 Min breakdown) could go here if needed to match the bottom right of reference */}
                    <Card className="rounded-[20px] shadow-sm overflow-hidden border-none mt-6">
                        <div className="bg-green-600 p-2 text-center text-xs font-bold text-white uppercase tracking-wide">
                            Jumlah Validasi {">"} 5 Menit by Kategori Validasi
                        </div>
                        <CardContent className="p-4 bg-white h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.dailyTrend} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="date" type="category" width={80} fontSize={10} tickFormatter={(val) => format(new Date(val), 'dd-MMM')} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy')} />

                                    <Bar name="Validasi > 5 Menit" dataKey="slow5" stackId="a" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar name="Validasi > 10 Menit" dataKey="slow10" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar name="Validasi > 15 Menit" dataKey="slow15" stackId="a" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
