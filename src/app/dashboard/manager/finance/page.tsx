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
import { TrendingUp, TrendingDown, PlusCircle, Calendar, ArrowRight, Loader2, DollarSign } from 'lucide-react';

export default function ManagerFinancePage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  
  // Transaction Lists
  const [incomes, setIncomes] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  
  // Tab states for transaction inputs
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [formType, setFormType] = React.useState<'income' | 'expense'>('income');
  const [submitLoading, setSubmitLoading] = React.useState(false);

  // Form Fields
  const [txCategory, setTxCategory] = React.useState('');
  const [txTitle, setTxTitle] = React.useState('');
  const [txAmount, setTxAmount] = React.useState('');
  const [txDescription, setTxDescription] = React.useState('');
  const [txDate, setTxDate] = React.useState(new Date().toISOString().split('T')[0]);

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

        // Fetch Incomes
        const incomesRes = await databases.listDocuments(DATABASE_ID, 'incomes', [
          Query.equal('apartmentId', apt.$id),
          Query.orderDesc('date'),
          Query.limit(100)
        ]);
        setIncomes(incomesRes.documents);

        // Fetch Expenses
        const expensesRes = await databases.listDocuments(DATABASE_ID, 'expenses', [
          Query.equal('apartmentId', apt.$id),
          Query.orderDesc('date'),
          Query.limit(100)
        ]);
        setExpenses(expensesRes.documents);
      }
    } catch (e) {
      console.error(e);
      toast.show('Finansal veriler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txCategory.trim() || !txTitle.trim() || !txAmount || !txDate) {
      toast.show('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const collectionId = formType === 'income' ? 'incomes' : 'expenses';
      const amount = parseFloat(txAmount);

      await databases.createDocument(DATABASE_ID, collectionId, 'unique()', {
        apartmentId: apartment.$id,
        category: txCategory,
        title: txTitle,
        amount: amount,
        description: txDescription,
        date: new Date(txDate).toISOString()
      });

      // Log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: formType === 'income' ? 'income_created' : 'expense_created',
        details: `${txTitle} kaydedildi (${amount} TL)`,
        createdAt: new Date().toISOString()
      });

      toast.show(`${formType === 'income' ? 'Gelir' : 'Gider'} kaydı başarıyla eklendi.`, 'success');
      setTxCategory('');
      setTxTitle('');
      setTxAmount('');
      setTxDescription('');
      setShowAddForm(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.show('İşlem kaydedilirken hata oluştu.', 'error');
    } finally {
      setSubmitLoading(false);
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

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  // Combine and sort recent transactions
  const combinedTransactions = [
    ...incomes.map(item => ({ ...item, txType: 'income' })),
    ...expenses.map(item => ({ ...item, txType: 'expense' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Gelir & Gider Yönetimi</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Apartman kasasının mali girdilerini ve çıktılarını takip edin.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 shrink-0 font-bold shadow-sm">
            <PlusCircle className="h-4.5 w-4.5" />
            {showAddForm ? 'Vazgeç' : 'Gelir / Gider Ekle'}
          </Button>
        </div>

        {/* Finance Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-emerald-50/50 border-emerald-200 text-emerald-950">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Toplam Gelir</span>
                <h3 className="text-3xl font-black mt-1">{totalIncome.toLocaleString('tr-TR')} TL</h3>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Tahsil edilen aidatlar ve diğer gelirler</span>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50/50 border-red-200 text-red-950">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-red-700 font-bold uppercase tracking-wider">Toplam Gider</span>
                <h3 className="text-3xl font-black mt-1">{totalExpense.toLocaleString('tr-TR')} TL</h3>
                <span className="text-[10px] text-red-600 font-semibold block mt-1">Elektrik, asansör bakımı, temizlik vb. faturalar</span>
              </div>
              <div className="bg-red-100 text-red-600 p-3 rounded-xl shrink-0">
                <TrendingDown className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className={balance >= 0 ? "bg-primary/5 border-primary/20 text-primary-foreground" : "bg-red-50/50 border-red-200"}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Kasa Bakiyesi</span>
                <h3 className="text-3xl font-black mt-1 text-foreground">{balance.toLocaleString('tr-TR')} TL</h3>
                <span className="text-[10px] text-muted-foreground font-semibold block mt-1">Mevcut nakit bakiye durumu</span>
              </div>
              <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/[0.01] animate-in slide-in-from-top duration-300">
            <CardHeader className="flex flex-row justify-between items-center border-b border-border/80 pb-3">
              <CardTitle className="text-primary flex items-center gap-2">
                <PlusCircle className="h-5 w-5" /> İşlem Ekle
              </CardTitle>
              <div className="bg-muted p-1 rounded-lg flex gap-1 border border-border">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
                    formType === 'income' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Gelir
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
                    formType === 'expense' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Gider
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateTransaction} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="İşlem Başlığı"
                    type="text"
                    placeholder={formType === 'income' ? 'Örn: Temmuz 2026 Aidatı' : 'Örn: Asansör Rutin Bakımı'}
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    required
                  />
                  <Input
                    label="Kategori"
                    type="text"
                    placeholder={formType === 'income' ? 'Örn: Aidat, Bağış' : 'Örn: Bakım, Personel, Elektrik'}
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Tutar (TL)"
                    type="number"
                    min={1}
                    placeholder="450"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                  />
                  <Input
                    label="İşlem Tarihi"
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    İşlem Açıklaması
                  </label>
                  <textarea
                    rows={3}
                    placeholder="İşleme ait açıklayıcı detaylar girin..."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                  />
                </div>

                <Button type="submit" isLoading={submitLoading}>
                  {formType === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Combined Transactions Ledger */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Cari Hareketler Defteri</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Tür</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Başlık / Açıklama</th>
                    <th className="p-4">Tutar</th>
                    <th className="p-4">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {combinedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground italic">
                        Kayıtlı finansal hareket bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    combinedTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          {tx.txType === 'income' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                              Gelir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">
                              Gider
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-foreground font-semibold">{tx.category}</td>
                        <td className="p-4">
                          <p className="font-bold text-foreground">{tx.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{tx.description || '-'}</p>
                        </td>
                        <td className={`p-4 font-extrabold ${tx.txType === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.txType === 'income' ? '+' : '-'}{tx.amount} TL
                        </td>
                        <td className="p-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(tx.date).toLocaleDateString('tr-TR')}
                          </span>
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
