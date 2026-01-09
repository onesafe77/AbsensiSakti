
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ClipboardCheck, Download, Calendar, Clock, MapPin, ArrowLeft, ChevronDown, Camera, Upload, Trash2, Lock, FileText, Image } from "lucide-react";
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
import type { SidakLotoSession, SidakLotoRecord, SidakLotoObserver } from "@shared/schema";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useRef } from "react";

interface SessionWithDetails extends SidakLotoSession {
    records?: SidakLotoRecord[];
    observers?: SidakLotoObserver[];
}

export default function SidakLotoHistory() {
    const { toast } = useToast();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadingJpgId, setDownloadingJpgId] = useState<string | null>(null);
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: sessions, isLoading } = useQuery<SessionWithDetails[]>({
        queryKey: ['/api/sidak-loto/sessions'],
    });

    const uploadPhotosMutation = useMutation({
        mutationFn: async ({ sessionId, files }: { sessionId: string; files: File[] }) => {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('photos', file);
            });

            const response = await fetch(`/api/sidak-loto/${sessionId}/upload-photos`, {
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
            queryClient.invalidateQueries({ queryKey: ['/api/sidak-loto/sessions'] });
            setSelectedSession(prev => prev ? { ...prev, activityPhotos: data.photos } : null);
            toast({
                title: "Foto berhasil diupload",
                description: `${data.photos.length} foto kegiatan tersimpan`,
            });
        },
    });

    const deletePhotoMutation = useMutation({
        mutationFn: async ({ sessionId, photoIndex }: { sessionId: string; photoIndex: number }) => {
            const response = await fetch(`/api/sidak-loto/${sessionId}/photos/${photoIndex}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete photo');
            }
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/sidak-loto/sessions'] });
            setSelectedSession(prev => prev ? { ...prev, activityPhotos: data.photos } : null);
            toast({ title: "Foto berhasil dihapus" });
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
            const response = await fetch(`/api/sidak-loto/${sessionId}`);
            if (!response.ok) throw new Error('Gagal mengambil data session');
            const { session, records, observers } = await response.json();
            const { generateSidakLotoPdf } = await import('@/lib/sidak-loto-pdf-utils');
            const doc = await generateSidakLotoPdf({ session, records: records || [], observers: observers || [] });
            const fileName = `Sidak_LOTO_${session.tanggal}_${session.shift?.replace(' ', '_') || 'shift'}.pdf`;
            doc.save(fileName);
            toast({ title: "PDF berhasil diunduh", description: `File ${fileName} telah tersimpan` });
        } catch (error: any) {
            toast({ title: "Gagal mengunduh PDF", description: error.message, variant: "destructive" });
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadJPG = async (sessionId: string) => {
        try {
            setDownloadingJpgId(sessionId);
            const response = await fetch(`/api/sidak-loto/${sessionId}`);
            if (!response.ok) throw new Error('Gagal mengambil data session');
            const { session, records, observers } = await response.json();
            const { downloadSidakLotoAsJpg } = await import('@/lib/sidak-loto-pdf-utils');
            const fileName = `Sidak_LOTO_${session.tanggal}_${Date.now()}.jpg`;
            await downloadSidakLotoAsJpg({ session, records: records || [], observers: observers || [] }, fileName);
            toast({ title: "JPG berhasil diunduh", description: `File ${fileName} telah tersimpan` });
        } catch (error: any) {
            toast({ title: "Gagal mengunduh JPG", description: error.message, variant: "destructive" });
        } finally {
            setDownloadingJpgId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container max-w-2xl mx-auto p-3 md:p-4 space-y-4">
                <div className="flex items-center gap-3 pt-2">
                    <Link href="/workspace/sidak">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Lock className="h-6 w-6 text-slate-700 flex-shrink-0" />
                            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                                Riwayat Sidak LOTO
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                            Form Inspeksi Kepatuhan LOTO
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600 mx-auto"></div>
                        <p className="text-gray-600 mt-3 text-sm">Memuat data...</p>
                    </div>
                ) : !sessions || sessions.length === 0 ? (
                    <Card className="text-center py-10">
                        <CardContent className="pt-0">
                            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">Belum ada riwayat Sidak LOTO</p>
                            <Link href="/workspace/sidak/loto/new">
                                <Button className="mt-4 bg-slate-700 hover:bg-slate-800 text-white" size="sm">
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
                                className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                            {session.departemen} - {session.shift}
                                        </h3>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs flex-shrink-0">
                                            {session.totalSampel} Log
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
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
                                            <div className="flex items-center gap-1 text-slate-600 mb-0.5">
                                                <MapPin className="h-3 w-3" />
                                                <span className="font-medium">Lokasi</span>
                                            </div>
                                            <p className="text-gray-600 truncate">{session.lokasi}</p>
                                        </div>
                                    </div>

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
                                            </div>
                                        </div>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                className="w-full bg-slate-700 hover:bg-slate-800 text-white h-9"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Pilihan Aksi
                                                <ChevronDown className="h-4 w-4 ml-auto" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuItem onClick={() => handleDownloadPDF(session.id)} disabled={downloadingId === session.id}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                {downloadingId === session.id ? 'Mengunduh...' : 'Download PDF'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDownloadJPG(session.id)} disabled={downloadingJpgId === session.id}>
                                                <Image className="h-4 w-4 mr-2" />
                                                {downloadingJpgId === session.id ? 'Mengunduh...' : 'Download JPG'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenPhotoDialog(session)}>
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
                            <Camera className="h-5 w-5 text-slate-700" />
                            Foto Kegiatan SIDAK
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSession && (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600">
                                <p><strong>Tanggal:</strong> {format(new Date(selectedSession.tanggal), 'dd MMMM yyyy', { locale: id })}</p>
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
                                    className="w-full bg-slate-700 hover:bg-slate-800 text-white"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploadingPhotos ? 'Mengupload...' : 'Upload Foto (Max 6)'}
                                </Button>
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
                                            accentColor="slate"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">Belum ada foto kegiatan</p>
                                </div>
                            )}

                            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)} className="w-full">
                                Tutup
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
