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
import { Building2, PlusCircle, Trash2, ShieldAlert, Check, X, Shield, Loader2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

export default function SuperAdminApartmentsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartments, setApartments] = React.useState<any[]>([]);
  const [managers, setManagers] = React.useState<any[]>([]);
  
  // Create Apartment wizard states
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [blocksCount, setBlocksCount] = React.useState(1);
  const [floorsCount, setFloorsCount] = React.useState(5);
  const [unitsPerFloor, setUnitsPerFloor] = React.useState(4);
  const [selectedManagerId, setSelectedManagerId] = React.useState('');

  // Edit Manager modal states
  const [editingApt, setEditingApt] = React.useState<any | null>(null);
  const [newManagerId, setNewManagerId] = React.useState('');
  const [editManagerLoading, setEditManagerLoading] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Fetch apartments
      const aptsRes = await databases.listDocuments(DATABASE_ID, 'apartments', [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]);
      setApartments(aptsRes.documents);

      // Fetch users with manager role
      const mgrsRes = await databases.listDocuments(DATABASE_ID, 'users', [
        Query.equal('role', 'manager'),
        Query.limit(100)
      ]);
      setManagers(mgrsRes.documents);
    } catch (e) {
      console.warn('DB connection failed, loading fallback mock apartments list...');
      // Fallback
      setApartments([
        { $id: 'apt-gunes', name: 'Güneş Apartmanı', slug: 'gunes-apartmani', managerId: 'manager-1', status: 'active', unitsCount: 20 },
        { $id: 'apt-yildiz', name: 'Yıldız Sitesi', slug: 'yildiz-sitesi', managerId: 'manager-2', status: 'active', unitsCount: 72 },
        { $id: 'apt-yesilvadi', name: 'Yeşil Vadi Konakları', slug: 'yesil-vadi', managerId: 'manager-3', status: 'active', unitsCount: 28 },
      ]);
      setManagers([
        { $id: 'manager-1', fullName: 'Mustafa Demir' },
        { $id: 'manager-2', fullName: 'Zeynep Kaya' },
        { $id: 'manager-3', fullName: 'Kemal Şahin' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Create Apartment wizard
  const handleCreateApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !address.trim()) {
      toast.show('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const aptId = 'apt-' + Math.random().toString(36).substring(2, 9);
      const unitsCount = blocksCount * floorsCount * unitsPerFloor;

      await databases.createDocument(DATABASE_ID, 'apartments', aptId, {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: 'BİNGO üzerinden yönetilen apartman.',
        address,
        managerId: selectedManagerId || null,
        blocksCount,
        floorsCount,
        unitsCount,
        rules: ['Kurallara uyulması zorunludur.'],
        status: 'active'
      });

      // Generate child records (blocks, floors, units)
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

      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'admin_apartment_created',
        details: `Süper Admin yeni apartman oluşturdu: ${name}`,
        createdAt: new Date().toISOString()
      });

      toast.show('Apartman ve daire yapısı başarıyla oluşturuldu.', 'success');
      setName('');
      setSlug('');
      setAddress('');
      setSelectedManagerId('');
      setShowAddForm(false);
      loadData();
    } catch (err: any) {
      toast.show(err.message || 'Apartman oluşturulamadı.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete apartment
  const handleDeleteApartment = async (aptId: string, aptName: string) => {
    if (!confirm(`"${aptName}" apartmanını ve ona bağlı TÜM daireleri, aidatları, duyuruları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;
    try {
      await databases.deleteDocument(DATABASE_ID, 'apartments', aptId);
      
      // Log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'admin_apartment_deleted',
        details: `${aptName} platformdan tamamen silindi.`,
        createdAt: new Date().toISOString()
      });

      toast.show('Apartman başarıyla silindi.', 'success');
      loadData();
    } catch (e) {
      toast.show('Apartman silinemedi.', 'error');
    }
  };

  // Toggle status
  const handleToggleStatus = async (aptId: string, currentStatus: string, aptName: string) => {
    const nextStatus = currentStatus === 'active' ? 'passive' : 'active';
    try {
      await databases.updateDocument(DATABASE_ID, 'apartments', aptId, {
        status: nextStatus
      });

      toast.show(`Apartman başarıyla ${nextStatus === 'active' ? 'aktifleştirildi' : 'pasifleştirildi'}.`, 'success');
      loadData();
    } catch (e) {
      toast.show('İşlem başarısız.', 'error');
    }
  };

  // Change manager
  const handleOpenEditManager = (apt: any) => {
    setEditingApt(apt);
    setNewManagerId(apt.managerId || '');
  };

  const handleUpdateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;

    setEditManagerLoading(true);
    try {
      await databases.updateDocument(DATABASE_ID, 'apartments', editingApt.$id, {
        managerId: newManagerId || null
      });

      toast.show('Yönetici başarıyla güncellendi.', 'success');
      setEditingApt(null);
      loadData();
    } catch (err) {
      toast.show('Yönetici güncellenemedi.', 'error');
    } finally {
      setEditManagerLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary shrink-0" /> Apartman Yönetim Paneli
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Platformdaki tüm binaları oluşturun, yöneticilerini atayın veya devre dışı bırakın.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 shrink-0 font-bold shadow-sm">
            <PlusCircle className="h-4.5 w-4.5" />
            {showAddForm ? 'Vazgeç' : 'Yeni Apartman Oluştur'}
          </Button>
        </div>

        {/* Create Apartment Wizard */}
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/[0.01] animate-in slide-in-from-top duration-300 max-w-3xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <PlusCircle className="h-5 w-5" /> Yeni Apartman Ekle ve Daire Yapısını Kur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateApartment} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Apartman / Site Adı"
                    type="text"
                    placeholder="Örn: Güneş Apartmanı"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                    }}
                    required
                  />
                  <Input
                    label="URL Slug (Benzersiz)"
                    type="text"
                    placeholder="gunes-apartmani"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    helperText="Ziyaretçiler: site.com/slug"
                    required
                  />
                </div>

                <Input
                  label="Açık Adres"
                  type="text"
                  placeholder="Kadıköy, İstanbul"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      İlk Yöneticiyi Seçin (İsteğe Bağlı)
                    </label>
                    <select
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Seçilmedi</option>
                      {managers.map((m) => (
                        <option key={m.$id} value={m.$id}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Blok S."
                      type="number"
                      min={1}
                      max={5}
                      value={blocksCount}
                      onChange={(e) => setBlocksCount(parseInt(e.target.value) || 1)}
                      required
                    />
                    <Input
                      label="Kat S."
                      type="number"
                      min={1}
                      max={20}
                      value={floorsCount}
                      onChange={(e) => setFloorsCount(parseInt(e.target.value) || 1)}
                      required
                    />
                    <Input
                      label="Daire S."
                      type="number"
                      min={1}
                      max={10}
                      value={unitsPerFloor}
                      onChange={(e) => setUnitsPerFloor(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" isLoading={submitLoading}>
                  Apartmanı & Daire Yapısını Kur
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Apartments Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Platformdaki Tüm Apartmanlar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Apartman Adı</th>
                    <th className="p-4">Yönetici</th>
                    <th className="p-4">Daire S.</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 text-right">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apartments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground italic">
                        Platformda kayıtlı apartman bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    apartments.map((apt) => {
                      const mgr = managers.find(m => m.$id === apt.managerId) || {};
                      const isPassive = apt.status === 'passive';
                      return (
                        <tr key={apt.$id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-foreground">{apt.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">/{apt.slug}</p>
                          </td>
                          <td className="p-4 text-foreground">{mgr.fullName || 'Atanmamış'}</td>
                          <td className="p-4 text-foreground font-semibold">{apt.unitsCount || '-'} Daire</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              !isPassive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                              {!isPassive ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(apt.$id, apt.status, apt.name)}
                              className="h-8 text-xs font-bold"
                            >
                              {!isPassive ? 'Pasifleştir' : 'Aktifleştir'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditManager(apt)}
                              className="h-8 text-xs font-bold"
                            >
                              Yönetici Değiştir
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteApartment(apt.$id, apt.name)}
                              className="h-8 text-xs font-bold"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

        {/* Change Manager Dialog */}
        {editingApt && (
          <Dialog open={!!editingApt} onOpenChange={() => setEditingApt(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yönetici Değiştir</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateManager} className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  <strong>{editingApt.name}</strong> apartmanı için atanan yöneticiyi güncelleyin.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Yönetici Seçin
                  </label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                  >
                    <option value="">Atamayı Kaldır (Yöneticisiz)</option>
                    {managers.map((m) => (
                      <option key={m.$id} value={m.$id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingApt(null)}
                  >
                    Vazgeç
                  </Button>
                  <Button type="submit" isLoading={editManagerLoading}>
                    Güncelle
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
