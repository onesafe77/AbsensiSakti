import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save,
  X,
  BookOpen,
  Tag,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SafetyPatrolTemplate {
  id: string;
  name: string;
  category: string;
  description: string | null;
  exampleMessage: string;
  expectedFields: any;
  matchingKeywords: string[] | null;
  promptContext: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  category: string;
  description: string;
  exampleMessage: string;
  matchingKeywords: string;
  promptContext: string;
  expectedFields: string;
  isActive: boolean;
}

const emptyForm: TemplateFormData = {
  name: "",
  category: "",
  description: "",
  exampleMessage: "",
  matchingKeywords: "",
  promptContext: "",
  expectedFields: "",
  isActive: true,
};

export default function SafetyPatrolTemplates() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SafetyPatrolTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(emptyForm);
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<SafetyPatrolTemplate[]>({
    queryKey: ['/api/safety-patrol/templates'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/safety-patrol/templates", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Template berhasil dibuat" });
      queryClient.invalidateQueries({ queryKey: ['/api/safety-patrol/templates'] });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal membuat template", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/safety-patrol/templates/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Template berhasil diupdate" });
      queryClient.invalidateQueries({ queryKey: ['/api/safety-patrol/templates'] });
      handleCloseForm();
    },
    onError: (error: any) => {
      console.error("Update template error:", error);
      const message = error?.message || "Gagal mengupdate template";
      toast({ title: "Gagal", description: message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/safety-patrol/templates/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Template berhasil dihapus" });
      queryClient.invalidateQueries({ queryKey: ['/api/safety-patrol/templates'] });
      setIsDeleteOpen(false);
      setSelectedTemplate(null);
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus template", variant: "destructive" });
    }
  });

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (template: SafetyPatrolTemplate) => {
    setSelectedTemplate(template);
    const fields = template.expectedFields;
    const expectedFieldsStr = Array.isArray(fields) ? fields.join(", ") : "";
    setFormData({
      name: template.name,
      category: template.category,
      description: template.description || "",
      exampleMessage: template.exampleMessage,
      matchingKeywords: (template.matchingKeywords || []).join(", "),
      promptContext: template.promptContext || "",
      expectedFields: expectedFieldsStr,
      isActive: template.isActive,
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (template: SafetyPatrolTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTemplate(null);
    setFormData(emptyForm);
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({ title: "Validasi Gagal", description: "Nama Template wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.category.trim()) {
      toast({ title: "Validasi Gagal", description: "Kategori wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.exampleMessage.trim()) {
      toast({ title: "Validasi Gagal", description: "Contoh Format Pesan wajib diisi", variant: "destructive" });
      return;
    }

    const keywords = formData.matchingKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const expectedFields = formData.expectedFields
      .split(",")
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const data = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      description: formData.description.trim() || null,
      exampleMessage: formData.exampleMessage.trim(),
      matchingKeywords: keywords.length > 0 ? keywords : null,
      promptContext: formData.promptContext.trim() || null,
      expectedFields: expectedFields.length > 0 ? expectedFields : null,
      isDefault: false,
      isActive: formData.isActive,
    };

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (selectedTemplate) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            Knowledge Templates
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Template format laporan untuk membantu AI mengenali jenis kegiatan
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-template">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daftar Template ({templates?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : !templates || templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada template</p>
              <p className="text-sm mt-2">Buat template baru untuk membantu AI mengenali format laporan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Template</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                    <TableCell className="font-medium">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="outline" className="ml-2 text-xs">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(template.matchingKeywords || []).slice(0, 3).map((kw, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                        {(template.matchingKeywords || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(template.matchingKeywords || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenEdit(template)}
                        data-testid={`button-edit-${template.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleOpenDelete(template)}
                        data-testid={`button-delete-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Tambah Template Baru"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Template <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="Contoh: Daily Briefing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-template-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
              <Input
                id="category"
                placeholder="Contoh: Safety Meeting, Sidak, Observasi"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={!formData.category.trim() ? "border-amber-400" : ""}
                data-testid="input-template-category"
              />
              <p className="text-xs text-gray-500">
                Kategori laporan (contoh: Briefing, Sidak, Observasi, P2H)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                placeholder="Deskripsi singkat tentang template ini"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-template-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">
                Keywords (pisahkan dengan koma)
              </Label>
              <Input
                id="keywords"
                placeholder="DAILY BRIEFING, SHIFT, ATTENDANCE, HADIR"
                value={formData.matchingKeywords}
                onChange={(e) => setFormData({ ...formData, matchingKeywords: e.target.value })}
                data-testid="input-template-keywords"
              />
              <p className="text-xs text-gray-500">
                Kata kunci yang digunakan untuk mencocokkan pesan dengan template ini
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exampleMessage">Contoh Format Pesan *</Label>
              <Textarea
                id="exampleMessage"
                placeholder="Paste contoh format pesan WhatsApp di sini..."
                value={formData.exampleMessage}
                onChange={(e) => setFormData({ ...formData, exampleMessage: e.target.value })}
                rows={8}
                className="font-mono text-sm"
                data-testid="input-template-example"
              />
              <p className="text-xs text-gray-500">
                Contoh pesan yang akan digunakan AI sebagai referensi parsing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptContext">Instruksi Khusus untuk AI</Label>
              <Textarea
                id="promptContext"
                placeholder="Instruksi tambahan untuk AI saat parsing pesan jenis ini..."
                value={formData.promptContext}
                onChange={(e) => setFormData({ ...formData, promptContext: e.target.value })}
                rows={3}
                data-testid="input-template-context"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedFields">
                Field yang Diharapkan (pisahkan dengan koma)
              </Label>
              <Input
                id="expectedFields"
                placeholder="tanggal, shift, waktu, lokasi, jumlah_peserta"
                value={formData.expectedFields}
                onChange={(e) => setFormData({ ...formData, expectedFields: e.target.value })}
                data-testid="input-template-fields"
              />
              <p className="text-xs text-gray-500">
                Daftar field yang harus diekstrak oleh AI dari pesan (contoh: tanggal, shift, lokasi)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-template-active"
              />
              <Label htmlFor="isActive">Template Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.category || !formData.exampleMessage || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-template"
            >
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus template "{selectedTemplate?.name}"? 
              Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
