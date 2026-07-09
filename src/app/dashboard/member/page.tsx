'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CreditCard,
  Wrench,
  Bell,
  FileText,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Loader2,
  User
} from 'lucide-react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function MemberDashboard() {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  // States
  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [unit, setUnit] = React.useState<any>(null);
  const [fees, setFees] = React.useState<any[]>([]);
  const [requests, setRequests] = React.useState<any[]>([]);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Find resident's unit
      const unitRes = await databases.listDocuments(DATABASE_ID, 'units', [
        Query.or([
          Query.equal('tenantId', user.$id),
          Query.equal('ownerId', user.$id)
        ]),
        Query.limit(1)
      ]);

      if (unitRes.documents.length > 0) {
        const userUnit = unitRes.documents[0];
        setUnit(userUnit);
        const aptId = userUnit.apartmentId;

        // 2. Fetch Apartment info
        const aptDoc = await databases.getDocument(DATABASE_ID, 'apartments', aptId);
        setApartment(aptDoc);

        // 3. Fetch Fees for this user
        const feesRes = await databases.listDocuments(DATABASE_ID, 'fees', [
          Query.equal('userId', user.$id),
          Query.orderAsc('dueDate'),
          Query.limit(10)
        ]);
        setFees(feesRes.documents);

        // 4. Fetch Requests created by this user
        const requestsRes = await databases.listDocuments(DATABASE_ID, 'maintenance_requests', [
          Query.equal('createdBy', user.$id),
          Query.orderDesc('createdAt'),
          Query.limit(5)
        ]);
        setRequests(requestsRes.documents);

        // 5. Fetch Announcements for this apartment
        const announcementsRes = await databases.listDocuments(DATABASE_ID, 'announcements', [
          Query.equal('apartmentId', aptId),
          Query.orderDesc('createdAt'),
          Query.limit(5)
        ]);
        setAnnouncements(announcementsRes.documents);
      } else {
        // Resident has no assigned unit
        setApartment(null);
      }
    } catch (e) {
      console.error(e);
      toast.show('Veriler yüklenirken bir sorun oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Payment simulation handler
  const handlePayFee = async (feeId: string, feeTitle: string, amount: number) => {
    try {
      // 1. Update fee status in DB to "reviewing"
      await databases.updateDocument(DATABASE_ID, 'fees', feeId, {
        status: 'reviewing',
        paidAt: new Date().toISOString()
      });

      // 2. Create Notification for the manager (find manager ID from apartment)
      if (apartment && apartment.managerId) {
        await databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
          userId: apartment.managerId,
          title: 'Aidat Ödeme Bildirimi',
          message: `Daire ${unit ? unit.number : ''} sakini ${user?.fullName}, ${feeTitle} için ${amount} TL tutarında ödeme bildirdi.`,
          isRead: false,
          type: 'fee',
          createdAt: new Date().toISOString()
        });
      }

      // 3. Create System Log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'fee_paid_simulation',
        details: `${user?.fullName} ${feeTitle} (${amount} TL) için simüle ödeme başlattı.`,
        createdAt: new Date().toISOString()
      });

      toast.show('Ödeme bildirimi gönderildi. Yönetici onayı bekleniyor.', 'success');
      // Refresh local data
      loadData();
    } catch (e: any) {
      toast.show('Ödeme bildirimi gönderilemedi.', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Skeleton Loaders */}
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-muted animate-pulse rounded-xl" />
            <div className="h-80 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If resident is not assigned to any unit/apartment
  if (!apartment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card rounded-2xl border border-border">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">Henüz Bir Daireye Atanmadınız</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
            Hesabınız aktif ancak yönetici tarafından henüz bir daireye atanmadınız. Lütfen yöneticinizle iletişime geçin.
          </p>
          <div className="text-xs text-muted-foreground bg-muted p-4 rounded-xl max-w-sm text-left">
            <strong>Ad Soyad:</strong> {user?.fullName}<br />
            <strong>E-posta:</strong> {user?.email}<br />
            <strong>Telefon:</strong> {user?.phone}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const unpaidFees = fees.filter(f => f.status !== 'paid');
  const activeRequests = requests.filter(r => r.status !== 'completed');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Merhaba, {user?.fullName.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              {apartment.name} • Blok {unit.blockId.split('-').pop()} • Daire {unit.number}
            </p>
          </div>
          <div className="text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-lg border border-border font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Bugün: {new Date().toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-wider">Bekleyen Borç</span>
                <h3 className="text-2xl font-black mt-1 text-foreground">
                  {unpaidFees.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('tr-TR')} TL
                </h3>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {unpaidFees.length} adet ödenmemiş aidat
                </span>
              </div>
              <div className="bg-primary/20 text-primary p-3 rounded-xl">
                <CreditCard className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Aktif Talepler</span>
                <h3 className="text-2xl font-black mt-1 text-foreground">{activeRequests.length} Talep</h3>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  İşlem bekleyen arıza bildirimleriniz
                </span>
              </div>
              <div className="bg-muted text-foreground p-3 rounded-xl">
                <Wrench className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Duyurular</span>
                <h3 className="text-2xl font-black mt-1 text-foreground">{announcements.length} Yeni</h3>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Yönetim tarafından paylaşılan duyurular
                </span>
              </div>
              <div className="bg-muted text-foreground p-3 rounded-xl">
                <Bell className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial & Requests Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Unpaid Aidats / Fees */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Borçlarım ve Ödemelerim
                </CardTitle>
                <Link href="/dashboard/member/fees" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Dönem/Başlık</th>
                        <th className="p-4">Tutar</th>
                        <th className="p-4">Son Ödeme</th>
                        <th className="p-4">Durum</th>
                        <th className="p-4 text-right">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground italic">
                            Tanımlı aidat veya borç bulunmamaktadır.
                          </td>
                        </tr>
                      ) : (
                        fees.map((fee) => (
                          <tr key={fee.$id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-4 font-semibold text-foreground">{fee.title}</td>
                            <td className="p-4 text-foreground font-semibold">{fee.amount} TL</td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(fee.dueDate).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="p-4">
                              {fee.status === 'paid' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Ödendi
                                </span>
                              )}
                              {fee.status === 'reviewing' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  İnceleniyor
                                </span>
                              )}
                              {fee.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                  Bekliyor
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {fee.status === 'pending' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayFee(fee.$id, fee.title, fee.amount)}
                                  className="h-8 text-xs bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-sm"
                                >
                                  Öde (Simüle)
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Active Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" /> Son Arıza Bildirimlerim
                </CardTitle>
                <Link href="/dashboard/member/requests" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  Yeni Talep Aç <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {requests.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Henüz bir arıza bildiriminiz bulunmuyor.
                  </p>
                ) : (
                  requests.map((req) => (
                    <div key={req.$id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{req.title}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            req.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-200' : (req.priority === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-muted text-muted-foreground')
                          }`}>
                            {req.priority === 'high' ? 'Acil' : (req.priority === 'medium' ? 'Orta' : 'Düşük')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-normal">
                          {req.description}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 block mt-2">
                          Kategori: <strong>{req.category}</strong> • Tarih: {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          req.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : (req.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')
                        }`}>
                          {req.status === 'completed' ? 'Tamamlandı' : (req.status === 'in_progress' ? 'İşleme Alındı' : 'Bekliyor')}
                        </span>
                        {req.managerComment && (
                          <span className="text-[10px] text-muted-foreground italic mt-1 block max-w-xs truncate">
                            <strong>Yorum:</strong> {req.managerComment}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Announcements */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> Son Duyurular
                </CardTitle>
                <Link href="/dashboard/member/announcements" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Apartman duyurusu bulunmamaktadır.
                  </p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.$id} className="p-4 rounded-xl border border-border bg-muted/10 relative">
                      {ann.isPinned && (
                        <span className="absolute top-4 right-4 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                          İğnelenmiş
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-foreground mb-1 leading-snug">{ann.title}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-normal">
                        {ann.content}
                      </p>
                      <span className="text-[9px] text-muted-foreground/60 flex items-center gap-1 mt-2.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
