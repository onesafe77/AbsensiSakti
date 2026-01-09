import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, QrCode, Smartphone, Monitor } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import type { Employee } from "@shared/schema";

interface DriverQRGeneratorProps {
  className?: string;
}

export function DriverQRGenerator({ className }: DriverQRGeneratorProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [qrType, setQrType] = useState<"mobile" | "desktop">("mobile");
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Fetch all employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const generateDriverQR = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Silakan pilih karyawan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Create URL for driver view
      const baseUrl = window.location.origin;
      const driverPath = qrType === "mobile" ? "/mobile-driver" : "/driver-view";
      const driverUrl = `${baseUrl}${driverPath}?nik=${encodeURIComponent(selectedEmployee.id)}`;

      // Generate QR code
      const dataURL = await QRCode.toDataURL(driverUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrDataURL(dataURL);

      toast({
        title: "QR Code Generated",
        description: `QR Code Driver View berhasil dibuat untuk ${selectedEmployee.name}`,
      });
    } catch (error) {
      console.error("QR Generation error:", error);
      toast({
        title: "Error",
        description: "Gagal membuat QR Code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataURL || !selectedEmployee) return;

    const link = document.createElement('a');
    link.href = qrDataURL;
    link.download = `driver-view-qr-${selectedEmployee.name.replace(/[^a-zA-Z0-9]/g, '-')}-${qrType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded",
      description: `QR code driver view untuk ${selectedEmployee.name} berhasil didownload`,
    });
  };

  const printQR = () => {
    if (!qrDataURL || !selectedEmployee) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code Driver View - ${selectedEmployee.name}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                text-align: center; 
                font-family: Arial, sans-serif;
              }
              .header { 
                margin-bottom: 20px; 
                font-size: 24px; 
                font-weight: bold;
              }
              .employee-info { 
                margin-bottom: 20px; 
                font-size: 16px;
              }
              .qr-container { 
                margin: 20px auto; 
                padding: 20px;
                border: 2px solid #000;
                display: inline-block;
              }
              .instructions {
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">QR CODE DRIVER VIEW</div>
            <div class="employee-info">
              <div><strong>Nama:</strong> ${selectedEmployee.name}</div>
              <div><strong>NIK:</strong> ${selectedEmployee.id}</div>
              <div><strong>Type:</strong> ${qrType === 'mobile' ? 'Mobile View' : 'Desktop View'}</div>
            </div>
            <div class="qr-container">
              <img src="${qrDataURL}" alt="QR Code Driver View" />
            </div>
            <div class="instructions">
              <p><strong>Cara Scan:</strong></p>
              <p>1. Buka aplikasi barcode scanner di smartphone</p>
              <p>2. Arahkan kamera ke QR code di atas</p>
              <p>3. Sistem akan otomatis mengarahkan ke halaman Driver View karyawan</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Generate QR Code Driver View
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Karyawan</label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={isLoading}>
              <SelectTrigger data-testid="select-employee">
                <SelectValue placeholder="Pilih karyawan..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} ({employee.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QR Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Jenis Driver View</label>
            <Select value={qrType} onValueChange={(value: "mobile" | "desktop") => setQrType(value)}>
              <SelectTrigger data-testid="select-qr-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile View
                  </div>
                </SelectItem>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Desktop View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateDriverQR}
            disabled={!selectedEmployeeId || isGenerating}
            className="w-full"
            data-testid="button-generate-driver-qr"
          >
            <QrCode className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate QR Code"}
          </Button>

          {/* QR Code Display */}
          {qrDataURL && selectedEmployee && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-4 inline-block p-4 bg-white rounded-lg shadow-sm border">
                  <img 
                    src={qrDataURL} 
                    alt={`QR Code Driver View for ${selectedEmployee.name}`}
                    className="mx-auto"
                    style={{ width: 300, height: 300 }}
                  />
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>Karyawan:</strong> {selectedEmployee.name}</p>
                  <p><strong>NIK:</strong> {selectedEmployee.id}</p>
                  <p><strong>Type:</strong> {qrType === 'mobile' ? 'Mobile View' : 'Desktop View'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={downloadQR}
                  variant="outline"
                  data-testid="button-download-qr"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={printQR}
                  variant="outline"
                  data-testid="button-print-qr"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-2">Cara Menggunakan:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Print atau download QR code di atas</li>
                  <li>Buka aplikasi barcode scanner di smartphone</li>
                  <li>Arahkan kamera ke QR code</li>
                  <li>Sistem akan otomatis mengarahkan ke halaman Driver View</li>
                  <li>QR code ini TIDAK akan mempengaruhi sistem absensi</li>
                </ol>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>
    </div>
  );
}