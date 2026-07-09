'use client';

import * as React from 'react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Bell, PlusCircle, Clock, Trash2, Volume2 } from 'lucide-react';

export default function ManagerAnnouncementsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  // Form states
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [targetRole, setTargetRole] = React.useState<'all' | 'members' | 'managers'>('all');
  const [isPinned, setIsPinned] = React.useState(false);

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

        const res = await databases.listDocuments(DATABASE_ID, 'announcements', [
          Query.equal('apartmentId', apt.$id),
          Query.orderDesc('createdAt'),
          Query.limit(100)
        ]);
        setAnnouncements(res.documents);
      }
    } catch (e) {
      console.error(e);
      toast.show('Duyurular yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.show('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      await databases.createDocument(DATABASE_ID, 'announcements', 'unique()', {
        apartmentId: apartment.$id,
        title,
        content,
        targetRole,
        isPinned,
        createdBy: user?.$id || '',
        createdAt: new Date().toISOString()
      });

      // Create notification for everyone if target is all/members
      if (targetRole !== 'managers') {
        // Fetch all residents
        const residentsRes = await databases.listDocuments(DATABASE_ID, 'users', [
          Query.equal('role', 'member'),
          Query.limit(100)
        ]);
        
        await Promise.all(
          residentsRes.documents.map(res =>
            databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
              userId: res.$id,
              title: 'Yeni Duyuru Yayınlandı',
              message: `Yönetim tarafından yeni bir duyuru yayınlandı: ${title}`,
              isRead: false,
              type: 'announcement',
              createdAt: new Date().toISOString()
            })
          )
        );
      }

      // Log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'announcement_created',
        details: `Yeni duyuru oluşturuldu: ${title}`,
        createdAt: new Date().toISOString()
      });

      toast.show('Duyuru başarıyla yayınlandı.', 'success');
      setTitle('');
      setContent('');
      setIsPinned(false);
      setShowAddForm(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.show('Duyuru yayınlanırken hata oluştu.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    try {
      await databases.deleteDocument(DATABASE_ID, 'announcements', id);
      toast.show('Duyuru başarıyla silindi.', 'success');
      loadData();
    } catch (e) {
      toast.show('Duyuru silinemedi.', 'error');
    }
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
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Duyuru Yönetimi</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Apartman sakinleri için duyurular paylaşın ve pano içeriğini düzenleyin.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 shrink-0 font-bold shadow-sm">
            <PlusCircle className="h-4.5 w-4.5" />
            {showAddForm ? 'Vazgeç' : 'Yeni Duyuru Yayınla'}
          </Button>
        </div>

        {/* Add Announcement Form */}
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/[0.01] animate-in slide-in-from-top duration-300">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <PlusCircle className="h-5 w-5" /> Yeni Duyuru Paylaş
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Duyuru Başlığı"
                    type="text"
                    placeholder="Örn: Asansör Rutin Bakımı Hakkında"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Hedef Alıcılar
                    </label>
                    <select
                      value={targetRole}
                      onChange={(e: any) => setTargetRole(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="all">Herkes (Dışarıdan da Görünür)</option>
                      <option value="members">Sadece Sakinler</option>
                      <option value="managers">Sadece Yöneticiler</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Duyuru İçeriği
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Duyuru detaylarını buraya yazın..."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="isPinned" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    Pano Üstüne İğnele (Öncelikli Duyuru)
                  </label>
                </div>

                <Button type="submit" isLoading={submitLoading}>
                  Duyuru Paylaş
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Announcements List */}
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {announcements.length === 0 ? (
            <Card className="text-center py-12 text-muted-foreground italic flex flex-col items-center">
              <Bell className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="text-sm">Yayınlanmış bir duyuru bulunmuyor.</p>
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
                          Sabit
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.$id)}
                        className="text-muted-foreground hover:text-red-600 p-1 rounded hover:bg-red-50 transition-all cursor-pointer"
                        title="Duyuruyu Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-1">
                    {ann.content}
                  </p>

                  <div className="mt-3 pt-3 border-t border-border/60 text-[10px] text-muted-foreground">
                    Alıcılar: <strong className="uppercase">{ann.targetRole === 'all' ? 'Herkes' : (ann.targetRole === 'members' ? 'Sakinler' : 'Yöneticiler')}</strong>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
