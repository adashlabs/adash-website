import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Query } from 'node-appwrite';
import {
  Building2,
  MapPin,
  Users,
  Bell,
  BookOpen,
  FileText,
  User,
  Phone,
  Mail,
  Grid,
  Calendar,
  Wrench,
  ExternalLink,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { createAdminClient, DATABASE_ID } from '@/lib/appwrite-server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ----------------------------------------------------
// Fallback Mock Data for Reviewability
// ----------------------------------------------------
const mockApartments: Record<string, any> = {
  'gunes-apartmani': {
    $id: 'apt-gunes',
    name: 'Güneş Apartmanı',
    description: 'Kadıköy\'ün merkezinde, 24 saat güvenlikli, otoparklı ve peyzaj alanlı modern yaşam kompleksi.',
    address: 'Osmanağa Mah. Güneş Sokak No:12 Kadıköy, İstanbul',
    blocksCount: 1,
    floorsCount: 5,
    unitsCount: 20,
    rules: [
      'Evcil hayvan besleme kurallarına uyulmalıdır.',
      'Ortak alan temizliğine dikkat edilmelidir.',
      'Saat 22:00\'den sonra gürültü yapılmamalıdır.',
      'Çöpler her akşam saat 19:00 - 20:00 arasında toplanacaktır.'
    ],
    manager: {
      fullName: 'Mustafa Demir',
      phone: '+90 555 222 33 40',
      email: 'mustafa.demir@siteyonetim.com'
    },
    announcements: [
      { id: '1', title: 'Asansör Rutin Bakımı', content: 'Değerli sakinlerimiz, A Blok asansörünün aylık periyodik bakımı bu Cuma saat 10:00-12:00 arasında yapılacaktır. Anlayışınız için teşekkür ederiz.', createdAt: '10.07.2026' },
      { id: '2', title: 'Dış Cephe Temizliği', content: 'Apartmanımızın dış cephe cam temizliği önümüzdeki Pazartesi günü yapılacaktır. Balkonlardaki eşyaların koruma altına alınması rica olunur.', createdAt: '08.07.2026' }
    ],
    maintenance: [
      { id: 'm1', title: 'Su Deposu Temizliği', date: '01.07.2026', status: 'Tamamlandı' },
      { id: 'm2', title: 'Hidrofor Değişimi', date: '25.06.2026', status: 'Tamamlandı' }
    ],
    documents: [
      { id: 'd1', name: 'Karar_Defteri_2026.pdf', size: '2.4 MB' },
      { id: 'd2', name: 'Apartman_Yonetmeligi.pdf', size: '1.1 MB' }
    ]
  },
  'yildiz-sitesi': {
    $id: 'apt-yildiz',
    name: 'Yıldız Sitesi',
    description: 'Çocuk oyun alanları, basketbol sahası ve geniş yeşil alanları ile aileler için huzurlu bir yaşam sitesi.',
    address: 'Barış Mah. Yıldızlar Caddesi No:4 Beylikdüzü, İstanbul',
    blocksCount: 3,
    floorsCount: 8,
    unitsCount: 72,
    rules: [
      'Balkonlardan halı ve kilim silkelenmesi yasaktır.',
      'Site içi hız limiti 20 km/s\'dir.',
      'Açık havuz kullanım saatleri 09:00 - 20:00 arasındadır.',
      'Misafir araçları sadece misafir otoparkına park edebilir.'
    ],
    manager: {
      fullName: 'Zeynep Kaya',
      phone: '+90 555 222 33 41',
      email: 'zeynep.kaya@siteyonetim.com'
    },
    announcements: [
      { id: '1', title: 'Yaz Dönemi Havuz Kullanımı', content: 'Havuz kullanım saatleri yoğunluk nedeniyle sabah 09:00 akşam 20:00 olarak güncellenmiştir. Havuz hijyen kurallarına dikkat edilmesi önemle rica olunur.', createdAt: '09.07.2026' },
      { id: '2', title: 'Site İçi Hız Sınırı Uyarısı', content: 'Çocuklarımızın güvenliği için site içerisinde araç hız sınırının (20 km/s) aşılmaması gerekmektedir. Aşılması durumunda plakalar bildirilecektir.', createdAt: '05.07.2026' }
    ],
    maintenance: [
      { id: 'm1', title: 'Havuz Filtre Değişimi', date: '04.07.2026', status: 'Tamamlandı' },
      { id: 'm2', title: 'Çocuk Parkı Kauçuk Zemin Yenileme', date: '18.06.2026', status: 'Tamamlandı' }
    ],
    documents: [
      { id: 'd1', name: 'Havuz_Kuralları.pdf', size: '420 KB' },
      { id: 'd2', name: '2026_Genel_Kurul_Tutanak.pdf', size: '4.8 MB' }
    ]
  },
  'yesil-vadi': {
    $id: 'apt-yesilvadi',
    name: 'Yeşil Vadi Konakları',
    description: 'Doğa ile iç içe, akıllı ev teknolojileriyle donatılmış, lüks ve konforlu butik konut projesi.',
    address: 'Göktürk Mah. Vadi Sokak No:2 Eyüpsultan, İstanbul',
    blocksCount: 2,
    floorsCount: 4,
    unitsCount: 28,
    rules: [
      'Ortak alanlarda sigara içilmesi yasaktır.',
      'Daire tadilatları sadece hafta içi 09:00 - 17:00 saatleri arasında yapılabilir.',
      'Sığınak ve bodrum katlarında kişisel eşya depolanması yasaktır.'
    ],
    manager: {
      fullName: 'Kemal Şahin',
      phone: '+90 555 222 33 42',
      email: 'kemal.sahin@siteyonetim.com'
    },
    announcements: [
      { id: '1', title: 'Ortak Alan Peyzaj Yenilemesi', content: 'Bahçe peyzaj çalışmaları kapsamında bu hafta içi ortak yürüyüş yollarında düzenlemeler yapılacaktır. Geçici rahatsızlık için özür dileriz.', createdAt: '07.07.2026' },
      { id: '2', title: 'Fiber İnternet Altyapısı', content: 'Sitemizde Türk Telekom fiber altyapı güçlendirme çalışmaları tamamlanmıştır. Daireler bireysel başvurularla geçiş yapabilirler.', createdAt: '03.07.2026' }
    ],
    maintenance: [
      { id: 'm1', title: 'Bahçe Sulama Sistemi Onarımı', date: '30.06.2026', status: 'Tamamlandı' },
      { id: 'm2', title: 'Güvenlik Kameraları Güncellemesi', date: '15.06.2026', status: 'Tamamlandı' }
    ],
    documents: [
      { id: 'd1', name: 'Yeşilvadi_Tüzük.pdf', size: '1.6 MB' },
      { id: 'd2', name: 'Fiber_Başvuru_Kılavuzu.pdf', size: '890 KB' }
    ]
  }
};

export default async function ApartmentPage({ params }: PageProps) {
  const { slug } = await params;

  let apartment: any = null;
  let announcements: any[] = [];
  let maintenance: any[] = [];
  let documents: any[] = [];
  let manager: any = null;
  let isMock = false;

  try {
    const { databases } = await createAdminClient();

    // Query apartment
    const aptRes = await databases.listDocuments(DATABASE_ID, 'apartments', [
      Query.equal('slug', slug),
      Query.limit(1)
    ]);

    if (aptRes.documents.length > 0) {
      apartment = aptRes.documents[0];
      const aptId = apartment.$id;

      // Fetch announcements
      const annRes = await databases.listDocuments(DATABASE_ID, 'announcements', [
        Query.equal('apartmentId', aptId),
        Query.limit(5)
      ]);
      announcements = annRes.documents;

      // Fetch maintenance requests (completed requests count as maintenance history)
      const maintRes = await databases.listDocuments(DATABASE_ID, 'maintenance_requests', [
        Query.equal('apartmentId', aptId),
        Query.equal('status', 'completed'),
        Query.limit(5)
      ]);
      maintenance = maintRes.documents.map(m => ({
        id: m.$id,
        title: m.title,
        date: new Date(m.createdAt).toLocaleDateString('tr-TR'),
        status: 'Tamamlandı'
      }));

      // Fetch documents
      const docRes = await databases.listDocuments(DATABASE_ID, 'documents', [
        Query.equal('apartmentId', aptId),
        Query.limit(5)
      ]);
      documents = docRes.documents;

      // Fetch manager info
      if (apartment.managerId) {
        try {
          const mgrDoc = await databases.getDocument(DATABASE_ID, 'users', apartment.managerId);
          manager = {
            fullName: mgrDoc.fullName,
            phone: mgrDoc.phone,
            email: mgrDoc.email
          };
        } catch (e) {
          // If no manager profile document
        }
      }
    }
  } catch (err) {
    console.warn('Appwrite connection failed, loading fallback mock data...');
  }

  // Fallback to Mock Data if DB query failed or empty
  if (!apartment) {
    if (mockApartments[slug]) {
      const mock = mockApartments[slug];
      apartment = mock;
      announcements = mock.announcements;
      maintenance = mock.maintenance;
      documents = mock.documents;
      manager = mock.manager;
      isMock = true;
    } else {
      notFound();
    }
  }

  return (
    <div className="bg-background text-foreground flex-1 flex flex-col">
      {/* Cover Hero Banner */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden bg-primary/20">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-indigo-600/30 grid-bg" />
        
        {/* Cover text container */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-7xl w-full px-4 sm:px-6 lg:px-8 z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-card text-primary p-3 rounded-2xl border border-border shadow-md shrink-0">
              <Building2 className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                {apartment.name}
              </h1>
              <p className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {apartment.address}
              </p>
            </div>
          </div>
          <div>
            <Link href="/login">
              <Button size="md" className="shadow-md">Sakin Girişi</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        
        {/* Left 2 Columns: About, Gallery, Rules, Announcements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-3">Apartman Hakkında</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {apartment.description || 'Yönetim tarafından açıklama girilmemiştir.'}
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <span className="block text-xl md:text-2xl font-extrabold text-primary">{apartment.blocksCount || 1}</span>
                <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blok Sayısı</span>
              </div>
              <div className="text-center border-x border-border">
                <span className="block text-xl md:text-2xl font-extrabold text-primary">{apartment.floorsCount || 5}</span>
                <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kat Sayısı</span>
              </div>
              <div className="text-center">
                <span className="block text-xl md:text-2xl font-extrabold text-primary">{apartment.unitsCount || 20}</span>
                <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daire Sayısı</span>
              </div>
            </div>
          </Card>

          {/* Photo Gallery Grid */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Grid className="h-5 w-5 text-primary" /> Fotoğraf Galerisi
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="aspect-video bg-muted rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer">Ortak Alan</div>
              <div className="aspect-video bg-muted rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer">Peyzaj</div>
              <div className="aspect-video bg-muted rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer">Otopark</div>
              <div className="aspect-video bg-muted rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer">Lobi</div>
              <div className="aspect-video bg-muted rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer">Çocuk Parkı</div>
              <div className="aspect-video bg-muted rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer">Dış Görünüm</div>
            </div>
          </Card>

          {/* Announcements */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Son Duyurular
            </h2>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aktif duyuru bulunmamaktadır.</p>
              ) : (
                announcements.map((ann, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-muted/10">
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <h4 className="font-bold text-sm text-foreground">{ann.title}</h4>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('tr-TR') : ann.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Rules */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Apartman Kuralları
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {apartment.rules && apartment.rules.length > 0 ? (
                apartment.rules.map((rule: string, idx: number) => (
                  <div key={idx} className="flex gap-2 text-xs text-muted-foreground">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic col-span-2">Apartman kuralı girilmemiştir.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Manager Info, Location Map, Maintenance History, Documents */}
        <div className="space-y-8">
          {/* Manager & Contact */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Yönetici Bilgileri</h2>
            {manager ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{manager.fullName}</h4>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Apartman Yöneticisi</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{manager.phone || 'Girilmedi'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span>{manager.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Yönetici bilgisi atanmamıştır.</p>
            )}
          </Card>

          {/* Map Area (Placeholder) */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-1">
              <MapPin className="h-5 w-5 text-primary" /> Harita Alanı
            </h2>
            <div className="aspect-video bg-muted border border-border rounded-lg flex flex-col items-center justify-center text-center p-4">
              <MapPin className="h-6 w-6 text-muted-foreground mb-1 animate-bounce" />
              <span className="text-xs text-muted-foreground font-bold">Harita Yükleniyor...</span>
              <p className="text-[10px] text-muted-foreground/60 max-w-[200px] mt-1">{apartment.address}</p>
            </div>
          </Card>

          {/* Maintenance History */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" /> Son Bakım Kayıtları
            </h2>
            <div className="relative pl-4 border-l border-border space-y-5 text-xs">
              {maintenance.length === 0 ? (
                <p className="text-muted-foreground italic pl-2">Tamamlanmış bakım kaydı bulunmuyor.</p>
              ) : (
                maintenance.map((m, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                    <h4 className="font-bold text-foreground">{m.title}</h4>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" /> {m.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Shared Public Documents */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Kamusal Belgeler
            </h2>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Paylaşılan evrak bulunmamaktadır.</p>
              ) : (
                documents.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4 text-red-500 shrink-0" />
                      {doc.name}
                    </span>
                    <button className="text-[10px] text-primary font-bold hover:underline cursor-pointer">
                      İndir
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
