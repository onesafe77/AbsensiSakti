/**
 * FRONTEND COMPONENT TEMPLATE FOR ALL 7 SIDAK FORMS
 * 
 * This template can be copied and customized for each form.
 * Replace [FORMNAME] with: Antrian, Jarak, Kecepatan, Pencahayaan, LOTO, Digital, Workshop
 * Replace [formname] with lowercase version
 */

// =============================================================================
// FORM PAGE TEMPLATE: sidak-[formname]-form.tsx
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users } from "lucide-react";
import SignaturePad from "signature_pad";

// Import form-specific types from schema
// Note: Replace [FORMNAME] with actual form name (e.g., Antrian)
/* 
import type {
    InsertSidak[FORMNAME]Session,
    InsertSidak[FORMNAME]Record,
    InsertSidak[FORMNAME]Observer
} from "@db/schema";
*/

export function Sidak[FORMNAME]Form() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Session state
    const [sessionData, setSessionData] = useState < InsertSidak[FORMNAME]Session> ({
        tanggal: new Date().toISOString().split('T')[0],
        shift: "Shift 1",
        waktu: "",
        lokasi: "",
        // Add other session fields specific to this form
    });

    // Records state (array of records)
    const [records, setRecords] = useState < InsertSidak[FORMNAME]Record[]> ([]);

    // Observers state
    const [observers, setObservers] = useState < InsertSidak[FORMNAME]Observer[]> ([]);

    // Activity photos
    const [activityPhotos, setActivityPhotos] = useState<string[]>([]);

    // Create session mutation
    const createSessionMutation = useMutation({
        mutationFn: async () => {
            // 1. Create session
            const sessionRes = await fetch('/api/sidak-[formname]', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...sessionData,
                    activityPhotos,
                    createdBy: 'CURRENT_USER_NIK' // Get from auth context
                })
            });

            if (!sessionRes.ok) throw new Error('Failed to create session');
            const session = await sessionRes.json();

            // 2. Create records
            for (const record of records) {
                await fetch(`/api/sidak-[formname]/${session.id}/records`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(record)
                });
            }

            // 3. Create observers
            for (const observer of observers) {
                await fetch(`/api/sidak-[formname]/${session.id}/observers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(observer)
                });
            }

            return session;
        },
        onSuccess: () => {
            toast({
                title: "Berhasil",
                description: "SIDAK [FORMNAME] berhasil disimpan"
            });
            setLocation('/workspace/sidak/[formname]/history');
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleAddRecord = () => {
        setRecords([...records, {
            sessionId: '', // Will be set during save
            ordinal: records.length + 1,
            // Add default values for all record fields
            // CUSTOMIZE FOR EACH FORM
        }]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createSessionMutation.mutate();
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Form SIDAK [FORMNAME]</h1>

            <form onSubmit={handleSubmit}>
                {/* Session Info Card */}
                <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Informasi Sesi</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tanggal</Label>
                            <Input
                                type="date"
                                value={sessionData.tanggal}
                                onChange={(e) => setSessionData({ ...sessionData, tanggal: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Shift</Label>
                            <select
                                className="w-full border rounded p-2"
                                value={sessionData.shift}
                                onChange={(e) => setSessionData({ ...sessionData, shift: e.target.value })}
                            >
                                <option>Shift 1</option>
                                <option>Shift 2</option>
                            </select>
                        </div>

                        {/* ADD OTHER SESSION FIELDS SPECIFIC TO THIS FORM */}
                    </div>
                </Card>

                {/* Records Card */}
                <Card className="p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Data Pemeriksaan</h2>
                        <Button type="button" onClick={handleAddRecord}>
                            + Tambah Baris
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2">No</th>
                                    {/* ADD COLUMN HEADERS SPECIFIC TO FORM */}
                                    <th className="border p-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, idx) => (
                                    <tr key={idx}>
                                        <td className="border p-2">{idx + 1}</td>
                                        {/* ADD INPUT CELLS FOR EACH FIELD */}
                                        <td className="border p-2">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setRecords(records.filter((_, i) => i !== idx))}
                                            >
                                                Hapus
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Observers Card */}
                <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Observer/Pengamat</h2>
                    {/* Add observer input UI - signature canvas, etc */}
                </Card>

                {/* Activity Photos Card */}
                <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Foto Aktivitas</h2>
                    {/* Add photo upload UI */}
                </Card>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={createSessionMutation.isPending}>
                        {createSessionMutation.isPending ? 'Menyimpan...' : 'Simpan SIDAK'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation(-1 as any)}
                    >
                        Batal
                    </Button>
                </div>
            </form>
        </div>
    );
}

// =============================================================================
// HISTORY PAGE TEMPLATE: sidak-[formname]-history.tsx
// =============================================================================

// History section doesn't need re-imports here as they are moved to the top

export function Sidak[FORMNAME]History() {
    const [, setLocation] = useLocation();

    const { data: sessions, isLoading } = useQuery({
        queryKey: ['/api/sidak-[formname]/sessions'],
    });

    if (isLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Riwayat SIDAK [FORMNAME]</h1>
                <Button onClick={() => setLocation('/workspace/sidak/[formname]')}>
                    + Buat SIDAK Baru
                </Button>
            </div>

            <div className="grid gap-4">
                {sessions?.map((session: any) => (
                    <Card
                        key={session.id}
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/workspace/sidak/[formname]/${session.id}`)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">
                                    SIDAK [FORMNAME] - {session.shift}
                                </h3>
                                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(session.tanggal).toLocaleDateString('id-ID')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {session.lokasi}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {session.totalSampel || 0} sampel
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    PDF
                                </Button>
                                <Button variant="outline" size="sm">
                                    JPG
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================

/**
 * FOR EACH OF THE 7 FORMS:
 * 
 * 1. Copy this template
 * 2. Replace [FORMNAME] with: Antrian, Jarak, Kecepatan, Pencahayaan, LOTO, Digital, Workshop
 * 3. Replace [formname] with lowercase: antrian, jarak, kecepatan, pencahayaan, loto, digital, workshop
 * 4. Customize session fields based on schema
 * 5. Customize record fields/columns based on schema
 * 6. Add form-specific validation
 * 7. Test thoroughly
 * 
 * FORM-SPECIFIC CUSTOMIZATIONS NEEDED:
 * 
 * - Antrian: 2 boolean fields (handbrake, jarak aman) - SIMPLE
 * - Jarak: 6 text fields - SIMPLE
 * - Kecepatan: 5 fields with MPH/KPH - SIMPLE
 * - Pencahayaan: 6 fields with lux measurement - MEDIUM
 * - LOTO: 5 boolean checklists - MEDIUM
 * - Digital: 7 boolean checklists - MEDIUM
 * - Workshop: 10 categories with S/TS selection - COMPLEX
 * 
 * Total work per form: 2-4 hours using this template
 */
