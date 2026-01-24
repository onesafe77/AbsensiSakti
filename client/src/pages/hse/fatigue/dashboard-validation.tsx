
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
import { Loader2, AlertTriangle, CheckCircle, Clock, Link as LinkIcon, HardHat, Settings, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

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
        <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-yellow-200/50 pb-20">
            {/* --- TOP GRADIENT ACCENT --- */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

            {/* --- HEADER --- */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                                <div className="relative h-12 w-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-black text-[10px] p-1 text-center leading-3 shadow-lg ring-2 ring-white">
                                    PT GEC
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                    Fatigue Validation Monitor
                                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold tracking-wider">v1.1</span>
                                </h1>
                                <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                    PT Goden Energi Cemelang Lestari
                                    <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                                    FMS Command Center
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/workspace/settings/google-sheets">
                                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 gap-2">
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden sm:inline">Settings</span>
                                </Button>
                            </Link>

                            <div className="h-6 w-px bg-slate-200 mx-1"></div>

                            <Button
                                variant="outline"
                                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm gap-2 transition-all hover:scale-105 active:scale-95"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                <div className={`p-1 rounded-full ${isSyncing ? "bg-amber-100" : "bg-green-100"}`}>
                                    {isSyncing ? <Loader2 className="w-3 h-3 text-amber-600 animate-spin" /> : <LinkIcon className="w-3 h-3 text-green-600" />}
                                </div>
                                <span className="font-semibold text-xs">{isSyncing ? "Syncing Data..." : "Sync Spreadsheet"}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

                {/* --- FILTERS --- */}
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-2 shadow-sm border border-white/40 flex flex-wrap items-center gap-2">
                    <div className="px-4 py-2 flex items-center gap-2 text-slate-400 border-r border-slate-200/60 mr-2">
                        <Settings className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
                    </div>

                    {/* Supervisor */}
                    <Select value={supervisor} onValueChange={setSupervisor}>
                        <SelectTrigger className="h-10 bg-white border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 min-w-[180px] shadow-sm hover:border-indigo-300 transition-colors focus:ring-2 focus:ring-indigo-100">
                            <SelectValue placeholder="All Supervisors" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">All Supervisors</SelectItem>
                            {data && Object.keys(data.supervisorLeaderboard).map(sup => (
                                <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Week */}
                    <Select value={week} onValueChange={setWeek}>
                        <SelectTrigger className="h-10 bg-white border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 w-[120px] shadow-sm hover:border-indigo-300 transition-colors">
                            <SelectValue placeholder="Week" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">All Weeks</SelectItem>
                            {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                                <SelectItem key={w} value={w.toString()}>Week {w}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Shift */}
                    <Select value={shift} onValueChange={setShift}>
                        <SelectTrigger className="h-10 bg-white border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 w-[120px] shadow-sm hover:border-indigo-300 transition-colors">
                            <SelectValue placeholder="Shift" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Shifts</SelectItem>
                            <SelectItem value="Shift 1">Shift 1</SelectItem>
                            <SelectItem value="Shift 2">Shift 2</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="ml-auto flex items-center gap-2">
                        {/* Reset Filter Button could go here */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-xs"
                            onClick={() => {
                                setSupervisor("all");
                                setWeek("all");
                                setShift("all");
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>

                {/* --- CONTENT GRID --- */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* LEFT COLUMN: Charts (8 cols) */}
                    <div className="xl:col-span-8 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* KPI DONUT */}
                            <Card className="bg-white/80 backdrop-blur-md shadow-lg shadow-slate-200/40 border-none rounded-3xl overflow-hidden relative group">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-yellow-500" />
                                        Validation Speed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center justify-center p-6 relative">
                                    <div className="relative w-[220px] h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                                        border: 'none',
                                                        fontSize: '12px',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center Stats */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-5xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{data?.kpi?.pctSlow}%</span>
                                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1">SLOW {">"} 5m</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mt-6 w-full max-w-[280px]">
                                        <div className="flex flex-col items-center p-3 rounded-2xl bg-green-50/50 border border-green-100">
                                            <span className="text-green-600 font-bold text-xl">{data?.kpi?.fast}</span>
                                            <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider">Fast</span>
                                        </div>
                                        <div className="flex flex-col items-center p-3 rounded-2xl bg-red-50/50 border border-red-100">
                                            <span className="text-red-500 font-bold text-xl">{data?.kpi?.slow}</span>
                                            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Slow</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* HOURLY TREND */}
                            <Card className="bg-white/80 backdrop-blur-md shadow-lg shadow-slate-200/40 border-none rounded-3xl overflow-hidden relative">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                        Hourly Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px] p-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={hourlyData}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.6} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                            <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                                            <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* DAILY TREND HUGE CHART */}
                        <Card className="bg-white/80 backdrop-blur-md shadow-lg shadow-slate-200/40 border-none rounded-3xl overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    Daily Validation Volume
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px] p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.dailyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => format(new Date(val), 'dd-MMM')} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy')}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                        <Bar name="< 5 Min" dataKey="fast" stackId="a" fill="#FBBF24" radius={[0, 0, 4, 4]} />
                                        <Bar name="> 5 Min" dataKey="slow5" stackId="a" fill="#EA580C" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* SLOW VALIDATION BREAKDOWN CHART */}
                        <Card className="bg-white/80 backdrop-blur-md shadow-lg shadow-slate-200/40 border-none rounded-3xl overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-400 to-red-500"></div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    Delay Analysis ({">"} 5 Minutes)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[400px] p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.dailyTrend} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                        <YAxis dataKey="date" type="category" width={80} fontSize={10} tickFormatter={(val) => format(new Date(val), 'dd-MMM')} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy')}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                        <Bar name="> 5 Min" dataKey="slow5" stackId="a" fill="#FBBF24" radius={[0, 0, 0, 0]} barSize={24} />
                                        <Bar name="> 10 Min" dataKey="slow10" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={24} />
                                        <Bar name="> 15 Min" dataKey="slow15" stackId="a" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Supervisor Leaderboard (4 cols) */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Supervisor Performance</h2>
                            <Badge variant="outline" className="bg-white text-[10px] text-slate-400 font-mono">LIVE UPDATE</Badge>
                        </div>

                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            {data && Object.entries(data.supervisorLeaderboard).map(([name, stats]) => (
                                <div key={name} className="group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                                                <HardHat className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pengawas FMS</p>
                                                    <h3 className="font-bold text-slate-800 text-sm truncate">{name}</h3>
                                                </div>
                                                <Badge className={`${stats.slow15 > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} border-none`}>
                                                    {stats.slow15 > 0 ? 'Needs Attention' : 'Excellent'}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 mt-4">
                                                <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-400 mb-1">{"<"} 5m</div>
                                                    <div className="text-sm font-black text-slate-700">{stats.fast}</div>
                                                </div>
                                                <div className="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-100">
                                                    <div className="text-[10px] font-bold text-yellow-600 mb-1">{">"} 5m</div>
                                                    <div className="text-sm font-black text-yellow-700">{stats.slow5}</div>
                                                </div>
                                                <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100">
                                                    <div className="text-[10px] font-bold text-orange-600 mb-1">{">"} 10m</div>
                                                    <div className="text-sm font-black text-orange-700">{stats.slow10}</div>
                                                </div>
                                                <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
                                                    <div className="text-[10px] font-bold text-red-600 mb-1">{">"} 15m</div>
                                                    <div className="text-sm font-black text-red-700">{stats.slow15}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
