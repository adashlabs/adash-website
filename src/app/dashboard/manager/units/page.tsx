'use client';

import * as React from 'react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Building2, Users, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';

export default function ManagerUnitsPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = React.useState(true);
  const [apartment, setApartment] = React.useState<any>(null);
  const [blocks, setBlocks] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  const [usersList, setUsersList] = React.useState<Record<string, string>>({});

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

        // 2. Fetch blocks
        const blocksRes = await databases.listDocuments(DATABASE_ID, 'blocks', [
          Query.equal('apartmentId', apt.$id)
        ]);
        setBlocks(blocksRes.documents);

        // 3. Fetch units
        const unitsRes = await databases.listDocuments(DATABASE_ID, 'units', [
          Query.equal('apartmentId', apt.$id),
          Query.limit(100)
        ]);
        setUnits(unitsRes.documents);

        // 4. Fetch users profile mapping (for owner/tenant names)
        const usersRes = await databases.listDocuments(DATABASE_ID, 'users', [
          Query.limit(100)
        ]);
        const userMap: Record<string, string> = {};
        usersRes.documents.forEach((usr: any) => {
          userMap[usr.$id] = usr.fullName;
        });
        setUsersList(userMap);
      }
    } catch (e) {
      console.error(e);
      toast.show('Blok ve daire verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

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

  if (!apartment) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted-foreground">Lütfen önce genel bakış sayfasından apartman kurulumunu tamamlayın.</p>
      </DashboardLayout>
    );
  }

  // Helper to group units by Block and Floor
  const getGroupedUnits = (blockId: string) => {
    const blockUnits = units.filter((u) => u.blockId === blockId);
    
    // Group by Floor
    const floorsMap: Record<number, any[]> = {};
    blockUnits.forEach((u) => {
      // Find floor number from unit or floorId. We'll group by floor number or floorId.
      // Let's assume we extract floor number from unitId or floorId
      const floorNum = parseInt(u.floorId.split('-').pop()) || 1;
      if (!floorsMap[floorNum]) {
        floorsMap[floorNum] = [];
      }
      floorsMap[floorNum].push(u);
    });

    // Sort floors in descending order (highest floor first)
    return Object.keys(floorsMap)
      .map(Number)
      .sort((a, b) => b - a)
      .map((floorNum) => ({
        floorNum,
        unitsList: floorsMap[floorNum].sort((a, b) => a.number.localeCompare(b.number))
      }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Blok & Daire Yapısı</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Apartmanınızdaki blokları, katları ve dairelerin doluluk durumlarını inceleyin.
          </p>
        </div>

        {/* Blocks Display */}
        <div className="space-y-8">
          {blocks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Blok kaydı bulunamadı.</p>
          ) : (
            blocks.map((block) => {
              const groupedFloors = getGroupedUnits(block.$id);
              return (
                <Card key={block.$id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" /> {block.name}
                    </CardTitle>
                    <CardDescription>
                      Bu blokta toplam {units.filter(u => u.blockId === block.$id).length} daire bulunuyor.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {groupedFloors.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">Daire bulunmuyor.</p>
                    ) : (
                      groupedFloors.map(({ floorNum, unitsList }) => (
                        <div key={floorNum} className="flex flex-col sm:flex-row gap-4 border-b border-border/60 last:border-b-0 pb-4 last:pb-0">
                          {/* Floor label */}
                          <div className="w-20 shrink-0 flex items-center">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                              Kat {floorNum}
                            </span>
                          </div>
                          
                          {/* Units Grid */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                            {unitsList.map((ut) => {
                              const ownerName = usersList[ut.ownerId] || '';
                              const tenantName = usersList[ut.tenantId] || '';
                              const isOccupied = ut.status === 'occupied';
                              
                              return (
                                <div
                                  key={ut.$id}
                                  className={`p-3 rounded-lg border text-xs flex flex-col justify-between min-h-[90px] transition-all hover:shadow-md ${
                                    isOccupied
                                      ? 'border-border bg-card'
                                      : 'border-dashed border-muted-foreground/30 bg-muted/10'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-foreground">No {ut.number}</span>
                                    <span className={`h-2 w-2 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  </div>
                                  
                                  <div className="space-y-0.5 text-[10px] text-muted-foreground truncate">
                                    {isOccupied ? (
                                      <>
                                        <p className="font-semibold text-foreground truncate" title={`Kat Maliki: ${ownerName}`}>
                                          Malik: {ownerName || 'Bilinmiyor'}
                                        </p>
                                        {tenantName ? (
                                          <p className="truncate" title={`Kiracı: ${tenantName}`}>
                                            Sakin: {tenantName}
                                          </p>
                                        ) : null}
                                      </>
                                    ) : (
                                      <p className="italic text-amber-600 font-semibold">Boş Daire</p>
                                    )}
                                  </div>

                                  <div className="mt-2 pt-1 border-t border-border/80 text-[8px] uppercase tracking-wider font-bold text-muted-foreground/70">
                                    {ut.type === 'commercial' ? 'Dükkan' : 'Konut'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
