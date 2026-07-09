'use client';

import * as React from 'react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Wrench, Calendar, ClipboardList, HelpCircle, User, Check, Edit3, MessageSquare } from 'lucide-react';

export default function ManagerRequestsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [requests, setRequests] = React.useState<any[]>([]);
  const [usersMap, setUsersMap] = React.useState<Record<string, any>>({});
  const [unitsMap, setUnitsMap] = React.useState<Record<string, any>>({});

  // Action dialog states
  const [selectedReq, setSelectedReq] = React.useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = React.useState<'waiting' | 'in_progress' | 'completed'>('waiting');
  const [managerComment, setManagerComment] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);

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

        const reqsRes = await databases.listDocuments(DATABASE_ID, 'maintenance_requests', [
          Query.equal('apartmentId', apt.$id),
          Query.orderDesc('createdAt'),
          Query.limit(100)
        ]);
        setRequests(reqsRes.documents);

        // Fetch users mapping
        const usersRes = await databases.listDocuments(DATABASE_ID, 'users', [
          Query.limit(100)
        ]);
        const uMap: Record<string, any> = {};
        usersRes.documents.forEach((usr: any) => {
          uMap[usr.$id] = usr;
        });
        setUsersMap(uMap);

        // Fetch units mapping
        const unitsRes = await databases.listDocuments(DATABASE_ID, 'units', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100)
        ]);
        const unMap: Record<string, any> = {};
        unitsRes.documents.forEach((un: any) => {
          unMap[un.$id] = un;
        });
        setUnitsMap(unMap);
      }
    } catch (e) {
      console.error(e);
      toast.show('Talep verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleOpenActionModal = (req: any) => {
    setSelectedReq(req);
    setUpdateStatus(req.status);
    setManagerComment(req.managerComment || '');
  };

  const handleUpdateReq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setActionLoading(true);
    try {
      // 1. Update request document in DB
      await databases.updateDocument(DATABASE_ID, 'maintenance_requests', selectedReq.$id, {
        status: updateStatus,
        managerComment: managerComment.trim() || null
      });

      // 2. Create notification for the resident who opened the ticket
      const statusTexts = {
        waiting: 'Beklemede',
        in_progress: 'İşleme Alındı',
        completed: 'Tamamlandı'
      };

      await databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
        userId: selectedReq.createdBy,
        title: 'Talep Durumu Güncellendi',
        message: `"${selectedReq.title}" başlıklı arıza talebinizin durumu "${statusTexts[updateStatus]}" olarak güncellendi. Yorum: ${managerComment || 'Yok'}`,
        isRead: false,
        type: 'maintenance',
        createdAt: new Date().toISOString()
      });

      // Create log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'request_updated',
        details: `Talep (${selectedReq.title}) güncellendi: ${statusTexts[updateStatus]}`,
        createdAt: new Date().toISOString()
      });

      toast.show('Talep başarıyla güncellendi.', 'success');
      setSelectedReq(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.show('Talep güncellenemedi.', 'error');
    } finally {
      setActionLoading(false);
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
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Gelen Arıza & Talepler</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sakinlerin bildirdiği arıza kayıtlarını inceleyin, durumlarını güncelleyin ve çözüme kavuşturun.
          </p>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Sakin Talep Havuzu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic flex flex-col items-center">
                <Wrench className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm">Bildirilen herhangi bir arıza talebi bulunmuyor.</p>
              </div>
            ) : (
              requests.map((req) => {
                const reporter = usersMap[req.createdBy] || {};
                const ut = unitsMap[req.unitId] || {};
                return (
                  <div
                    key={req.$id}
                    className="p-5 rounded-xl border border-border bg-card flex flex-col md:flex-row justify-between gap-6 hover:shadow-sm transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-foreground leading-snug">{req.title}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          req.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-200' : (req.priority === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-muted text-muted-foreground')
                        }`}>
                          {req.priority === 'high' ? 'Acil' : (req.priority === 'medium' ? 'Orta' : 'Düşük')}
                        </span>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">
                          {req.category}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                        {req.description}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-primary" />
                          Bildiren: <strong>{reporter.fullName || 'Sakin'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Tarih: {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        <span>Blok {ut.blockId?.split('-').pop()} Daire {ut.number || '-'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-center shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-border gap-2.5">
                      <div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          req.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : (req.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100')
                        }`}>
                          {req.status === 'completed' ? 'Tamamlandı' : (req.status === 'in_progress' ? 'İşleme Alındı' : 'Bekliyor')}
                        </span>
                      </div>

                      {req.managerComment && (
                        <div className="bg-muted/40 p-2.5 rounded-lg border border-border max-w-xs text-xs">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Yorumunuz:
                          </p>
                          <p className="text-muted-foreground mt-0.5 leading-normal">{req.managerComment}</p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionModal(req)}
                        className="h-8 text-xs font-bold gap-1 mt-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Durum Güncelle
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Update Status Modal */}
        {selectedReq && (
          <Dialog open={!!selectedReq} onOpenChange={() => setSelectedReq(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Talep Durumunu Güncelle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateReq} className="space-y-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    İşlem Durumu
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e: any) => setUpdateStatus(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="waiting">Bekliyor</option>
                    <option value="in_progress">İşleme Alındı / Ekipler Gönderildi</option>
                    <option value="completed">Tamamlandı / Arıza Çözüldü</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Yönetici Yorumu / Bilgilendirme
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Sakinleri bilgilendirmek için yorum ekleyin (örn: elektrik teknisyeni Cuma günü müdahale edecek)."
                    value={managerComment}
                    onChange={(e) => setManagerComment(e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedReq(null)}
                  >
                    Vazgeç
                  </Button>
                  <Button type="submit" isLoading={actionLoading} className="gap-1">
                    <Check className="h-4.5 w-4.5" /> Kaydet
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
