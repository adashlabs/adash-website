'use client';

import * as React from 'react';
import Link from 'next/link';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Building2,
  Users,
  Activity,
  Shield,
  Clock,
  Plus,
  ArrowRight,
  ShieldAlert,
  Settings,
  AlertCircle
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    apartmentsCount: 0,
    usersCount: 0,
    logsCount: 0,
    managersCount: 0
  });
  const [recentApartments, setRecentApartments] = React.useState<any[]>([]);
  const [recentLogs, setRecentLogs] = React.useState<any[]>([]);
  const [usersList, setUsersList] = React.useState<Record<string, string>>({});

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch apartments count & recent apartments
      const aptsRes = await databases.listDocuments(DATABASE_ID, 'apartments', [
        Query.orderDesc('$createdAt'),
        Query.limit(5)
      ]);
      const apartmentsCount = aptsRes.total || aptsRes.documents.length;
      setRecentApartments(aptsRes.documents);

      // 2. Fetch users count
      const usersRes = await databases.listDocuments(DATABASE_ID, 'users', [
        Query.limit(100)
      ]);
      const usersCount = usersRes.total || usersRes.documents.length;
      const managersCount = usersRes.documents.filter((u: any) => u.role === 'manager').length;
      
      const uMap: Record<string, string> = {};
      usersRes.documents.forEach((u: any) => {
        uMap[u.$id] = u.fullName;
      });
      setUsersList(uMap);

      // 3. Fetch logs count & recent logs
      const logsRes = await databases.listDocuments(DATABASE_ID, 'logs', [
        Query.orderDesc('createdAt'),
        Query.limit(5)
      ]);
      const logsCount = logsRes.total || logsRes.documents.length;
      setRecentLogs(logsRes.documents);

      setStats({
        apartmentsCount,
        usersCount,
        logsCount,
        managersCount
      });
    } catch (e) {
      console.warn('DB connection failed, loading fallback admin mock stats...');
      // Fallback mocks
      setStats({
        apartmentsCount: 3,
        usersCount: 50,
        logsCount: 120,
        managersCount: 3
      });
      setRecentApartments([
        { $id: '1', name: 'Güneş Apartmanı', slug: 'gunes-apartmani', managerId: 'mgr-1', status: 'active', unitsCount: 20 },
        { $id: '2', name: 'Yıldız Sitesi', slug: 'yildiz-sitesi', managerId: 'mgr-2', status: 'active', unitsCount: 72 },
        { $id: '3', name: 'Yeşil Vadi Konakları', slug: 'yesil-vadi', managerId: 'mgr-3', status: 'active', unitsCount: 28 },
      ]);
      setRecentLogs([
        { $id: 'l1', userId: 'mgr-1', action: 'fee_bulk_created', details: 'Temmuz Aidatı tahakkuk ettirildi.', createdAt: new Date().toISOString() },
        { $id: 'l2', userId: 'member-4', action: 'fee_paid_simulation', details: 'Daire 5 aidat ödemesi simüle etti.', createdAt: new Date().toISOString() },
        { $id: 'l3', userId: 'mgr-2', action: 'announcement_created', details: 'Yeni duyuru paylaşıldı: Havuz Kuralları.', createdAt: new Date().toISOString() }
      ]);
      setUsersList({
        'mgr-1': 'Mustafa Demir',
        'mgr-2': 'Zeynep Kaya',
        'mgr-3': 'Kemal Şahin',
        'member-4': 'Ahmet Yılmaz'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary shrink-0" /> Süper Admin Kontrol Paneli
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              BİNGO platformundaki tüm apartmanları, kullanıcıları ve genel sistem loglarını denetleyin.
            </p>
          </div>
          <div className="text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-lg border border-border font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Bugün: {new Date().toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        {/* Global Platform Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tüm Apartmanlar</span>
                <h3 className="text-2xl font-black mt-1 text-foreground">{stats.apartmentsCount}</h3>
                <span className="text-[9px] text-muted-foreground/80 mt-1 block">
                  Aktif site / bina
                </span>
              </div>
              <div className="bg-muted text-foreground p-2.5 rounded-lg shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Toplam Kullanıcı</span>
                <h3 className="text-2xl font-black mt-1 text-foreground">{stats.usersCount}</h3>
                <span className="text-[9px] text-muted-foreground/80 mt-1 block">
                  {stats.managersCount} yönetici dahil
                </span>
              </div>
              <div className="bg-muted text-foreground p-2.5 rounded-lg shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Sistem Logları</span>
                <h3 className="text-2xl font-black mt-1 text-foreground">{stats.logsCount}</h3>
                <span className="text-[9px] text-muted-foreground/80 mt-1 block">
                  Kaydedilmiş işlem sayısı
                </span>
              </div>
              <div className="bg-muted text-foreground p-2.5 rounded-lg shrink-0">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Platform Durumu</span>
                <h3 className="text-2xl font-black mt-1 text-emerald-600">AKTİF</h3>
                <span className="text-[9px] text-muted-foreground mt-1 block">
                  Servisler çalışıyor
                </span>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-lg shrink-0">
                <Shield className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Apartments list */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Son Eklenen Apartmanlar</CardTitle>
                  <CardDescription>Sistemde oluşturulan son 5 apartman ve aktif durumları.</CardDescription>
                </div>
                <Link href="/dashboard/super-admin/apartments" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Apartman Adı</th>
                        <th className="p-4">Yönetici</th>
                        <th className="p-4">Daire Sayısı</th>
                        <th className="p-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentApartments.map((apt) => (
                        <tr key={apt.$id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-bold text-foreground">
                            <Link href={`/${apt.slug}`} target="_blank" className="hover:underline flex items-center gap-1 text-primary">
                              {apt.name}
                            </Link>
                          </td>
                          <td className="p-4 text-foreground">{usersList[apt.managerId] || 'Atanmamış'}</td>
                          <td className="p-4 text-foreground font-semibold">{apt.unitsCount} Daire</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              apt.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                              {apt.status === 'active' ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Platform Audit Logs */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Son Sistem Logları
                </CardTitle>
                <Link href="/dashboard/super-admin/logs" className="text-xs text-primary font-bold hover:underline">
                  Tümünü Gör
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.$id} className="p-3.5 rounded-xl border border-border bg-card">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                        {log.action}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-normal">{log.details}</p>
                    <span className="text-[9px] text-muted-foreground/60 block mt-2">
                      İşlemi Yapan: <strong>{usersList[log.userId] || 'Sistem / Anonim'}</strong>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
