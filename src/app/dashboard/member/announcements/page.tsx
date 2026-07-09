'use client';

import * as React from 'react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Bell, Clock, Calendar, Volume2 } from 'lucide-react';

export default function MemberAnnouncementsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchAnnouncements = async () => {
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
          const res = await databases.listDocuments(DATABASE_ID, 'announcements', [
            Query.equal('apartmentId', aptId),
            Query.orderDesc('createdAt')
          ]);
          setAnnouncements(res.documents);
        }
      } catch (e) {
        console.error(e);
        toast.show('Duyurular yüklenirken hata oluştu.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [user, toast]);

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
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Apartman Duyuruları</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Yönetim tarafından paylaşılan duyuruları ve kuralları takip edin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {announcements.length === 0 ? (
            <Card className="text-center py-12 text-muted-foreground italic flex flex-col items-center">
              <Bell className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="text-sm">Henüz yayınlanmış bir duyuru bulunmamaktadır.</p>
            </Card>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.$id} className={`overflow-hidden relative ${ann.isPinned ? 'border-primary/30 bg-primary/[0.01]' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg shrink-0 ${ann.isPinned ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
                        <Volume2 className="h-4 w-4" />
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug">{ann.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ann.isPinned && (
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase border border-primary/20">
                          Önemli
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-1">
                    {ann.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
