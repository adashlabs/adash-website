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
import { CreditCard, PlusCircle, Check, Loader2, AlertCircle, Trash2 } from 'lucide-react';

export default function ManagerFeesPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [fees, setFees] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  const [usersList, setUsersList] = React.useState<Record<string, any>>({});

  // Form states
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [feeTitle, setFeeTitle] = React.useState('');
  const [feeAmount, setFeeAmount] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [billingTarget, setBillingTarget] = React.useState<'all' | 'single'>('all');
  const [selectedUnitId, setSelectedUnitId] = React.useState('');

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

        const unitsRes = await databases.listDocuments(DATABASE_ID, 'units', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100)
        ]);
        setUnits(unitsRes.documents);

        const feesRes = await databases.listDocuments(DATABASE_ID, 'fees', [
          Query.equal('apartmentId', apt.$id),
          Query.orderDesc('dueDate'),
          Query.limit(100)
        ]);
        setFees(feesRes.documents);

        const usersRes = await databases.listDocuments(DATABASE_ID, 'users', [
          Query.limit(100)
        ]);
        const uMap: Record<string, any> = {};
        usersRes.documents.forEach((usr: any) => {
          uMap[usr.$id] = usr;
        });
        setUsersList(uMap);
      }
    } catch (e) {
      console.error(e);
      toast.show('Aidat verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Bulk or single billing submit
  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeTitle.trim() || !feeAmount || !dueDate) {
      toast.show('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const amount = parseFloat(feeAmount);
      const isBulk = billingTarget === 'all';

      // Determine target units (must have assigned resident/owner)
      const targetUnits = isBulk 
        ? units.filter(u => u.status === 'occupied' && u.ownerId) 
        : units.filter(u => u.$id === selectedUnitId && u.ownerId);

      if (targetUnits.length === 0) {
        toast.show('Faturalandırılacak sakin atanmış daire bulunamadı.', 'error');
        setSubmitLoading(false);
        return;
      }

      // Loop and create fee documents
      for (const ut of targetUnits) {
        const userId = ut.tenantId || ut.ownerId; // Bill the tenant if exists, otherwise owner
        await databases.createDocument(DATABASE_ID, 'fees', 'unique()', {
          apartmentId: apartment.$id,
          unitId: ut.$id,
          userId: userId,
          title: feeTitle,
          amount: amount,
          dueDate: new Date(dueDate).toISOString(),
          status: 'pending'
        });

        // Create notification for the user
        await databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
          userId: userId,
          title: 'Yeni Aidat Borcu',
          message: `${feeTitle} yayınlandı. Tutar: ${amount} TL. Son ödeme tarihi: ${new Date(dueDate).toLocaleDateString('tr-TR')}`,
          isRead: false,
          type: 'fee',
          createdAt: new Date().toISOString()
        });
      }

      // Log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'fee_bulk_created',
        details: `${feeTitle} (${amount} TL) ${targetUnits.length} daire için tahakkuk ettirildi.`,
        createdAt: new Date().toISOString()
      });

      toast.show(`${targetUnits.length} daire için aidat başarıyla oluşturuldu.`, 'success');
      setFeeTitle('');
      setFeeAmount('');
      setDueDate('');
      setShowAddForm(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.show('Aidat oluşturulurken hata meydana geldi.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Confirm payment
  const handleApproveFee = async (feeId: string, title: string, amount: number, userId: string) => {
    try {
      await databases.updateDocument(DATABASE_ID, 'fees', feeId, {
        status: 'paid'
      });

      await databases.createDocument(DATABASE_ID, 'incomes', 'unique()', {
        apartmentId: apartment.$id,
        category: 'Aidat Geliri',
        title: `${title} Tahsilatı`,
        amount: amount,
        description: `${title} tahsilatı yönetici tarafından onaylandı.`,
        date: new Date().toISOString()
      });

      await databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
        userId: userId,
        title: 'Ödemeniz Onaylandı',
        message: `${title} için yaptığınız ${amount} TL tutarındaki ödeme onaylandı. Teşekkür ederiz.`,
        isRead: false,
        type: 'fee',
        createdAt: new Date().toISOString()
      });

      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'fee_approved',
        details: `${title} ödemesi onaylandı (${amount} TL)`,
        createdAt: new Date().toISOString()
      });

      toast.show('Ödeme başarıyla onaylandı.', 'success');
      loadData();
    } catch (e) {
      toast.show('Onaylama işlemi gerçekleştirilemedi.', 'error');
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

  const reviewingFees = fees.filter(f => f.status === 'reviewing');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Aidat ve Borç Takipleri</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Dairelere aidat borçlandırması atayın ve ödeme bildirimlerini kontrol edin.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 shrink-0 font-bold shadow-sm">
            <PlusCircle className="h-4.5 w-4.5" />
            {showAddForm ? 'Vazgeç' : 'Yeni Aidat Tanımla'}
          </Button>
        </div>

        {/* Unapproved Reviewing List */}
        {reviewingFees.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/20">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center gap-2 text-sm uppercase tracking-wider font-bold">
                <AlertCircle className="h-5 w-5 text-amber-500" /> Onay Bekleyen Ödeme Bildirimleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewingFees.map((fee) => {
                const uDoc = usersList[fee.userId] || {};
                const ut = units.find(u => u.$id === fee.unitId) || {};
                return (
                  <div key={fee.$id} className="p-4 rounded-xl border border-amber-200 bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Blok {ut.blockId?.split('-').pop()} Daire {ut.number} • {uDoc.fullName || 'Sakin'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Borç: <strong>{fee.title}</strong> • Tutar: <strong>{fee.amount} TL</strong>
                      </p>
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        Bildirim Tarihi: {fee.paidAt ? new Date(fee.paidAt).toLocaleString('tr-TR') : 'Bilinmiyor'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApproveFee(fee.$id, fee.title, fee.amount, fee.userId)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <Check className="h-4 w-4" /> Ödemeyi Onayla
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Add Fee Form */}
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/[0.01] animate-in slide-in-from-top duration-300">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <PlusCircle className="h-5 w-5" /> Yeni Aidat Borçlandırması Tahakkuku
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFee} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Borçlandırma Başlığı"
                    type="text"
                    placeholder="Örn: Temmuz 2026 Aidatı"
                    value={feeTitle}
                    onChange={(e) => setFeeTitle(e.target.value)}
                    required
                  />
                  <Input
                    label="Tutar (TL)"
                    type="number"
                    min={1}
                    placeholder="500"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Son Ödeme Tarihi"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Hedef Daireler
                    </label>
                    <select
                      value={billingTarget}
                      onChange={(e: any) => setBillingTarget(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="all">Tüm Dolu Daireler</option>
                      <option value="single">Tek Bir Daire</option>
                    </select>
                  </div>
                </div>

                {billingTarget === 'single' && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Daire Seçin
                    </label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Seçiniz...</option>
                      {units.filter(u => u.status === 'occupied').map((u) => (
                        <option key={u.$id} value={u.$id}>
                          Blok {u.blockId.split('-').pop()} - Daire {u.number} ({usersList[u.tenantId || u.ownerId]?.fullName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button type="submit" isLoading={submitLoading}>
                  Borçlandırma Oluştur
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Ledger Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Genel Aidat Defteri</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Daire</th>
                    <th className="p-4">Sakin</th>
                    <th className="p-4">Dönem / Açıklama</th>
                    <th className="p-4">Tutar</th>
                    <th className="p-4">Son Tarih</th>
                    <th className="p-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground italic">
                        Oluşturulmuş borç kaydı bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    fees.map((fee) => {
                      const uDoc = usersList[fee.userId] || {};
                      const ut = units.find(u => u.$id === fee.unitId) || {};
                      return (
                        <tr key={fee.$id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-bold text-foreground">
                            Blok {ut.blockId?.split('-').pop()} Daire {ut.number || '-'}
                          </td>
                          <td className="p-4 text-foreground">{uDoc.fullName || 'Sakin'}</td>
                          <td className="p-4 text-muted-foreground">{fee.title}</td>
                          <td className="p-4 font-bold text-foreground">{fee.amount} TL</td>
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
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                                İnceleniyor
                              </span>
                            )}
                            {fee.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                Beklemede
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
