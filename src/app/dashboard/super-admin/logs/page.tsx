'use client';

import * as React from 'react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Activity, Clock, User, ClipboardList, ShieldAlert, Loader2 } from 'lucide-react';

export default function SuperAdminLogsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [usersMap, setUsersMap] = React.useState<Record<string, string>>({});

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch system logs
      const logsRes = await databases.listDocuments(DATABASE_ID, 'logs', [
        Query.orderDesc('createdAt'),
        Query.limit(100)
      ]);
      setLogs(logsRes.documents);

      // 2. Fetch users to map user names
      const usersRes = await databases.listDocuments(DATABASE_ID, 'users', [
        Query.limit(100)
      ]);
      const uMap: Record<string, string> = {};
      usersRes.documents.forEach((usr: any) => {
        uMap[usr.$id] = usr.fullName;
      });
      setUsersMap(uMap);
    } catch (e) {
      console.warn('DB connection failed, loading fallback mock audit logs list...');
      // Fallback
      setLogs([
        { $id: 'l1', userId: 'manager-1', action: 'fee_bulk_created', details: 'Temmuz Aidatı tahakkuk ettirildi. Tutar: 450 TL.', createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
        { $id: 'l2', userId: 'member-4', action: 'fee_paid_simulation', details: 'Ahmet Yılmaz Temmuz Aidatı (450 TL) için ödeme bildirdi.', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
        { $id: 'l3', userId: 'manager-2', action: 'announcement_created', details: 'Yeni duyuru yayınlandı: Yaz dönemi havuz saatleri.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { $id: 'l4', userId: 'super-admin', action: 'admin_apartment_created', details: 'Süper Admin yeni apartman kurdu: Yeşil Vadi Konakları.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
        { $id: 'l5', userId: 'member-8', action: 'request_created', details: 'Selin Yıldız yeni arıza kaydı açtı: A Blok Asansör gürültü yapıyor.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
      ]);
      setUsersMap({
        'super-admin': 'Ahmet Yılmaz (Süper Admin)',
        'manager-1': 'Mustafa Demir',
        'manager-2': 'Zeynep Kaya',
        'member-4': 'Ahmet Yılmaz',
        'member-8': 'Selin Yıldız'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

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
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary shrink-0" /> Sistem İşlem Logları
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Platform genelinde yapılan tüm veri ekleme, güncelleme, silme ve simülasyon adımlarını inceleyin.
          </p>
        </div>

        {/* Logs List Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Platform Denetim Günlüğü
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">İşlem Türü / Action</th>
                    <th className="p-4">Detaylı Açıklama</th>
                    <th className="p-4">Kullanıcı</th>
                    <th className="p-4">Tarih / Saat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-muted-foreground italic">
                        Denetim kaydı bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.$id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-wider">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-foreground leading-relaxed text-xs max-w-lg">
                          {log.details}
                        </td>
                        <td className="p-4 text-foreground font-semibold flex items-center gap-1.5 mt-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {usersMap[log.userId] || 'Sistem / Anonim'}
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(log.createdAt).toLocaleString('tr-TR')}
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
