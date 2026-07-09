'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { databases, DATABASE_ID } from '@/lib/appwrite';

import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  TrendingUp,
  Plus,
  Activity,
  ArrowRight,
  TrendingDown,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export default function ManagerDashboard() {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  // States
  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [stats, setStats] = React.useState({
    totalUnits: 0,
    totalResidents: 0,
    pendingFees: 0,
    pendingRequests: 0,
    monthlyIncome: 0,
    monthlyExpense: 0
  });
  const [recentFees, setRecentFees] = React.useState<any[]>([]);
  const [recentRequests, setRecentRequests] = React.useState<any[]>([]);
  
  // Setup Apartment form state
  const [showSetupForm, setShowSetupForm] = React.useState(false);
  const [setupLoading, setSetupLoading] = React.useState(false);
  const [aptName, setAptName] = React.useState('');
  const [aptSlug, setAptSlug] = React.useState('');
  const [aptAddress, setAptAddress] = React.useState('');
  const [blocksCount, setBlocksCount] = React.useState(1);
  const [floorsCount, setFloorsCount] = React.useState(5);
  const [unitsPerFloor, setUnitsPerFloor] = React.useState(4);

  const loadDashboardData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch apartment managed by this user
      const aptRes = await databases.listDocuments(DATABASE_ID, 'apartments', [
        Query.equal('managerId', user.$id),
        Query.limit(1)
      ]);

      if (aptRes.documents.length > 0) {
        const apt = aptRes.documents[0];
        setApartment(apt);

        // 2. Fetch units count
        const unitsRes = await databases.listDocuments(DATABASE_ID, 'units', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100) // Appwrite max default limit
        ]);
        const totalUnits = unitsRes.total || unitsRes.documents.length;

        // 3. Count unique residents in units (tenantId or ownerId)
        const residentsSet = new Set<string>();
        unitsRes.documents.forEach((u: any) => {
          if (u.tenantId) residentsSet.add(u.tenantId);
          if (u.ownerId) residentsSet.add(u.ownerId);
        });
        const totalResidents = residentsSet.size;

        // 4. Fetch unpaid fees total amount
        const feesRes = await databases.listDocuments(DATABASE_ID, 'fees', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100)
        ]);
        const pendingFees = feesRes.documents
          .filter((f: any) => f.status !== 'paid')
          .reduce((acc: number, curr: any) => acc + curr.amount, 0);

        // Fetch recent fees (limit 5) for review list
        setRecentFees(feesRes.documents.filter((f: any) => f.status === 'reviewing').slice(0, 5));

        // 5. Fetch pending maintenance requests
        const requestsRes = await databases.listDocuments(DATABASE_ID, 'maintenance_requests', [
          Query.equal('apartmentId', apt.$id),
          Query.orderDesc('createdAt'),
          Query.limit(50)
        ]);
        const pendingRequests = requestsRes.documents.filter((r: any) => r.status !== 'completed').length;
        setRecentRequests(requestsRes.documents.filter((r: any) => r.status === 'waiting').slice(0, 5));

        // 6. Fetch monthly finance totals
        const incomesRes = await databases.listDocuments(DATABASE_ID, 'incomes', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100)
        ]);
        const monthlyIncome = incomesRes.documents.reduce((acc: number, curr: any) => acc + curr.amount, 0);

        const expensesRes = await databases.listDocuments(DATABASE_ID, 'expenses', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100)
        ]);
        const monthlyExpense = expensesRes.documents.reduce((acc: number, curr: any) => acc + curr.amount, 0);

        setStats({
          totalUnits,
          totalResidents,
          pendingFees,
          pendingRequests,
          monthlyIncome,
          monthlyExpense
        });
      } else {
        setApartment(null);
      }
    } catch (e) {
      console.error(e);
      toast.show('Dashboard verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Handler to create an apartment and generate units automatically
  const handleSetupApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!aptName.trim() || !aptSlug.trim() || !aptAddress.trim()) {
      toast.show('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }

    setSetupLoading(true);
    try {
      const aptId = 'apt-' + Math.random().toString(36).substring(2, 9);
      const unitsCount = blocksCount * floorsCount * unitsPerFloor;

      // 1. Create Apartment Document
      await databases.createDocument(DATABASE_ID, 'apartments', aptId, {
        name: aptName,
        slug: aptSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: 'Apartmanımız bulut sistemimiz BİNGO üzerinden yönetilmektedir.',
        address: aptAddress,
        managerId: user.$id,
        blocksCount,
        floorsCount,
        unitsCount,
        rules: ['Lütfen ortak alan kurallarına uyunuz.'],
        status: 'active'
      });

      // 2. Generate Blocks, Floors and Units in DB
      const blockLetters = ['A', 'B', 'C', 'D'];
      for (let b = 0; b < blocksCount; b++) {
        const blockLetter = blockLetters[b];
        const blockId = `block-${aptId}-${blockLetter}`;
        
        await databases.createDocument(DATABASE_ID, 'blocks', blockId, {
          apartmentId: aptId,
          name: `${blockLetter} Blok`
        });

        for (let f = 1; f <= floorsCount; f++) {
          const floorId = `floor-${aptId}-${blockLetter}-${f}`;
          
          await databases.createDocument(DATABASE_ID, 'floors', floorId, {
            apartmentId: aptId,
            blockId: blockId,
            number: f
          });

          for (let u = 1; u <= unitsPerFloor; u++) {
            const unitNum = (f - 1) * unitsPerFloor + u;
            const unitId = `unit-${aptId}-${blockLetter}-${f}-${unitNum}`;
            
            await databases.createDocument(DATABASE_ID, 'units', unitId, {
              apartmentId: aptId,
              blockId: blockId,
              floorId: floorId,
              number: unitNum.toString(),
              type: 'residential',
              status: 'empty'
            });
          }
        }
      }

      // Create log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user.$id,
        action: 'apartment_created',
        details: `${user.fullName} yeni apartman kurdu: ${aptName} (${unitsCount} Daire)`,
        createdAt: new Date().toISOString()
      });

      toast.show('Apartman ve daire yapısı başarıyla oluşturuldu!', 'success');
      loadDashboardData();
    } catch (e: any) {
      console.error(e);
      toast.show(e.message || 'Apartman oluşturulamadı.', 'error');
    } finally {
      setSetupLoading(false);
    }
  };

  // Quick Action to approve fee payment
  const handleApproveFee = async (feeId: string, feeTitle: string, amount: number, userId: string) => {
    try {
      // 1. Update fee document
      await databases.updateDocument(DATABASE_ID, 'fees', feeId, {
        status: 'paid'
      });

      // 2. Add to Incomes collection
      await databases.createDocument(DATABASE_ID, 'incomes', 'unique()', {
        apartmentId: apartment.$id,
        category: 'Aidat Geliri',
        title: `${feeTitle} Tahsilatı`,
        amount: amount,
        description: `${feeTitle} tahsilatı sistem tarafından onaylandı.`,
        date: new Date().toISOString()
      });

      // 3. Create Notification for the resident
      await databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
        userId: userId,
        title: 'Ödeme Onaylandı',
        message: `${feeTitle} için yaptığınız ${amount} TL ödeme bildirimi yönetici tarafından onaylandı.`,
        isRead: false,
        type: 'fee',
        createdAt: new Date().toISOString()
      });

      toast.show('Ödeme başarıyla onaylandı ve gelirlere eklendi.', 'success');
      loadDashboardData();
    } catch (e) {
      toast.show('Onay işlemi gerçekleştirilemedi.', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // Render Setup Apartment wizard if none exists
  if (!apartment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-8 bg-card rounded-2xl border border-border max-w-4xl mx-auto premium-shadow">
          <Building2 className="h-16 w-16 text-primary mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-foreground">Yeni Apartman / Site Kurulum Sihirbazı</h2>
          <p className="text-sm text-muted-foreground max-w-lg mt-2 mb-8 leading-relaxed">
            Hesabınız hazır ancak henüz yönettiğiniz bir apartman bulunmuyor. Bir apartman oluşturup blok ve daire sayısını girerek yönetim yapısını otomatik olarak kurabilirsiniz.
          </p>

          <form onSubmit={handleSetupApartment} className="w-full max-w-xl text-left space-y-4 border-t border-border pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Apartman / Site Adı"
                type="text"
                placeholder="Örn: Güneş Apartmanı"
                value={aptName}
                onChange={(e) => {
                  setAptName(e.target.value);
                  setAptSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }}
                required
              />
              <Input
                label="URL Slug (Benzersiz)"
                type="text"
                placeholder="gunes-apartmani"
                value={aptSlug}
                onChange={(e) => setAptSlug(e.target.value)}
                helperText="Ziyaretçiler: site.com/gunes-apartmani"
                required
              />
            </div>

            <Input
              label="Apartman Adresi"
              type="text"
              placeholder="Örn: Osmanağa Mah. Güneş Sokak No:12 Kadıköy, İstanbul"
              value={aptAddress}
              onChange={(e) => setAptAddress(e.target.value)}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Blok Sayısı"
                type="number"
                min={1}
                max={5}
                value={blocksCount}
                onChange={(e) => setBlocksCount(parseInt(e.target.value) || 1)}
                required
              />
              <Input
                label="Kat Sayısı (Blok Başı)"
                type="number"
                min={1}
                max={20}
                value={floorsCount}
                onChange={(e) => setFloorsCount(parseInt(e.target.value) || 1)}
                required
              />
              <Input
                label="Daire Sayısı (Kat Başı)"
                type="number"
                min={1}
                max={10}
                value={unitsPerFloor}
                onChange={(e) => setUnitsPerFloor(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="pt-4 flex justify-center">
              <Button type="submit" size="lg" className="w-full" isLoading={setupLoading}>
                Apartmanı & Daireleri Oluştur
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {apartment.name} Yönetim Paneli
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Güvenli, şeffaf ve yüksek verimli apartman yönetimi.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/dashboard/manager/fees">
              <Button size="sm" variant="outline" className="gap-1.5 font-bold">
                <Plus className="h-4 w-4" /> Aidat Ekle
              </Button>
            </Link>
            <Link href="/dashboard/manager/finance">
              <Button size="sm" variant="outline" className="gap-1.5 font-bold">
                <Plus className="h-4 w-4" /> Gelir / Gider Ekle
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider block truncate">Toplam Daire</span>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-foreground truncate">{stats.totalUnits}</h3>
                <span className="text-[8px] sm:text-[9px] text-muted-foreground/80 mt-1 block truncate">
                  {stats.totalResidents} aktif sakin
                </span>
              </div>
              <div className="bg-muted text-foreground p-2 sm:p-2.5 rounded-lg shrink-0">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider block truncate">Tahsil Edilmeyen</span>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-red-600 truncate">{stats.pendingFees.toLocaleString('tr-TR')} TL</h3>
                <span className="text-[8px] sm:text-[9px] text-red-500/80 mt-1 block truncate">
                  Bekleyen aidat
                </span>
              </div>
              <div className="bg-red-50 text-red-600 p-2 sm:p-2.5 rounded-lg shrink-0 border border-red-100">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider block truncate">Bekleyen Talepler</span>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-amber-600 truncate">{stats.pendingRequests} Arıza</h3>
                <span className="text-[8px] sm:text-[9px] text-amber-500/80 mt-1 block truncate">
                  Aksiyon bekleyen
                </span>
              </div>
              <div className="bg-amber-50 text-amber-600 p-2 sm:p-2.5 rounded-lg shrink-0 border border-amber-100">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-primary font-bold uppercase tracking-wider block truncate">Kasa Bakiyesi</span>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-foreground truncate">
                  {(stats.monthlyIncome - stats.monthlyExpense).toLocaleString('tr-TR')} TL
                </h3>
                <span className="text-[8px] sm:text-[9px] text-muted-foreground mt-1 block truncate">
                  Gelir: {stats.monthlyIncome.toLocaleString('tr-TR')} TL
                </span>
              </div>
              <div className="bg-primary/20 text-primary p-2 sm:p-2.5 rounded-lg shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Board (Middle section) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Unapproved Payments (Critical manager actions) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Onay Bekleyen Ödemeler
                </CardTitle>
                <CardDescription>
                  Sakinlerin gönderdiği ve doğrulanmayı bekleyen ödeme bildirimleri.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Daire</th>
                        <th className="p-4">Borç/Aidat Dönemi</th>
                        <th className="p-4">Tutar</th>
                        <th className="p-4">Tarih</th>
                        <th className="p-4 text-right">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentFees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground italic">
                            Onay bekleyen herhangi bir ödeme bildirimi bulunmuyor.
                          </td>
                        </tr>
                      ) : (
                        recentFees.map((fee) => (
                          <tr key={fee.$id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-4 font-bold text-foreground">
                              Daire {fee.unitId?.number || 'Belirsiz'}
                            </td>
                            <td className="p-4 text-foreground">{fee.title}</td>
                            <td className="p-4 font-bold text-foreground">{fee.amount} TL</td>
                            <td className="p-4 text-muted-foreground">
                              {fee.paidAt ? new Date(fee.paidAt).toLocaleDateString('tr-TR') : '-'}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                size="sm"
                                onClick={() => handleApproveFee(fee.$id, fee.title, fee.amount, fee.userId)}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Ödemeyi Onayla
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Income Expense Chart */}
            <Card className="p-5">
              <h4 className="text-sm font-bold text-foreground mb-4">Kasaya Ait Mali Durum</h4>
              <div className="h-48 w-full flex items-end justify-between pt-4 relative">
                <div className="absolute inset-x-0 top-0 border-b border-border text-[10px] text-muted-foreground pb-1">En Yüksek</div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-border text-[10px] text-muted-foreground pb-1">Orta Seviye</div>
                
                <div className="flex flex-col items-center gap-1.5 flex-1 z-10">
                  <div className="h-32 flex items-end gap-1">
                    <motion.div initial={{ height: 0 }} animate={{ height: '80%' }} className="w-6 bg-primary rounded-t" />
                    <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} className="w-6 bg-red-400 rounded-t" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Genel Rapor</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Pending maintenance requests */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" /> Acil Arıza Talepleri
                </CardTitle>
                <Link href="/dashboard/manager/requests" className="text-xs text-primary font-bold hover:underline">
                  Tümünü Gör
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Aksiyon bekleyen arıza kaydı bulunmuyor.
                  </p>
                ) : (
                  recentRequests.map((req) => (
                    <div key={req.$id} className="p-3.5 rounded-xl border border-border bg-card relative">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-xs leading-snug">{req.title}</h4>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          req.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {req.priority === 'high' ? 'Acil' : 'Orta'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border/80 text-[10px] text-muted-foreground">
                        <span>Kategori: <strong>{req.category}</strong></span>
                        <Link href="/dashboard/manager/requests" className="font-bold text-primary hover:underline">
                          Cevapla
                        </Link>
                      </div>
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
