import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardFatigueRedirect() {

    // Function to open new tab
    const openDashboard = () => {
        // Accessing file from public directory
        window.open("/dashboard_fatigue_2026.html", "_blank");
    };

    return (
        <div className="flex flex-col items-center justify-center h-[50vh] p-4">
            <Card className="max-w-md w-full border-red-200 bg-red-50 text-center shadow-lg">
                <CardContent className="pt-6 space-y-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <ExternalLink className="w-8 h-8 text-red-600" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-red-900">Dashboard Validasi Fatigue</h2>
                        <p className="text-gray-600 mt-2 text-sm">
                            Untuk performa terbaik dan mencegah error, dashboard ini dipisahkan dari aplikasi utama.
                        </p>
                    </div>

                    <Button
                        onClick={openDashboard}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg shadow-md transition-transform active:scale-95"
                    >
                        Buka Dashboard (Tab Baru)
                    </Button>

                    <p className="text-xs text-gray-400">
                        Klik tombol di atas untuk membuka dashboard di window baru.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
