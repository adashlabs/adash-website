'use client';

import * as React from 'react';
import { databases, DATABASE_ID, DOCUMENTS_BUCKET_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { FileText, Download, FolderOpen, Calendar } from 'lucide-react';

export default function MemberDocumentsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [documents, setDocuments] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const unitRes = await databases.listDocuments(DATABASE_ID, 'units', [
          Query.or([
            Query.equal('tenantId', user.$id),
            Query.equal('ownerId', user.$id)
          ]),
          Query.limit(1)
        ]);

        if (unitRes.documents.length > 0) {
          const aptId = unitRes.documents[0].apartmentId;
          const res = await databases.listDocuments(DATABASE_ID, 'documents', [
            Query.equal('apartmentId', aptId),
            Query.orderDesc('uploadedAt')
          ]);
          setDocuments(res.documents);
        }
      } catch (e) {
        console.error(e);
        toast.show('Belgeler yüklenirken hata oluştu.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [user, toast]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Apartman Belgeleri</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Yönetim tarafından paylaşılan kararlar, yönetmelikler, beyanlar ve diğer resmi evraklar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-4xl">
          {documents.length === 0 ? (
            <Card className="text-center py-12 text-muted-foreground italic flex flex-col items-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="text-sm">Paylaşılan herhangi bir belge bulunmamaktadır.</p>
            </Card>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.$id}
                className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 hover:border-primary/20 hover:bg-muted/10 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-red-50 text-red-600 p-2.5 rounded-lg shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate max-w-md">{doc.name}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      <span className="bg-muted px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {doc.fileType || 'PDF'}
                      </span>
                      {doc.fileSize ? <span>{formatBytes(doc.fileSize)}</span> : null}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={getDownloadUrl(doc.fileId)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all cursor-pointer shrink-0"
                  title="İndir"
                >
                  <Download className="h-4.5 w-4.5" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
