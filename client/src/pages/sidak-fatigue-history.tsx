import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Activity, Download, Calendar, Clock, MapPin, Building2, ArrowLeft, ChevronDown, FileText, Image, Camera, X, Upload, Trash2, User } from "lucide-react";
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
import { generateSidakFatiguePdf, downloadSidakFatigueAsJpg } from "@/lib/sidak-pdf-utils";
import type { SidakFatigueSession, SidakFatigueRecord, SidakFatigueObserver } from "@shared/schema";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

interface SessionWithDetails extends SidakFatigueSession {
  records?: SidakFatigueRecord[];
  observers?: SidakFatigueObserver[];
}

export default function SidakFatigueHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sessions, isLoading } = useQuery<SessionWithDetails[]>({
    queryKey: ['/api/sidak-fatigue'],
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ sessionId, files }: { sessionId: string; files: File[] }) => {
      let finalPhotos: string[] = [];
      
      for (const file of files) {
        // Step 1: Request presigned URL
        const urlResponse = await fetch(`/api/sidak-fatigue/${sessionId}/request-upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            contentType: file.type || 'application/octet-stream'
          })
        });
        
        if (!urlResponse.ok) {
          const error = await urlResponse.json();
          throw new Error(error.error || 'Failed to get upload URL');
        }
        
        const { uploadURL, objectPath } = await urlResponse.json();
        
        // Step 2: Upload directly to object storage
        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' }
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to storage');
        }
        
        // Step 3: Confirm upload and add to session
        const confirmResponse = await fetch(`/api/sidak-fatigue/${sessionId}/confirm-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objectPath })
        });
        
        if (!confirmResponse.ok) {
          const error = await confirmResponse.json();
          throw new Error(error.error || 'Failed to confirm upload');
        }
        
        const result = await confirmResponse.json();
        // Use the session's current photos from server (already includes all photos)
        finalPhotos = result.photos;
      }
      
      return { photos: finalPhotos };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sidak-fatigue'] });
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
      const response = await fetch(`/api/sidak-fatigue/${sessionId}/photos/${photoIndex}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete photo');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sidak-fatigue'] });
      setSelectedSession(prev => prev ? { ...prev, activityPhotos: data.photos } : null);
      toast({
        title: "Foto dihapus",
        description: "Foto berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus foto",
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
      // Copy files to array before clearing input (FileList becomes empty after input.value = '')
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
      const response = await fetch(`/api/sidak-fatigue/${sessionId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data session');
      }
      
      const sessionData = await response.json();
      
      // Generate PDF - sessionData is already the full object with records and observers
      const pdf = await generateSidakFatiguePdf({
        session: sessionData,
        records: sessionData.records || [],
        observers: sessionData.observers || [],
      });
      
      // Download PDF
      const fileName = `Sidak_Fatigue_${sessionData.tanggal}_${sessionData.shift.replace(' ', '_')}.pdf`;
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
      setDownloadingId(sessionId);
      
      // Fetch full session data with records and observers
      const response = await fetch(`/api/sidak-fatigue/${sessionId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data session');
      }
      
      const sessionData = await response.json();
      
      // Download as JPG - use .jpg extension
      const fileName = `Sidak_Fatigue_${sessionData.tanggal}_${sessionData.shift.replace(' ', '_')}.jpg`;
      await downloadSidakFatigueAsJpg({
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
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-2xl mx-auto p-3 md:p-4 space-y-4">
        {/* Header - More compact for mobile */}
        <div className="flex items-center gap-3 pt-2">
          <Link href="/workspace/sidak">
            <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-back-sidak">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                Riwayat Sidak Fatigue
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              Form BIB-HSE-ES-F-3.02-16 - Pemeriksaan Kelelahan Karyawan
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">Memuat data...</p>
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent className="pt-0">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Belum ada riwayat Sidak Fatigue
              </p>
              <Link href="/workspace/sidak/fatigue/new">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" size="sm" data-testid="button-create-new">
                  <Activity className="h-4 w-4 mr-2" />
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
                className="overflow-hidden border border-blue-200 dark:border-blue-800 shadow-sm"
                data-testid={`card-session-${session.id}`}
              >
                <CardContent className="p-4">
                  {/* Header row with title and badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Sidak Fatigue - {session.shift}
                    </h3>
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs flex-shrink-0">
                      {session.totalSampel} Karyawan
                    </Badge>
                  </div>
                  
                  {/* Date and time - compact */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(session.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{session.waktuMulai} - {session.waktuSelesai}</span>
                    </div>
                  </div>
                  
                  {/* Location info - compact grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">Lokasi</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 truncate">{session.lokasi}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
                        <Building2 className="h-3 w-3" />
                        <span className="font-medium">Area</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 truncate">{session.area}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
                        <Building2 className="h-3 w-3" />
                        <span className="font-medium">Dept</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 truncate">{session.departemen}</p>
                    </div>
                  </div>
                  
                  {/* Observer info */}
                  {session.observers && session.observers.length > 0 && (
                    <div className="text-xs mb-3">
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
                        <User className="h-3 w-3" />
                        <span className="font-medium">Observer</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {session.observers.map(o => o.nama).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {/* Photo gallery preview if photos exist */}
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
                  
                  {/* Single download dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        disabled={downloadingId === session.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9"
                        data-testid={`button-download-${session.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadingId === session.id ? 'Mengunduh...' : 'Download'}
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

      {/* Photo Upload/View Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Foto Kegiatan SIDAK
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              {/* Session info */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Tanggal:</strong> {format(new Date(selectedSession.tanggal), 'dd MMMM yyyy', { locale: id })}</p>
                <p><strong>Shift:</strong> {selectedSession.shift}</p>
                <p><strong>Lokasi:</strong> {selectedSession.lokasi}</p>
              </div>

              {/* Upload button */}
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="button-upload-photos"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingPhotos ? 'Mengupload...' : 'Upload Foto (Max 6)'}
                </Button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Format: JPG, PNG. Maks 5MB per foto
                </p>
              </div>

              {/* Photo gallery */}
              {selectedSession.activityPhotos && selectedSession.activityPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedSession.activityPhotos.map((photo, idx) => (
                    <PhotoGalleryItem
                      key={idx}
                      photo={photo}
                      index={idx}
                      onDelete={() => handleDeletePhoto(idx)}
                      isDeleting={deletePhotoMutation.isPending}
                      accentColor="blue"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Belum ada foto kegiatan</p>
                </div>
              )}

              {/* Close button */}
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
