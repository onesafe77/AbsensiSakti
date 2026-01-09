import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ClipboardCheck, Download, Calendar, Clock, MapPin, ArrowLeft, ChevronDown, FileText, Image, Camera, Upload, Trash2, User } from "lucide-react";
import { PhotoThumbnail, PhotoGalleryItem } from "@/components/ui/image-with-fallback";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { SidakSeatbeltSession, SidakSeatbeltRecord, SidakSeatbeltObserver } from "@shared/schema";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useRef } from "react";

interface SessionWithDetails extends SidakSeatbeltSession {
    records?: SidakSeatbeltRecord[];
    observers?: SidakSeatbeltObserver[];
}

export default function SidakSeatbeltHistory() {
    const { toast } = useToast();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadingJpgId, setDownloadingJpgId] = useState<string | null>(null);
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: sessions, isLoading } = useQuery<SessionWithDetails[]>({
        queryKey: ['/api/sidak-seatbelt'],
    });

    const uploadPhotosMutation = useMutation({
        mutationFn: async ({ sessionId, files }: { sessionId: string; files: File[] }) => {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('photos', file);
            });

            const response = await fetch(`/api/sidak-seatbelt/${sessionId}/upload-photos`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload photos');
            }

            const result = await response.json();
            return { photos: result.photos };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/sidak-seatbelt'] });
            setSelectedSession(prev => prev ? { ...prev, activityPhotos: data.photos } : null);
            toast({
                title: "Foto berhasil diupload",
                description: `${data.photos.length} foto kegiatan tersimpan`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Gagal upload foto",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deletePhotoMutation = useMutation({
        mutationFn: async ({ sessionId, photoIndex }: { sessionId: string; photoIndex: number }) => {
            const response = await fetch(`/api/sidak-seatbelt/${sessionId}/photos/${photoIndex}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete photo');
            }

            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/sidak-seatbelt'] });
            setSelectedSession(prev => prev ? { ...prev, activityPhotos: data.photos } : null);
            toast({
                title: "Foto berhasil dihapus",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Gagal hapus foto",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleOpenPhotoDialog = (session: SessionWithDetails) => {
        setSelectedSession(session);
        setPhotoDialogOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && selectedSession) {
            const filesToUpload = Array.from(e.target.files);
            setUploadingPhotos(true);
            uploadPhotosMutation.mutate(
                { sessionId: selectedSession.id, files: filesToUpload },
                {
                    onSettled: () => {
                        setUploadingPhotos(false);
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    }
                }
            );
        }
    };

    const handleDeletePhoto = (photoIndex: number) => {
        if (selectedSession) {
            deletePhotoMutation.mutate({ sessionId: selectedSession.id, photoIndex });
        }
    };

    const handleDownloadPDF = async (sessionId: string) => {
        try {
            setDownloadingId(sessionId);

            // Fetch full session data with records and observers
            const response = await fetch(`/api/sidak-seatbelt/${sessionId}`);
            if (!response.ok) {
                throw new Error('Gagal mengambil data session');
            }

            const sessionData = await response.json();

            // Dynamically import PDF generation to avoid increasing main bundle size
            const { generateSidakSeatbeltPdf } = await import('@/lib/sidak-seatbelt-pdf-utils');

            // Generate PDF
            const pdf = await generateSidakSeatbeltPdf({
                session: sessionData,
                records: sessionData.records || [],
                observers: sessionData.observers || [],
            });

            // Download PDF
            const fileName = `Sidak_Seatbelt_${sessionData.tanggal}_${sessionData.shift.replace(' ', '_')}.pdf`;
            pdf.save(fileName);

            toast({
                title: "PDF berhasil diunduh",
                description: `File ${fileName} telah tersimpan`,
            });
        } catch (error: any) {
            toast({
                title: "Gagal mengunduh PDF",
                description: error.message || "Terjadi kesalahan saat membuat PDF",
                variant: "destructive",
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadJPG = async (sessionId: string) => {
        try {
            setDownloadingJpgId(sessionId);

            // Fetch full session data with records and observers
            const response = await fetch(`/api/sidak-seatbelt/${sessionId}`);
            if (!response.ok) {
                throw new Error('Gagal mengambil data session');
            }

            const sessionData = await response.json();

            // Dynamically import JPG generation
            const { downloadSidakSeatbeltAsJpg } = await import('@/lib/sidak-seatbelt-pdf-utils');

            // Generate and download JPG
            const fileName = `Sidak_Seatbelt_${sessionData.tanggal}_${sessionData.shift.replace(' ', '_')}_${Date.now()}.jpg`;
            await downloadSidakSeatbeltAsJpg({
                session: sessionData,
                records: sessionData.records || [],
                observers: sessionData.observers || [],
            }, fileName);

            toast({
                title: "JPG berhasil diunduh",
                description: `File ${fileName} telah tersimpan`,
            });
        } catch (error: any) {
            toast({
                title: "Gagal mengunduh JPG",
                description: error.message || "Terjadi kesalahan saat membuat JPG",
                variant: "destructive",
            });
        } finally {
            setDownloadingJpgId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container max-w-2xl mx-auto p-3 md:p-4 space-y-4">
                <div className="flex items-center gap-3 pt-2">
                    <Link href="/workspace/sidak">
                        <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-back-sidak">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="h-6 w-6 text-green-600 flex-shrink-0" />
                            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                                Riwayat Sidak Seatbelt
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                            Form BIB-HSE-ES-F-3.02-86 - Pemeriksaan Seatbelt
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">Memuat data...</p>
                    </div>
                ) : !sessions || sessions.length === 0 ? (
                    <Card className="text-center py-10">
                        <CardContent className="pt-0">
                            <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">
                                Belum ada riwayat Sidak Seatbelt
                            </p>
                            <Link href="/workspace/sidak/seatbelt/new">
                                <Button className="mt-4 bg-green-600 hover:bg-green-700" size="sm" data-testid="button-create-new">
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    Buat Sidak Baru
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <Card
                                key={session.id}
                                className="overflow-hidden border border-green-200 dark:border-green-800 shadow-sm"
                                data-testid={`card-session-${session.id}`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                                            Sidak Seatbelt - {session.shift}
                                        </h3>
                                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs flex-shrink-0">
                                            {session.totalSampel} Unit Termonitor
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{format(new Date(session.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{session.waktu}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                        <div>
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-0.5">
                                                <MapPin className="h-3 w-3" />
                                                <span className="font-medium">Lokasi</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 truncate">{session.lokasi}</p>
                                        </div>
                                    </div>

                                    {session.observers && session.observers.length > 0 && (
                                        <div className="text-xs mb-3">
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-0.5">
                                                <User className="h-3 w-3" />
                                                <span className="font-medium">Observer</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {session.observers.map(o => o.nama).join(', ')}
                                            </p>
                                        </div>
                                    )}

                                    {session.activityPhotos && session.activityPhotos.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                                                <Camera className="h-3 w-3" />
                                                <span>{session.activityPhotos.length} Foto Kegiatan</span>
                                            </div>
                                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                                                {session.activityPhotos.slice(0, 4).map((photo, idx) => (
                                                    <PhotoThumbnail
                                                        key={idx}
                                                        photo={photo}
                                                        index={idx}
                                                        onClick={() => handleOpenPhotoDialog(session)}
                                                    />
                                                ))}
                                                {session.activityPhotos.length > 4 && (
                                                    <div
                                                        className="h-12 w-12 rounded border bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                                                        onClick={() => handleOpenPhotoDialog(session)}
                                                    >
                                                        <span className="text-xs text-gray-600 dark:text-gray-300">+{session.activityPhotos.length - 4}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                disabled={downloadingId === session.id || downloadingJpgId === session.id}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white h-9"
                                                data-testid={`button-download-${session.id}`}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                {(downloadingId === session.id || downloadingJpgId === session.id) ? 'Mengunduh...' : 'Download'}
                                                <ChevronDown className="h-4 w-4 ml-auto" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            {(!session.activityPhotos || session.activityPhotos.length === 0) && (
                                                <div className="px-2 py-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-b mb-1">
                                                    <Camera className="h-3 w-3 inline mr-1" />
                                                    Upload foto dulu untuk download
                                                </div>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => handleDownloadPDF(session.id)}
                                                disabled={!session.activityPhotos || session.activityPhotos.length === 0}
                                                className={!session.activityPhotos || session.activityPhotos.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                                                data-testid={`button-download-pdf-${session.id}`}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Download PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDownloadJPG(session.id)}
                                                disabled={!session.activityPhotos || session.activityPhotos.length === 0}
                                                className={!session.activityPhotos || session.activityPhotos.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                                                data-testid={`button-download-jpg-${session.id}`}
                                            >
                                                <Image className="h-4 w-4 mr-2" />
                                                Download JPG
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenPhotoDialog(session)} data-testid={`button-upload-photo-${session.id}`}>
                                                <Camera className="h-4 w-4 mr-2" />
                                                Upload Foto Kegiatan
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-green-600" />
                            Foto Kegiatan SIDAK
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSession && (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p><strong>Tanggal:</strong> {format(new Date(selectedSession.tanggal), 'dd MMMM yyyy', { locale: id })}</p>
                                <p><strong>Shift:</strong> {selectedSession.shift}</p>
                                <p><strong>Lokasi:</strong> {selectedSession.lokasi}</p>
                            </div>

                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingPhotos || (selectedSession.activityPhotos?.length || 0) >= 6}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    data-testid="button-upload-photos"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploadingPhotos ? 'Mengupload...' : 'Upload Foto (Max 6)'}
                                </Button>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    Format: JPG, PNG. Maks 5MB per foto
                                </p>
                            </div>

                            {selectedSession.activityPhotos && selectedSession.activityPhotos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedSession.activityPhotos.map((photo, idx) => (
                                        <PhotoGalleryItem
                                            key={idx}
                                            photo={photo}
                                            index={idx}
                                            onDelete={() => handleDeletePhoto(idx)}
                                            isDeleting={deletePhotoMutation.isPending}
                                            accentColor="green"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">Belum ada foto kegiatan</p>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => setPhotoDialogOpen(false)}
                                className="w-full"
                                data-testid="button-close-photo-dialog"
                            >
                                Tutup
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
