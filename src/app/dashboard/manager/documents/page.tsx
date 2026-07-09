'use client';

import * as React from 'react';
import { databases, storage, DATABASE_ID, DOCUMENTS_BUCKET_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { FileText, Upload, Trash2, FolderOpen, Calendar, Download, Loader2 } from 'lucide-react';

export default function ManagerDocumentsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [documents, setDocuments] = React.useState<any[]>([]);

  // Form states
  const [showUploadForm, setShowUploadForm] = React.useState(false);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const [docCategory, setDocCategory] = React.useState('Karar Defteri');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const aptRes = await databases.listDocuments(DATABASE_ID, 'apartments', [
        Query.equal('managerId', user.$id),
        Query.limit(1)
      ]);

      if (aptRes.documents.length > 0) {
        const apt = aptRes.documents[0];
        setApartment(apt);

        const res = await databases.listDocuments(DATABASE_ID, 'documents', [
          Query.equal('apartmentId', apt.$id),
          Query.orderDesc('uploadedAt'),
          Query.limit(100)
        ]);
        setDocuments(res.documents);
      }
    } catch (e) {
      console.error(e);
      toast.show('Belgeler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload file to Appwrite Storage + Database
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !apartment) {
      toast.show('Lütfen bir dosya seçin.', 'error');
      return;
    }

    setUploadLoading(true);
    try {
      const fileId = 'f-' + Math.random().toString(36).substring(2, 9);
      
      // 1. Upload file to Appwrite Storage
      const uploadedFile = await storage.createFile(
        DOCUMENTS_BUCKET_ID,
        fileId,
        selectedFile
      );

      // 2. Create Document metadata document in DB
      await databases.createDocument(DATABASE_ID, 'documents', 'unique()', {
        apartmentId: apartment.$id,
        name: selectedFile.name,
        fileId: uploadedFile.$id,
        fileType: selectedFile.name.split('.').pop() || 'PDF',
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
        category: docCategory
      });

      // Create Log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'document_uploaded',
        details: `${selectedFile.name} belgesi yüklendi.`,
        createdAt: new Date().toISOString()
      });

      toast.show('Dosya başarıyla yüklendi ve sisteme eklendi.', 'success');
      setSelectedFile(null);
      setShowUploadForm(false);
      loadData();
    } catch (e: any) {
      console.error(e);
      toast.show(e.message || 'Dosya yüklenemedi.', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  // Delete document (database + storage)
  const handleDeleteDocument = async (docId: string, fileId: string) => {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    try {
      // 1. Delete from database
      await databases.deleteDocument(DATABASE_ID, 'documents', docId);

      // 2. Delete from storage
      try {
        await storage.deleteFile(DOCUMENTS_BUCKET_ID, fileId);
      } catch (err) {
        // If file not found in storage, ignore
        console.warn('File not found in storage bucket during metadata delete.');
      }

      toast.show('Belge başarıyla silindi.', 'success');
      loadData();
    } catch (e) {
      toast.show('Belge silinemedi.', 'error');
    }
  };

  const getDownloadUrl = (fileId: string) => {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
    return `${endpoint}/storage/buckets/${DOCUMENTS_BUCKET_ID}/files/${fileId}/download?project=${projectId}`;
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!apartment) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted-foreground">Lütfen önce genel bakış sayfasından apartman kurulumunu tamamlayın.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Apartman Belgeleri</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Toplantı tutanakları, bütçeler ve kurallar gibi evrakları yükleyin ve sakinlerle paylaşın.
            </p>
          </div>
          <Button onClick={() => setShowUploadForm(!showUploadForm)} className="gap-2 shrink-0 font-bold shadow-sm">
            <Upload className="h-4.5 w-4.5" />
            {showUploadForm ? 'Vazgeç' : 'Belge Yükle'}
          </Button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <Card className="border-primary/20 bg-primary/[0.01] animate-in slide-in-from-top duration-300">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Upload className="h-5 w-5" /> Yeni Belge Yükle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadDocument} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Belge Kategorisi
                    </label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="Karar Defteri">Karar Defteri</option>
                      <option value="Mali Rapor">Mali Rapor</option>
                      <option value="Yönetmelik">Yönetmelik / Tüzük</option>
                      <option value="Fatura & Makbuz">Fatura & Makbuz</option>
                      <option value="Diğer">Diğer Evraklar</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Dosya Seçin
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer file:border-0 file:bg-transparent file:text-xs file:font-semibold"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" isLoading={uploadLoading}>
                  Belge Yükle
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <div className="grid grid-cols-1 gap-4 max-w-4xl">
          {documents.length === 0 ? (
            <Card className="text-center py-12 text-muted-foreground italic flex flex-col items-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="text-sm">Yüklenmiş herhangi bir belge bulunmamaktadır.</p>
            </Card>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.$id}
                className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 hover:border-primary/20 hover:bg-muted/10 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-red-50 text-red-600 p-2.5 rounded-lg shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate max-w-md">{doc.name}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      <span className="bg-muted px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]">
                        {doc.category}
                      </span>
                      <span>Uzantı: <strong>{doc.fileType?.toUpperCase()}</strong></span>
                      {doc.fileSize ? <span>Boyut: {formatBytes(doc.fileSize)}</span> : null}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={getDownloadUrl(doc.fileId)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all cursor-pointer"
                    title="İndir"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.$id, doc.fileId)}
                    className="flex items-center justify-center p-2 rounded-lg bg-muted hover:bg-red-100 hover:text-red-700 text-muted-foreground transition-all cursor-pointer"
                    title="Belgeyi Sil"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
