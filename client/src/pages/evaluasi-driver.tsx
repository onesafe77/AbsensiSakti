import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Users, CheckCircle, XCircle, ClipboardList, Search } from "lucide-react";
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
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 10 Driver dengan SIDAK Terbanyak',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
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
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Status SIDAK Driver',
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
      headStyles: { fillColor: [107, 114, 128] },
    });

    doc.save(`Evaluasi_Driver_${monthLabel}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Evaluasi Driver SIDAK Fatigue
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitoring partisipasi driver dalam SIDAK Fatigue per bulan
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Periode</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger data-testid="select-month">
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

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Driver</SelectItem>
                <SelectItem value="sudah">Sudah SIDAK</SelectItem>
                <SelectItem value="belum">Belum SIDAK</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Cari</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama atau NIK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Driver</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-drivers">
              {data?.summary.totalDrivers || 0}
            </div>
            <p className="text-xs text-muted-foreground">Semua driver terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah SIDAK</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-sudah-sidak">
              {data?.summary.sudahSidak || 0}
            </div>
            <p className="text-xs text-muted-foreground">Driver dengan minimal 1 SIDAK</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum SIDAK</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-belum-sidak">
              {data?.summary.belumSidak || 0}
            </div>
            <p className="text-xs text-muted-foreground">Driver belum ada SIDAK</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SIDAK</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-total-sidak">
              {data?.summary.totalSidakKeseluruhan || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total SIDAK dalam periode ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Driver</CardTitle>
            <CardDescription>Driver dengan SIDAK Fatigue terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status SIDAK</CardTitle>
            <CardDescription>Perbandingan driver sudah vs belum SIDAK</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Driver</CardTitle>
              <CardDescription>
                Total {filteredDrivers.length} driver
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                data-testid="button-export-excel"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                data-testid="button-export-pdf"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Nama Driver</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead className="text-center">Total SIDAK</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada data driver
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDrivers.map((driver, index) => (
                    <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell data-testid={`text-driver-name-${driver.id}`}>
                        {driver.nama}
                      </TableCell>
                      <TableCell data-testid={`text-driver-nik-${driver.id}`}>
                        {driver.nik}
                      </TableCell>
                      <TableCell className="text-center font-semibold" data-testid={`text-driver-total-${driver.id}`}>
                        {driver.totalSidak}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={driver.totalSidak > 0 ? "default" : "destructive"}
                          data-testid={`badge-driver-status-${driver.id}`}
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
