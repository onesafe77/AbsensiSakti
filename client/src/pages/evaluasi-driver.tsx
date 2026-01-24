import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Users, CheckCircle, XCircle, ClipboardList, Search, Loader2, Calendar, Filter, GripHorizontal } from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DriverEvaluation {
  id: string;
  nama: string;
  nik: string;
  totalSidak: number;
  status: string;
}

interface EvaluationData {
  summary: {
    totalDrivers: number;
    sudahSidak: number;
    belumSidak: number;
    totalSidakKeseluruhan: number;
  };
  drivers: DriverEvaluation[];
  month: string;
}

export default function EvaluasiDriver() {
  // Get current month in YYYY-MM format
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch evaluation data
  const { data, isLoading } = useQuery<EvaluationData>({
    queryKey: [`/api/evaluasi-driver?month=${selectedMonth}&status=${statusFilter}`],
  });

  // Filter drivers by search query
  const filteredDrivers = useMemo(() => {
    if (!data?.drivers) return [];

    const query = searchQuery.toLowerCase();
    return data.drivers.filter(driver =>
      driver.nama.toLowerCase().includes(query) ||
      driver.nik.toLowerCase().includes(query)
    );
  }, [data?.drivers, searchQuery]);

  // Sort drivers by total SIDAK (descending)
  const sortedDrivers = useMemo(() => {
    return [...filteredDrivers].sort((a, b) => b.totalSidak - a.totalSidak);
  }, [filteredDrivers]);

  // Get top 10 drivers for bar chart
  const top10Drivers = useMemo(() => {
    return sortedDrivers.slice(0, 10);
  }, [sortedDrivers]);

  // Bar chart data
  const barChartData = {
    labels: top10Drivers.map(d => d.nama),
    datasets: [
      {
        label: 'Total SIDAK Fatigue',
        data: top10Drivers.map(d => d.totalSidak),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6,
        barThickness: 30,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 1,
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 10
          },
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45
        },
        border: {
          display: false
        }
      },
    },
  };

  // Pie chart data
  const pieChartData = {
    labels: ['Sudah SIDAK', 'Belum SIDAK'],
    datasets: [
      {
        data: [data?.summary.sudahSidak || 0, data?.summary.belumSidak || 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green
          'rgba(239, 68, 68, 0.8)', // Red
        ],
        borderColor: [
          '#ffffff',
          '#ffffff',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
    },
  };

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    return options;
  }, []);

  // Export to Excel
  const exportToExcel = () => {
    if (!data) return;

    const ws = XLSX.utils.json_to_sheet(
      sortedDrivers.map((driver, index) => ({
        No: index + 1,
        Nama: driver.nama,
        NIK: driver.nik,
        'Total SIDAK': driver.totalSidak,
        Status: driver.status,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evaluasi Driver');

    const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;
    XLSX.writeFile(wb, `Evaluasi_Driver_${monthLabel}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;

    // Title
    doc.setFontSize(16);
    doc.text('Evaluasi Driver SIDAK Fatigue', 14, 15);

    doc.setFontSize(12);
    doc.text(`Periode: ${monthLabel}`, 14, 22);

    // Summary
    doc.setFontSize(10);
    doc.text(`Total Driver: ${data.summary.totalDrivers}`, 14, 32);
    doc.text(`Sudah SIDAK: ${data.summary.sudahSidak}`, 14, 38);
    doc.text(`Belum SIDAK: ${data.summary.belumSidak}`, 14, 44);
    doc.text(`Total SIDAK Keseluruhan: ${data.summary.totalSidakKeseluruhan}`, 14, 50);

    // Table
    autoTable(doc, {
      startY: 58,
      head: [['No', 'Nama Driver', 'NIK', 'Total SIDAK', 'Status']],
      body: sortedDrivers.map((driver, index) => [
        index + 1,
        driver.nama,
        driver.nik,
        driver.totalSidak,
        driver.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }, // Blue header
    });

    doc.save(`Evaluasi_Driver_${monthLabel}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Memuat Data Evaluasi Driver...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 font-sans relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-blue-500/10 via-cyan-500/5 to-transparent pointer-events-none -z-10 blur-3xl" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/50 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
            Evaluasi Driver SIDAK Fatigue
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
              Monthly Report
            </Badge>
            <p className="text-gray-500 text-sm font-medium">
              Monitoring partisipasi driver dalam SIDAK Fatigue
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="bg-white/80 border-green-200 text-green-700 hover:bg-green-50"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="bg-white/80 border-red-200 text-red-700 hover:bg-red-50"
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters - Glassy Bar */}
      <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Periode
          </label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg hover:border-blue-400 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg hover:border-blue-400 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Driver</SelectItem>
              <SelectItem value="sudah">Sudah SIDAK</SelectItem>
              <SelectItem value="belum">Belum SIDAK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Search className="w-3 h-3" /> Cari
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama atau NIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 h-10 rounded-lg focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/70 shadow-sm border-white/50 overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-800">
              {data?.summary.totalDrivers || 0}
            </div>
            <p className="text-xs text-blue-600 font-medium mt-1">Semua driver terdaftar</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/70 shadow-sm border-white/50 overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sudah SIDAK</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">
              {data?.summary.sudahSidak || 0}
            </div>
            <p className="text-xs text-green-600 font-medium mt-1">Driver dengan minimal 1 SIDAK</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/70 shadow-sm border-white/50 overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <XCircle className="w-16 h-16 text-red-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Belum SIDAK</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">
              {data?.summary.belumSidak || 0}
            </div>
            <p className="text-xs text-red-600 font-medium mt-1">Driver belum ada SIDAK</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg border-none text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <ClipboardList className="w-16 h-16 text-white" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total SIDAK</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">
              {data?.summary.totalSidakKeseluruhan || 0}
            </div>
            <p className="text-xs text-blue-100 mt-1">Total kegiatan bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 backdrop-blur-xl bg-white/70 shadow-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <GripHorizontal className="w-5 h-5 text-blue-600" />
              Top 10 Driver
            </CardTitle>
            <CardDescription>Driver dengan partisipasi SIDAK Fatigue terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/70 shadow-sm border-white/50">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              Status Kepatuhan
            </CardTitle>
            <CardDescription>Persentase driver sudah vs belum SIDAK</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Table */}
      <Card className="backdrop-blur-xl bg-white/70 shadow-sm border-white/50 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-white/40">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-gray-800">Daftar Detail Driver</CardTitle>
              <CardDescription>Data lengkap status SIDAK per driver</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              Total: {filteredDrivers.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-16 font-bold text-gray-600">No</TableHead>
                  <TableHead className="font-bold text-gray-600">Nama Driver</TableHead>
                  <TableHead className="font-bold text-gray-600">NIK</TableHead>
                  <TableHead className="text-center font-bold text-gray-600">Total SIDAK</TableHead>
                  <TableHead className="text-center font-bold text-gray-600">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <XCircle className="w-8 h-8 text-gray-300" />
                        <p>Tidak ada data driver ditemukan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDrivers.map((driver, index) => (
                    <TableRow key={driver.id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-700">{driver.nama}</span>
                      </TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{driver.nik}</TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${driver.totalSidak > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          {driver.totalSidak}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`px-3 py-1 rounded-full font-medium ${driver.totalSidak > 0
                              ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                            }`}
                        >
                          {driver.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}
