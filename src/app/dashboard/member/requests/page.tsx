'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Wrench, Calendar, Loader2, AlertCircle, Plus, ClipboardList } from 'lucide-react';

const requestSchema = z.object({
  title: z.string().min(5, 'Başlık en az 5 karakter olmalıdır.'),
  category: z.string().min(1, 'Lütfen bir kategori seçin.'),
  priority: z.enum(['low', 'medium', 'high']),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır.'),
});

type RequestValues = z.infer<typeof requestSchema>;

const categories = [
  { value: 'elevator', label: 'Asansör Bozuk' },
  { value: 'door', label: 'Kapı Çalışmıyor' },
  { value: 'lights', label: 'Otopark / Ortak Alan Işıkları' },
  { value: 'cleaning', label: 'Temizlik Talebi' },
  { value: 'noise', label: 'Gürültü Şikayeti' },
  { value: 'plumbing', label: 'Su Kaçağı / Tesisat' },
  { value: 'electrical', label: 'Elektrik Arızası' },
  { value: 'other', label: 'Diğer Konular' }
];

export default function MemberRequestsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [requests, setRequests] = React.useState<any[]>([]);
  const [unit, setUnit] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      category: 'elevator',
      priority: 'medium',
    }
  });

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch unit
      const unitRes = await databases.listDocuments(DATABASE_ID, 'units', [
        Query.or([
          Query.equal('tenantId', user.$id),
          Query.equal('ownerId', user.$id)
        ]),
        Query.limit(1)
      ]);

      if (unitRes.documents.length > 0) {
        setUnit(unitRes.documents[0]);
      }

      // 2. Fetch requests
      const requestsRes = await databases.listDocuments(DATABASE_ID, 'maintenance_requests', [
        Query.equal('createdBy', user.$id),
        Query.orderDesc('createdAt')
      ]);
      setRequests(requestsRes.documents);
    } catch (e) {
      console.error(e);
      toast.show('Talepleriniz yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const onSubmit = async (data: RequestValues) => {
    if (!user || !unit) {
      toast.show('Talep oluşturmak için dairenizin tanımlı olması gerekir.', 'error');
      return;
    }
    setSubmitLoading(true);
    try {
      // Create request document
      const newReq = await databases.createDocument(DATABASE_ID, 'maintenance_requests', 'unique()', {
        apartmentId: unit.apartmentId,
        unitId: unit.$id,
        category: categories.find(c => c.value === data.category)?.label || data.category,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'waiting',
        createdBy: user.$id,
        createdAt: new Date().toISOString()
      });

      // Create notification for the manager
      const aptDoc = await databases.getDocument(DATABASE_ID, 'apartments', unit.apartmentId);
      if (aptDoc.managerId) {
        await databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
          userId: aptDoc.managerId,
          title: 'Yeni Arıza Talebi',
          message: `Daire ${unit.number} sakini ${user.fullName} yeni bir arıza kaydı açtı: ${data.title}`,
          isRead: false,
          type: 'maintenance',
          createdAt: new Date().toISOString()
        });
      }

      // Create log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user.$id,
        action: 'request_created',
        details: `${user.fullName} yeni arıza bildirdi: ${data.title}`,
        createdAt: new Date().toISOString()
      });

      toast.show('Talep başarıyla oluşturuldu ve yönetime iletildi.', 'success');
      reset();
      setShowForm(false);
      loadData();
    } catch (e: any) {
      console.error(e);
      toast.show('Talep gönderilirken hata oluştu.', 'error');
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Arıza ve Taleplerim</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Ortak alanlar ve dairenizle ilgili tüm arıza/istek bildirimlerini yönetin.
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0 font-bold shadow-sm">
            <Plus className="h-4.5 w-4.5" />
            {showForm ? 'Vazgeç' : 'Yeni Talep Bildir'}
          </Button>
        </div>

        {/* Submit Request Form */}
        {showForm && (
          <Card className="border-primary/20 bg-primary/[0.01] animate-in slide-in-from-top duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Wrench className="h-5 w-5" /> Arıza & İstek Bildir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Arıza Kategorisi
                    </label>
                    <select
                      {...register('category')}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {errors.category?.message && (
                      <span className="text-xs text-destructive font-medium">{errors.category.message}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Öncelik
                    </label>
                    <select
                      {...register('priority')}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek (Acil)</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    label="Talep / Arıza Başlığı"
                    type="text"
                    placeholder="Örn: 2. Kat otopark aydınlatması çalışmıyor"
                    error={errors.title?.message}
                    {...register('title')}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Detaylı Açıklama
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Sorunu veya talebinizi detaylı olarak açıklayın (örn. hangi blokta, ne zamandan beri çalışmıyor vb.)."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register('description')}
                  />
                  {errors.description?.message && (
                    <span className="text-xs text-destructive font-medium">{errors.description.message}</span>
                  )}
                </div>

                <Button type="submit" className="gap-2" isLoading={submitLoading}>
                  Gönder ve Bildir
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Bildirdiğiniz Talepler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic flex flex-col items-center">
                <Wrench className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm">Kayıtlı herhangi bir arıza bildiriminiz bulunmuyor.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.$id}
                  className="p-5 rounded-xl border border-border bg-card flex flex-col md:flex-row justify-between gap-6"
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

                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Açılış: {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                      <span>Daire {unit?.number}</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-border gap-2">
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
                      <div className="bg-muted/40 p-3 rounded-lg border border-border max-w-xs text-xs text-left">
                        <p className="font-bold text-foreground mb-0.5">Yönetici Yorumu:</p>
                        <p className="text-muted-foreground leading-normal">{req.managerComment}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
