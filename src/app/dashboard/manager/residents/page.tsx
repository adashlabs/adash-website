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
import { Users, UserPlus, Home, Mail, Phone, Loader2, Link as LinkIcon } from 'lucide-react';

export default function ManagerResidentsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  
  // Assignment state
  const [showAssignForm, setShowAssignForm] = React.useState(false);
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [selectedUnitId, setSelectedUnitId] = React.useState('');
  const [relationType, setRelationType] = React.useState<'owner' | 'tenant'>('owner');

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch managed apartment
      const aptRes = await databases.listDocuments(DATABASE_ID, 'apartments', [
        Query.equal('managerId', user.$id),
        Query.limit(1)
      ]);

      if (aptRes.documents.length > 0) {
        const apt = aptRes.documents[0];
        setApartment(apt);

        // 2. Fetch all members/users from DB
        const usersRes = await databases.listDocuments(DATABASE_ID, 'users', [
          Query.equal('role', 'member'),
          Query.limit(100)
        ]);
        setMembers(usersRes.documents);

        // 3. Fetch all units for this apartment
        const unitsRes = await databases.listDocuments(DATABASE_ID, 'units', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100)
        ]);
        setUnits(unitsRes.documents);
      }
    } catch (e) {
      console.error(e);
      toast.show('Sakin verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Handle resident assignment to unit
  const handleAssignResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedUnitId) {
      toast.show('Lütfen bir kullanıcı ve daire seçin.', 'error');
      return;
    }

    setAssignLoading(true);
    try {
      const selectedUnit = units.find(u => u.$id === selectedUnitId);
      if (!selectedUnit) return;

      const updateData: any = {
        status: 'occupied'
      };

      if (relationType === 'owner') {
        updateData.ownerId = selectedUserId;
      } else {
        updateData.tenantId = selectedUserId;
        // If tenant is assigned, we should also ensure an owner is assigned.
        // If owner is empty, set owner to user as fallback.
        if (!selectedUnit.ownerId) {
          updateData.ownerId = selectedUserId;
        }
      }

      // Update unit document
      await databases.updateDocument(DATABASE_ID, 'units', selectedUnitId, updateData);

      // Create Notification for the assigned user
      const assignedUser = members.find(m => m.$id === selectedUserId);
      if (assignedUser) {
        await databases.createDocument(DATABASE_ID, 'notifications', 'unique()', {
          userId: selectedUserId,
          title: 'Daire Ataması Yapıldı',
          message: `${apartment.name} bünyesindeki Blok ${selectedUnit.blockId.split('-').pop()} No ${selectedUnit.number} numaralı daireye ${relationType === 'owner' ? 'Kat Maliki' : 'Kiracı'} olarak atandınız.`,
          isRead: false,
          type: 'general',
          createdAt: new Date().toISOString()
        });
      }

      // Log
      await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
        userId: user?.$id || '',
        action: 'resident_assigned',
        details: `Daire ${selectedUnit.number} için sakin atandı (${relationType === 'owner' ? 'Malik' : 'Kiracı'})`,
        createdAt: new Date().toISOString()
      });

      toast.show('Sakin daireye başarıyla atandı.', 'success');
      setSelectedUserId('');
      setSelectedUnitId('');
      setShowAssignForm(false);
      loadData();
    } catch (e: any) {
      console.error(e);
      toast.show('Atama işlemi gerçekleştirilemedi.', 'error');
    } finally {
      setAssignLoading(false);
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

  // Get assigned unit number for a member
  const getMemberAssignedUnit = (memberId: string) => {
    const assigned = units.filter(u => u.tenantId === memberId || u.ownerId === memberId);
    if (assigned.length === 0) return 'Atanmamış';
    return assigned.map(u => `Blok ${u.blockId.split('-').pop()} No ${u.number}`).join(', ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Sakin Yönetimi</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Apartman sakinlerinin listesini görüntüleyin ve daire atamalarını yapın.
            </p>
          </div>
          <Button onClick={() => setShowAssignForm(!showAssignForm)} className="gap-2 shrink-0 font-bold shadow-sm">
            <LinkIcon className="h-4.5 w-4.5" />
            {showAssignForm ? 'Vazgeç' : 'Sakini Daireye Ata'}
          </Button>
        </div>

        {/* Assign Resident Form */}
        {showAssignForm && (
          <Card className="border-primary/20 bg-primary/[0.01] animate-in slide-in-from-top duration-300">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Daire Sakini Tanımla / Ata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignResident} className="space-y-4 max-w-xl">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sakin (Kullanıcı Seçin)
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Seçiniz...</option>
                    {members.map((m) => (
                      <option key={m.$id} value={m.$id}>
                        {m.fullName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Atanacak Daire (Seçiniz)
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Seçiniz...</option>
                    {units.map((u) => (
                      <option key={u.$id} value={u.$id}>
                        Blok {u.blockId.split('-').pop()} - No {u.number} ({u.status === 'occupied' ? 'Dolu' : 'Boş'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    İlişki Türü
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="relationType"
                        value="owner"
                        checked={relationType === 'owner'}
                        onChange={() => setRelationType('owner')}
                        className="text-primary focus:ring-primary"
                      />
                      Kat Maliki (Ev Sahibi)
                    </label>
                    <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="relationType"
                        value="tenant"
                        checked={relationType === 'tenant'}
                        onChange={() => setRelationType('tenant')}
                        className="text-primary focus:ring-primary"
                      />
                      Kiracı / Sakin
                    </label>
                  </div>
                </div>

                <Button type="submit" className="gap-2" isLoading={assignLoading}>
                  Atamayı Tamamla
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Residents Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Kayıtlı Bina Sakinleri Listesi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Ad Soyad</th>
                    <th className="p-4">E-posta</th>
                    <th className="p-4">Telefon</th>
                    <th className="p-4">Atalı Daire(ler)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-muted-foreground italic">
                        Kayıtlı sakin bulunmamaktadır. Sakinleri sisteme davet ederek üye olmalarını sağlayın.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.$id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-bold text-foreground flex items-center gap-2.5">
                          <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs">
                            {member.fullName.charAt(0)}
                          </div>
                          {member.fullName}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                            {member.email}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                            {member.phone || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-foreground font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Home className="h-4 w-4 text-primary shrink-0" />
                            {getMemberAssignedUnit(member.$id)}
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
