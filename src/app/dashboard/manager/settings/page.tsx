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
import { Settings, Save, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react';

export default function ManagerSettingsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  // Form inputs
  const [description, setDescription] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [rules, setRules] = React.useState<string[]>([]);
  const [newRule, setNewRule] = React.useState('');

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
        setDescription(apt.description || '');
        setAddress(apt.address || '');
        setRules(apt.rules || []);
      }
    } catch (e) {
      console.error(e);
      toast.show('Ayarlar yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Add rule to list
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    if (rules.includes(newRule.trim())) {
      toast.show('Bu kural zaten ekli.', 'info');
      return;
    }
    setRules(prev => [...prev, newRule.trim()]);
    setNewRule('');
  };

  // Remove rule from list
  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save all settings to DB
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartment) return;

    setSubmitLoading(true);
    try {
      await databases.updateDocument(DATABASE_ID, 'apartments', apartment.$id, {
        description,
        address,
        rules
      });

      // Create log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'apartment_settings_updated',
        details: `${apartment.name} genel ayarları ve kuralları güncellendi.`,
        createdAt: new Date().toISOString()
      });

      toast.show('Apartman bilgileri başarıyla güncellendi.', 'success');
      loadData();
    } catch (e) {
      console.error(e);
      toast.show('Ayarlar kaydedilemedi.', 'error');
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Apartman Ayarları</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Apartmanın genel açıklamasını, adresini ve sakini kurallarını düzenleyin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          
          {/* General Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Genel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Apartman Adı (Değiştirilemez)"
                    type="text"
                    value={apartment.name}
                    disabled
                    helperText="Apartman adı genel güvenlik nedeniyle değiştirilemez."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Apartman Tanıtımı / Açıklaması
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Kamu sayfasında ve sakin panelinde görünecek açıklama yazısı..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Açık Adres"
                    type="text"
                    placeholder="Osmanağa Mah. Güneş Sokak No:12 Kadıköy, İstanbul"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="gap-2" isLoading={submitLoading}>
                  <Save className="h-4.5 w-4.5" /> Ayarları Kaydet
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Rules Editor Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" /> Kurallar Kılavuzu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add rule input */}
              <form onSubmit={handleAddRule} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="Yeni Kural Ekle"
                    type="text"
                    placeholder="Örn: Saat 22:00'den sonra gürültü yapılmamalıdır."
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                  />
                </div>
                <Button type="submit" className="h-10 shrink-0 font-bold">
                  <Plus className="h-4.5 w-4.5" />
                </Button>
              </form>

              {/* Rules List */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Aktif Kurallar ({rules.length})
                </h4>
                {rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">Herhangi bir kural tanımlanmamıştır.</p>
                ) : (
                  rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border bg-muted/10 flex justify-between items-center gap-4 text-xs"
                    >
                      <span className="text-foreground leading-normal">{rule}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-muted-foreground hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer shrink-0 transition-colors"
                        title="Kuralı Kaldır"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
