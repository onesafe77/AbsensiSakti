import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  Plus,
  X,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Permission, Role } from "@shared/rbac";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Document, DocumentCategory } from "@shared/schema";
import { documentCategories } from "@shared/schema";

const categorySlugMap: Record<string, DocumentCategory> = {
  "kebijakan-kplh": "Kebijakan KPLH",
  "dept-hse": "Prosedur - Dept HSE",
  "dept-opr": "Prosedur - Dept Opr",
  "dept-plant": "Prosedur - Dept Plant",
  "spdk": "SPDK",
  "zero-harm": "Zero Harm",
  "critical-control-card": "Critical Control Card",
  "golden-rule": "Golden Rule",
};

const slugFromCategory: Record<string, string> = {
  "Kebijakan KPLH": "kebijakan-kplh",
  "Prosedur - Dept HSE": "dept-hse",
  "Prosedur - Dept Opr": "dept-opr",
  "Prosedur - Dept Plant": "dept-plant",
  "SPDK": "spdk",
  "Zero Harm": "zero-harm",
  "Critical Control Card": "critical-control-card",
  "Golden Rule": "golden-rule",
};

const categoryShortNames: Record<string, string> = {
  "Kebijakan KPLH": "KPLH",
  "Prosedur - Dept HSE": "PPO HSE",
  "Prosedur - Dept Opr": "PPO OPR",
  "Prosedur - Dept Plant": "PPO PLANT",
  "SPDK": "SPDK",
  "Zero Harm": "ZERO HARM",
  "Critical Control Card": "CCC",
  "Golden Rule": "GOLDEN RULE",
};

