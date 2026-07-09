'use client';

import * as React from 'react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function MemberFeesPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  
  const [loading, setLoading] = React.useState(true);
  const [fees, setFees] = React.useState<any[]>([]);
  const [apartment, setApartment] = React.useState<any>(null);
  const [unit, setUnit] = React.useState<any>(null);

  const loadData = React.useCallback(async () => {
    if (!user) return;
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
        const userUnit = unitRes.documents[0];
        setUnit(userUnit);
        const aptDoc = await databases.getDocument(DATABASE_ID, 'apartments', userUnit.apartmentId);
        setApartment(aptDoc);

        const feesRes = await databases.listDocuments(DATABASE_ID, 'fees', [
          Query.equal('userId', user.$id),
          Query.orderAsc('dueDate')
        ]);
        setFees(feesRes.documents);
      }
    } catch (e) {
      console.error(e);
      toast.show('Aidat verileri yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handlePayFee = async (feeId: string, feeTitle: string, amount: number) => {
    try {
      await databases.updateDocument(DATABASE_ID, 'fees', feeId, {
        status: 'reviewing',
        paidAt: new Date().toISOString()
      });

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

      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'fee_paid_simulation',
        details: `${user?.fullName} ${feeTitle} (${amount} TL) için ödeme başlattı.`,
        createdAt: new Date().toISOString()
      });

      toast.show('Ödeme bildirimi başarıyla iletildi.', 'success');
      loadData();
    } catch (e) {
      toast.show('Ödeme bildirimi gönderilemedi.', 'error');
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

  const totalUnpaid = fees.filter(f => f.status !== 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Aidat ve Borçlarım</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Ödemelerinizi görüntüleyin ve dekont / ödeme bildirimlerinizi iletin.
          </p>
        </div>

        {/* Financial Stat Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="bg-red-50/50 border-red-200 text-red-950">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-red-700 font-bold uppercase tracking-wider">Toplam Geciken/Bekleyen Borç</span>
                <h3 className="text-3xl font-black mt-1">{totalUnpaid.toLocaleString('tr-TR')} TL</h3>
                <span className="text-[10px] text-red-600 font-semibold block mt-1">Ödenmesi gereken faturalar</span>
              </div>
              <div className="bg-red-100 text-red-600 p-3 rounded-xl shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/50 border-emerald-200 text-emerald-950">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Bugüne Kadar Ödenen Toplam</span>
                <h3 className="text-3xl font-black mt-1">{totalPaid.toLocaleString('tr-TR')} TL</h3>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Başarıyla tahsil edilmiş aidatlar</span>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fees Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Tüm Borç Kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Aidat/Borç Adı</th>
                    <th className="p-4">Tutar</th>
                    <th className="p-4">Oluşturma/Son Ödeme</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 text-right">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground italic">
                        Tanımlı borç kaydınız bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    fees.map((fee) => (
                      <tr key={fee.$id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-foreground">{fee.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Daire {unit?.number}</p>
                        </td>
                        <td className="p-4 text-foreground font-semibold">{fee.amount} TL</td>
                        <td className="p-4">
                          <span className="text-muted-foreground block text-xs">
                            Son Tarih: {new Date(fee.dueDate).toLocaleDateString('tr-TR')}
                          </span>
                        </td>
                        <td className="p-4">
                          {fee.status === 'paid' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Ödendi
                            </span>
                          )}
                          {fee.status === 'reviewing' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              İncelemede
                            </span>
                          )}
                          {fee.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              Ödeme Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {fee.status === 'pending' ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayFee(fee.$id, fee.title, fee.amount)}
                              className="h-8 text-xs font-bold"
                            >
                              Ödeme Bildir
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
      </div>
    </DashboardLayout>
  );
}
