import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function DashboardFatigueValidation() {
    return (
        <div className="p-6">
            <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6 flex items-center gap-4">
                    <Activity className="w-8 h-8 text-red-600" />
                    <div>
                        <h1 className="text-xl font-bold text-red-800">Dashboard Loaded! (Safe Mode)</h1>
                        <p className="text-gray-600">Jika Anda melihat ini, berarti halaman berhasil dimuat tanpa crash.</p>
                        <p className="text-sm text-gray-500 mt-2">Saya akan mengaktifkan fitur data satu per satu setelah ini.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
