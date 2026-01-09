import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Newspaper, Plus, Pencil, Trash2, Eye, EyeOff, Bell, Clock, User, AlertTriangle, Loader2, Search, X, Image, ImagePlus } from "lucide-react";

interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  isImportant: boolean;
  createdBy: string;
  createdByName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NewsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deleteConfirmNews, setDeleteConfirmNews] = useState<News | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrls: [] as string[],
    isImportant: false,
    isActive: true,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: newsList = [], isLoading } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/news", "POST", {
        ...data,
        createdBy: user?.nik || "",
        createdByName: user?.name || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/active"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Berhasil",
        description: "Berita berhasil dibuat" + (formData.isImportant ? " dan notifikasi terkirim" : ""),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal membuat berita",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      return apiRequest(`/api/news/${data.id}`, "PATCH", data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/active"] });
      setEditingNews(null);
      resetForm();
      toast({
        title: "Berhasil",
        description: "Berita berhasil diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal memperbarui berita",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/news/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/active"] });
      setDeleteConfirmNews(null);
      toast({
        title: "Berhasil",
        description: "Berita berhasil dihapus",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menghapus berita",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      imageUrls: [],
      isImportant: false,
      isActive: true,
    });
    setSelectedFiles([]);
    setImagePreviews([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: `${file.name} melebihi 5MB`,
          variant: "destructive",
        });
        continue;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Format tidak didukung",
          description: `${file.name} bukan format JPG, PNG, atau GIF`,
          variant: "destructive",
        });
        continue;
      }
      
      setSelectedFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return formData.imageUrls;
    
    setIsUploading(true);
    const uploadedUrls: string[] = [...formData.imageUrls];
    
    try {
      for (const file of selectedFiles) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        
        const response = await fetch('/api/news/upload-image', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (!response.ok) {
          throw new Error(`Gagal mengupload ${file.name}`);
        }
        
        const result = await response.json();
        uploadedUrls.push(result.url);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Gagal mengupload gambar",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
      return formData.imageUrls;
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const existingCount = formData.imageUrls.length;
    
    if (index < existingCount) {
      setFormData({
        ...formData,
        imageUrls: formData.imageUrls.filter((_, i) => i !== index)
      });
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      const newFileIndex = index - existingCount;
      setSelectedFiles(prev => prev.filter((_, i) => i !== newFileIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getNewsImages = (news: News): string[] => {
    if (news.imageUrls && news.imageUrls.length > 0) {
      return news.imageUrls;
    }
    if (news.imageUrl) {
      return [news.imageUrl];
    }
    return [];
  };

  const openEditDialog = (news: News) => {
    const images = getNewsImages(news);
    setFormData({
      title: news.title,
      content: news.content,
      imageUrls: images,
      isImportant: news.isImportant,
      isActive: news.isActive,
    });
    setSelectedFiles([]);
    setImagePreviews(images);
    setEditingNews(news);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validasi Gagal",
        description: "Judul dan konten harus diisi",
        variant: "destructive",
      });
      return;
    }

    const uploadedUrls = await uploadImages();
    const submitData = { ...formData, imageUrls: uploadedUrls };

    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, updates: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const filteredNews = newsList.filter(news => 
    news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    news.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ImageUploadArea = () => (
    <div className="space-y-2">
      <Label>Gambar (Opsional, bisa lebih dari 1)</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        onChange={handleFileSelect}
        multiple
        className="hidden"
        data-testid="input-news-images"
      />
      
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {imagePreviews.map((preview, idx) => (
            <div key={idx} className="relative">
              <img
                src={preview}
                alt={`Preview ${idx + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                onClick={() => removeImage(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <ImagePlus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Klik untuk tambah gambar</p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (Maks. 5MB per file)</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Newspaper className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Manajemen Berita</CardTitle>
                <CardDescription className="text-blue-100">
                  Kelola berita dan informasi perusahaan
                </CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(true);
                  }}
                  data-testid="button-create-news"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Berita Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-blue-600" />
                    Buat Berita Baru
                  </DialogTitle>
                  <DialogDescription>
                    Berita penting akan otomatis mengirim push notification ke semua pengguna yang berlangganan.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Judul Berita</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Masukkan judul berita"
                        data-testid="input-news-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Konten</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Tulis konten berita..."
                        rows={6}
                        data-testid="input-news-content"
                      />
                    </div>
                    <ImageUploadArea />
                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">Berita Penting</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Aktifkan untuk mengirim push notification ke semua pengguna
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.isImportant}
                        onCheckedChange={(checked) => setFormData({ ...formData, isImportant: checked })}
                        data-testid="switch-news-important"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Status Publikasi</p>
                          <p className="text-xs text-gray-500">
                            {formData.isActive ? "Berita akan terlihat oleh pengguna" : "Berita tidak ditampilkan"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        data-testid="switch-news-active"
                      />
                    </div>
                  </div>
                </ScrollArea>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createMutation.isPending || isUploading}
                    data-testid="button-submit-news"
                  >
                    {(createMutation.isPending || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isUploading ? "Mengupload..." : "Publikasikan"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-news"
              />
            </div>
            <Badge variant="secondary" className="self-start md:self-auto">
              {filteredNews.length} berita
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-500 mt-2">Memuat berita...</p>
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="space-y-4">
              {filteredNews.map((news) => {
                const images = getNewsImages(news);
                return (
                  <div
                    key={news.id}
                    className={`p-4 rounded-lg border transition-all ${
                      news.isActive 
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" 
                        : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-60"
                    }`}
                    data-testid={`news-item-${news.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {images.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt=""
                              className="w-12 h-12 rounded object-cover"
                            />
                          ))}
                          {images.length > 3 && (
                            <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                              +{images.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {news.title}
                          </h3>
                          {news.isImportant && (
                            <Badge className="bg-amber-500 text-white">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Penting
                            </Badge>
                          )}
                          {!news.isActive && (
                            <Badge variant="secondary">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          {news.content}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {news.createdByName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(news.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                          </span>
                          {images.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Image className="h-4 w-4" />
                              {images.length} foto
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(news)}
                          data-testid={`button-edit-news-${news.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleteConfirmNews(news)}
                          data-testid={`button-delete-news-${news.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada berita</p>
              <p className="text-sm text-gray-400 mt-1">
                Klik "Buat Berita Baru" untuk menambahkan berita pertama
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={(open) => !open && setEditingNews(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Edit Berita
            </DialogTitle>
            <DialogDescription>
              Perubahan akan langsung tersimpan.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Judul Berita</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masukkan judul berita"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Konten</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tulis konten berita..."
                  rows={6}
                />
              </div>
              <ImageUploadArea />
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Berita Penting</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Tandai sebagai berita penting
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.isImportant}
                  onCheckedChange={(checked) => setFormData({ ...formData, isImportant: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Status Publikasi</p>
                    <p className="text-xs text-gray-500">
                      {formData.isActive ? "Berita akan terlihat oleh pengguna" : "Berita tidak ditampilkan"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingNews(null)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updateMutation.isPending || isUploading}
            >
              {(updateMutation.isPending || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isUploading ? "Mengupload..." : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmNews} onOpenChange={(open) => !open && setDeleteConfirmNews(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Berita?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus berita "{deleteConfirmNews?.title}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmNews && deleteMutation.mutate(deleteConfirmNews.id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