export default function DocumentsPage() {
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission(Permission.MANAGE_DOCUMENTS);
  const [, params] = useRoute("/workspace/documents/:category");
  const [location, setLocation] = useLocation();
  
  const getCategoryFromSlug = (slug: string | undefined): string => {
    if (!slug) return "";
    return categorySlugMap[slug] || "";
  };
  
  const [selectedCategory, setSelectedCategory] = useState<string>(() => 
    getCategoryFromSlug(params?.category)
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<{ file: File; title: string }[]>([]);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(false);
  
  const isAdmin = user?.role === Role.ADMIN;
  
  useEffect(() => {
    const newCategory = getCategoryFromSlug(params?.category);
    setSelectedCategory(newCategory);
  }, [params?.category]);

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents/active'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/documents/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/active'] });
      toast({ title: "Dokumen berhasil dihapus" });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      setSelectedDocument(null);
    },
    onError: () => {
      toast({ title: "Gagal menghapus dokumen", variant: "destructive" });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (category: string) => {
      const docsToDelete = documents?.filter(d => d.category === category) || [];
      for (const doc of docsToDelete) {
        await apiRequest(`/api/documents/${doc.id}`, 'DELETE');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/active'] });
      toast({ title: "Semua dokumen dalam kategori berhasil dihapus" });
      setDeleteAllDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Gagal menghapus dokumen", variant: "destructive" });
    }
  });

  const getTitleFromFilename = (filename: string): string => {
    return filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      toast({ title: "Hanya file PDF yang diizinkan", variant: "destructive" });
      return;
    }
    const newFiles = pdfFiles.map(file => ({
      file,
      title: getTitleFromFilename(file.name)
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileTitle = (index: number, title: string) => {
    setUploadFiles(prev => prev.map((f, i) => i === index ? { ...f, title } : f));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !uploadCategory || !user) {
      toast({ title: "Pilih file dan kategori", variant: "destructive" });
      return;
    }

    if (uploadFiles.some(f => !f.title.trim())) {
      toast({ title: "Semua judul dokumen harus diisi", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setCurrentUploadIndex(0);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uploadFiles.length; i++) {
      const { file, title } = uploadFiles[i];
      setCurrentUploadIndex(i + 1);
      setUploadProgress(Math.round(((i) / uploadFiles.length) * 100));
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title.trim());
        formData.append('category', uploadCategory);
        formData.append('uploadedBy', user.nik);
        formData.append('uploadedByName', user.name);

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
      
      setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100));
    }

    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    queryClient.invalidateQueries({ queryKey: ['/api/documents/active'] });
    
    if (failCount === 0) {
      toast({ title: `${successCount} dokumen berhasil diupload` });
    } else if (successCount === 0) {
      toast({ title: `Gagal mengupload ${failCount} dokumen`, variant: "destructive" });
    } else {
      toast({ title: `${successCount} berhasil, ${failCount} gagal`, variant: "destructive" });
    }
    
    setUploadDialogOpen(false);
    setUploadFiles([]);
    setUploadCategory("");
    setUploading(false);
    setUploadProgress(0);
    setCurrentUploadIndex(0);
  };

  const filteredDocuments = selectedCategory 
    ? (documents?.filter(doc => {
        const matchesCategory = doc.category === selectedCategory;
        const matchesSearch = !searchQuery || 
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }) || [])
    : [];
  
  const totalDocuments = documents?.length || 0;
  
  const categoryStats = documentCategories.map(cat => ({
    category: cat,
    count: documents?.filter(d => d.category === cat).length || 0,
    slug: slugFromCategory[cat]
  }));

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleBack = () => {
    if (selectedDocument) {
      setSelectedDocument(null);
    } else {
      setLocation("/workspace");
    }
  };

  const categoryDocsCount = documents?.filter(d => d.category === selectedCategory).length || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Red Header */}
      <div className="bg-red-600 text-white">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={handleBack}
            className="p-1 hover:bg-red-700 rounded-lg transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">
            {selectedCategory ? categoryShortNames[selectedCategory] || selectedCategory : "Dokumen"}
          </h1>
          
          {/* Admin Actions */}
          {canManage && selectedCategory && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setUploadDialogOpen(true)}
                className="p-2 hover:bg-red-700 rounded-lg transition-colors"
                data-testid="button-upload-document"
              >
                <Plus className="w-5 h-5" />
              </button>
              {isAdmin && filteredDocuments.length > 0 && (
                <button
                  onClick={() => setDeleteAllDialogOpen(true)}
                  className="p-2 hover:bg-red-700 rounded-lg transition-colors"
                  data-testid="button-delete-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Red Search Bar */}
        {selectedCategory && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-300" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-red-500 text-white placeholder-red-200 border-none rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-400"
                data-testid="input-search-document"
              />
            </div>
          </div>
        )}
      </div>

      {/* Admin Stats Panel */}
      {isAdmin && selectedCategory && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
            data-testid="button-toggle-stats"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">Statistik Dokumen</span>
              <span className="text-sm text-gray-500">({totalDocuments} total)</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showStats ? 'rotate-180' : ''}`} />
          </button>
          
          {showStats && (
            <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {categoryStats.map(stat => (
                <button
                  key={stat.category}
                  onClick={() => setLocation(`/workspace/documents/${stat.slug}`)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    stat.category === selectedCategory 
                      ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' 
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  data-testid={`stat-${stat.slug}`}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {categoryShortNames[stat.category] || stat.category}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stat.count}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-500 mt-3">Memuat dokumen...</p>
          </div>
        ) : !selectedCategory ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Pilih kategori dokumen dari menu</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? "Tidak ada dokumen yang cocok" : `Belum ada dokumen di kategori ini`}
            </p>
          </div>
        ) : (
          filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => setSelectedDocument(doc)}
              data-testid={`list-document-${doc.id}`}
            >
              {/* Document Icon */}
              <div className="w-12 h-14 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              
              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {doc.fileName.replace(/\.pdf$/i, '')}
                </p>
              </div>
              
              {/* Chevron */}
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Detail Dokumen
            </DialogTitle>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Judul</Label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedDocument.title}</p>
              </div>
              <div>
                <Label className="text-gray-500">Nama File</Label>
                <p className="text-gray-900 dark:text-white">{selectedDocument.fileName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Tanggal Upload</Label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedDocument.createdAt ? format(new Date(selectedDocument.createdAt), 'dd MMM yyyy', { locale: id }) : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Ukuran</Label>
                  <p className="text-gray-900 dark:text-white">{formatFileSize(selectedDocument.fileSize)}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Diupload oleh</Label>
                <p className="text-gray-900 dark:text-white">{selectedDocument.uploadedByName}</p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => window.open(selectedDocument.filePath, '_blank')}
                  data-testid="button-view-document"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedDocument.filePath;
                    link.download = selectedDocument.fileName;
                    link.click();
                  }}
                  data-testid="button-download-document"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Unduh
                </Button>
              </div>
              
              {canManage && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setDocumentToDelete(selectedDocument);
                    setDeleteDialogOpen(true);
                  }}
                  data-testid="button-delete-document"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Dokumen
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!uploading) {
          setUploadDialogOpen(open);
          if (!open) {
            setUploadFiles([]);
            setUploadCategory("");
          }
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Dokumen Baru
            </DialogTitle>
            <DialogDescription>
              Drag & drop file PDF atau klik untuk memilih. Bisa upload banyak file sekaligus.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select 
                value={uploadCategory} 
                onValueChange={(value) => setUploadCategory(value as DocumentCategory)}
                disabled={uploading}
              >
                <SelectTrigger data-testid="select-document-category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {documentCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!uploading && (
              <div className="space-y-2">
                <Label>File PDF</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20" 
                      : "border-gray-300 dark:border-gray-600 hover:border-red-400"
                  }`}
                  onClick={() => document.getElementById('file-input')?.click()}
                  data-testid="dropzone-document-file"
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-red-500" : "text-gray-400"}`} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDragging ? "Lepaskan file di sini..." : "Drag & drop file PDF atau klik untuk memilih"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Bisa pilih banyak file</p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    data-testid="input-document-file"
                  />
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Mengupload file {currentUploadIndex} dari {uploadFiles.length}
                  </span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">
                  {uploadFiles[currentUploadIndex - 1]?.title || "Memproses..."}
                </p>
              </div>
            )}

            {/* File List */}
            {uploadFiles.length > 0 && !uploading && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Label>Daftar File ({uploadFiles.length})</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {uploadFiles.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Input
                          value={item.title}
                          onChange={(e) => updateFileTitle(index, e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Judul dokumen"
                          data-testid={`input-file-title-${index}`}
                        />
                        <p className="text-xs text-gray-400 truncate">
                          {item.file.name} ({formatFileSize(item.file.size)})
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
                        onClick={() => removeFile(index)}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Batal
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={uploading || uploadFiles.length === 0 || !uploadCategory}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-submit-upload"
            >
              {uploading ? "Mengupload..." : `Upload ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Dokumen?</DialogTitle>
            <DialogDescription>
              Dokumen "{documentToDelete?.title}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Semua Dokumen?</DialogTitle>
            <DialogDescription>
              Semua {categoryDocsCount} dokumen di kategori "{selectedCategory}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteAllDialogOpen(false)}
            >
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedCategory && deleteAllMutation.mutate(selectedCategory)}
              disabled={deleteAllMutation.isPending}
              data-testid="button-confirm-delete-all"
            >
              {deleteAllMutation.isPending ? "Menghapus..." : `Hapus Semua (${categoryDocsCount})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
