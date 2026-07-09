'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  Plus,
  ChevronDown,
  Info,
  Shield,
  Zap,
  Globe,
  Settings,
  Bell,
  Check,
  X,
  ExternalLink,
  MapPin,
  Phone,
  LayoutDashboard,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// ----------------------------------------------------
// FAQ Data
// ----------------------------------------------------
const faqs = [
  {
    question: 'BİNGO platformunu kullanmaya nasıl başlayabilirim?',
    answer: 'Dakikalar içinde kayıt olup apartmanınızı veya sitenizi oluşturabilirsiniz. Blokları, katları ve daireleri tanımladıktan sonra sakinlerinizi e-posta veya telefon ile davet ederek yönetime başlayabilirsiniz.'
  },
  {
    question: 'E-posta doğrulaması neden zorunludur?',
    answer: 'Sakinlerin ve yöneticilerin veri güvenliğini en üst düzeyde tutmak amacıyla, sisteme kayıt olan her kullanıcının geçerli bir e-posta adresine sahip olduğunu doğrulaması zorunludur. Doğrulanmayan hesaplar yönetim paneline giriş yapamaz.'
  },
  {
    question: 'Aidat ödeme sistemi nasıl çalışıyor?',
    answer: 'Yöneticiler daireler için aidat borçlandırması yapar. Sakinler kendi panellerinden "Aidat Öde" butonuna basarak ödeme bildirimi gönderirler. Yönetici ödemeyi (dekontu) kontrol ettikten sonra onaylar ve aidat kapatılır.'
  },
  {
    question: 'Appwrite Cloud altyapısı güvenli midir?',
    answer: 'Evet, BİNGO tüm veritabanı, üyelik ve dosya depolama işlemleri için Appwrite Cloud kullanır. Appwrite, endüstri standardı şifreleme yöntemleri, otomatik yedekleme ve SSL sertifikaları ile verilerinizi korur.'
  },
  {
    question: 'Offline (Çevrimdışı) mod desteği nedir?',
    answer: 'BİNGO bir PWA (Progressive Web App) olarak tasarlanmıştır. Telefonunuza veya bilgisayarınıza yüklediğinizde, internet bağlantınız kesilse dahi duyurulara ve belgelere erişebilir, uygulamayı kesintisiz açabilirsiniz.'
  }
];

export default function LandingPage() {
  // ----------------------------------------------------
  // Interactive Demo State (Simulation)
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = React.useState<'manager' | 'member'>('manager');
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  // Demo Mock State
  const [demoFees, setDemoFees] = React.useState([
    { id: 'f-1', title: 'Temmuz Aidatı', amount: 450, status: 'pending', date: '15.07.2026' },
    { id: 'f-2', title: 'Ortak Alan Elektrik', amount: 120, status: 'paid', date: '05.07.2026' },
    { id: 'f-3', title: 'Asansör Bakım Ek Gider', amount: 200, status: 'reviewing', date: '20.07.2026' },
  ]);

  const [demoRequests, setDemoRequests] = React.useState([
    { id: 'r-1', title: 'A Blok Asansör Bozuk', category: 'Asansör', status: 'waiting', priority: 'high', date: 'Bugün' },
    { id: 'r-2', title: 'Bahçe Aydınlatması Yanmıyor', category: 'Elektrik', status: 'in_progress', priority: 'medium', date: 'Dün' },
    { id: 'r-3', title: '2. Kat Su Sızıntısı', category: 'Tesisat', status: 'completed', priority: 'high', date: '3 gün önce' },
  ]);

  const [newRequestTitle, setNewRequestTitle] = React.useState('');
  const [newRequestCategory, setNewRequestCategory] = React.useState('Asansör');
  const [newRequestPriority, setNewRequestPriority] = React.useState('medium');

  const [demoLogs, setDemoLogs] = React.useState([
    { id: 'l-1', text: 'Yönetici Mustafa yeni bir duyuru paylaştı.', time: '10 dk önce' },
    { id: 'l-2', text: 'Daire 12 (Ahmet Ö.) aidat ödemesi bildirdi.', time: '1 saat önce' },
    { id: 'l-3', text: 'Daire 4 (Selin Y.) yeni bir arıza talebi açtı.', time: '2 saat önce' }
  ]);

  const [notifications, setNotifications] = React.useState<string[]>([]);

  // Simulation handlers
  const handlePayFee = (id: string) => {
    setDemoFees(prev => prev.map(f => f.id === id ? { ...f, status: 'reviewing' } : f));
    // Add to activity log
    const updatedFee = demoFees.find(f => f.id === id);
    if (updatedFee) {
      setDemoLogs(prev => [
        { id: Math.random().toString(), text: `Daire 8 ödeme bildirdi: ${updatedFee.title} (${updatedFee.amount} TL)`, time: 'Şimdi' },
        ...prev
      ]);
      setNotifications(prev => [...prev, `Daire 8 ödeme bildirdi: ${updatedFee.title}`]);
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestTitle.trim()) return;

    const newReq = {
      id: Math.random().toString(),
      title: newRequestTitle,
      category: newRequestCategory,
      status: 'waiting',
      priority: newRequestPriority,
      date: 'Şimdi'
    };

    setDemoRequests(prev => [newReq, ...prev]);
    setDemoLogs(prev => [
      { id: Math.random().toString(), text: `Yeni talep oluşturuldu: ${newRequestTitle}`, time: 'Şimdi' },
      ...prev
    ]);
    setNotifications(prev => [...prev, `Yeni talep açıldı: ${newRequestTitle}`]);
    setNewRequestTitle('');
  };

  const handleApproveFee = (id: string) => {
    setDemoFees(prev => prev.map(f => f.id === id ? { ...f, status: 'paid' } : f));
    const approvedFee = demoFees.find(f => f.id === id);
    if (approvedFee) {
      setDemoLogs(prev => [
        { id: Math.random().toString(), text: `${approvedFee.title} ödemesi onaylandı.`, time: 'Şimdi' },
        ...prev
      ]);
    }
  };

  // Calculations for manager dashboard charts/stats
  const totalIncome = demoFees.filter(f => f.status === 'paid').reduce((acc, curr) => acc + curr.amount, 14200);
  const pendingRequestsCount = demoRequests.filter(r => r.status === 'waiting' || r.status === 'in_progress').length;

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* ----------------------------------------------------
          NAVBAR
      ---------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">BİNGO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Özellikler</a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Canlı Demo</a>
            <a href="#apartments" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Apartmanlar</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">SSS</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Hemen Başla</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------
          HERO SECTION
      ---------------------------------------------------- */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gradient-bg grid-bg">
        <div className="absolute inset-0 radial-mask pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 shadow-sm"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Yeni Nesil Bulut Tabanlı Apartman Yönetimi</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none"
          >
            Apartmanınızı Dijitalleştirin, <br />
            <span className="gradient-text">BİNGO ile Kolayca Yönetin</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Daire sakinleri ile bağınızı güçlendirin. Aidat takipleri, gelir-gider raporları, arıza talepleri ve duyurular artık tek ekranda.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-lg group">
                Hemen Ücretsiz Deneyin
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Canlı Demoyu İncele
              </Button>
            </a>
          </motion.div>

          {/* Quick Stats Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto p-6 rounded-2xl border border-border bg-card/50 glass-card premium-shadow"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-primary">150+</span>
              <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">Aktif Apartman</span>
            </div>
            <div className="flex flex-col items-center border-l border-border">
              <span className="text-3xl md:text-4xl font-extrabold text-primary">5,400+</span>
              <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">Daire Sakini</span>
            </div>
            <div className="flex flex-col items-center border-l border-border">
              <span className="text-3xl md:text-4xl font-extrabold text-primary">%98.4</span>
              <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">Tahsilat Başarısı</span>
            </div>
            <div className="flex flex-col items-center border-l border-border">
              <span className="text-3xl md:text-4xl font-extrabold text-primary">4.9/5</span>
              <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">Müşteri Memnuniyeti</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ----------------------------------------------------
          LIVE DEMO SECTION (SIMULATION)
      ---------------------------------------------------- */}
      <section id="demo" className="py-20 bg-background border-y border-border/40 relative">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none opacity-30" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Gerçek Zamanlı İnteraktif Demo</h2>
            <p className="text-muted-foreground">
              Aşağıdaki panelde yönetici ve sakin görünümleri arasında geçiş yapabilirsiniz. Sakin panelinden aidat ödeyip veya talep açıp, yönetici panelindeki anlık değişimleri canlı olarak görebilirsiniz.
            </p>
          </div>

          {/* Demo tab buttons */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1.5 rounded-xl flex gap-2 border border-border">
              <button
                onClick={() => setActiveTab('manager')}
                className={`px-4 py-2 text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                  activeTab === 'manager' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Yönetici Görünümü
              </button>
              <button
                onClick={() => setActiveTab('member')}
                className={`px-4 py-2 text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                  activeTab === 'member' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4 text-primary" />
                Sakin Görünümü
              </button>
            </div>
          </div>

          {/* Demo Panel Container */}
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col premium-shadow">
            {/* Topbar of Mock Panel */}
            <div className="bg-muted/60 px-6 py-4 border-b border-border flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Simüle Edilen Apartman: <strong>GÜNEŞ APARTMANI</strong></span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-primary shrink-0" />
                  <span>{notifications.length} Bildirim</span>
                </div>
                <span>Rol: <strong className="text-foreground uppercase">{activeTab === 'manager' ? 'Yönetici' : 'Sakin'}</strong></span>
              </div>
            </div>

            {/* Content of Mock Panel */}
            <div className="p-6 flex-1 bg-card">
              <AnimatePresence mode="wait">
                {activeTab === 'manager' ? (
                  <motion.div
                    key="manager-demo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* Left Column: Stats & Financials */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Stat Cards Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Card className="bg-muted/10 border-border/80">
                          <CardContent className="p-4">
                            <span className="text-xs text-muted-foreground font-semibold">Aylık Toplam Gelir</span>
                            <h3 className="text-xl font-bold mt-1 text-foreground">{(totalIncome).toLocaleString('tr-TR')} TL</h3>
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                              <TrendingUp className="h-3 w-3" /> +%12.4 artış
                            </span>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/10 border-border/80">
                          <CardContent className="p-4">
                            <span className="text-xs text-muted-foreground font-semibold">Aylık Toplam Gider</span>
                            <h3 className="text-xl font-bold mt-1 text-foreground">7,400 TL</h3>
                            <span className="text-[10px] text-muted-foreground font-semibold block mt-1">Sabit Giderler dahil</span>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/10 border-border/80 col-span-2 sm:col-span-1">
                          <CardContent className="p-4">
                            <span className="text-xs text-muted-foreground font-semibold">Bekleyen Talepler</span>
                            <h3 className="text-xl font-bold mt-1 text-red-600">{pendingRequestsCount} Arıza</h3>
                            <span className="text-[10px] text-red-500/80 font-bold block mt-1">Aksiyon Bekliyor</span>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Financial Chart Visualization (Premium Custom SVG) */}
                      <Card className="p-5">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="text-sm font-bold text-foreground">Gelir / Gider Grafiği</h4>
                            <p className="text-xs text-muted-foreground">Son 5 aylık mali analiz</p>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1.5 font-bold"><span className="h-2 w-2 bg-primary rounded-full" /> Gelir</span>
                            <span className="flex items-center gap-1.5 font-bold"><span className="h-2 w-2 bg-red-400 rounded-full" /> Gider</span>
                          </div>
                        </div>
                        {/* Custom Animated SVG Chart */}
                        <div className="h-44 w-full flex items-end justify-between pt-4 relative">
                          {/* Grid Lines */}
                          <div className="absolute inset-x-0 top-0 border-b border-border/50 text-[10px] text-muted-foreground pb-1">15.000 TL</div>
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-border/50 text-[10px] text-muted-foreground pb-1">7.500 TL</div>
                          
                          {/* Bars */}
                          <div className="flex flex-col items-center gap-1.5 flex-1 z-10">
                            <div className="flex gap-1 items-end h-32">
                              <motion.div initial={{ height: 0 }} animate={{ height: '70%' }} className="w-4 bg-primary rounded-t" />
                              <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} className="w-4 bg-red-400 rounded-t" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">Mart</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1 z-10">
                            <div className="flex gap-1 items-end h-32">
                              <motion.div initial={{ height: 0 }} animate={{ height: '80%' }} className="w-4 bg-primary rounded-t" />
                              <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} className="w-4 bg-red-400 rounded-t" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">Nisan</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1 z-10">
                            <div className="flex gap-1 items-end h-32">
                              <motion.div initial={{ height: 0 }} animate={{ height: '65%' }} className="w-4 bg-primary rounded-t" />
                              <motion.div initial={{ height: 0 }} animate={{ height: '35%' }} className="w-4 bg-red-400 rounded-t" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">Mayıs</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1 z-10">
                            <div className="flex gap-1 items-end h-32">
                              <motion.div initial={{ height: 0 }} animate={{ height: '90%' }} className="w-4 bg-primary rounded-t" />
                              <motion.div initial={{ height: 0 }} animate={{ height: '25%' }} className="w-4 bg-red-400 rounded-t" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">Haziran</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1 z-10">
                            <div className="flex gap-1 items-end h-32">
                              <motion.div initial={{ height: 0 }} animate={{ height: totalIncome > 14500 ? '95%' : '85%' }} className="w-4 bg-primary rounded-t transition-all" />
                              <motion.div initial={{ height: 0 }} animate={{ height: '20%' }} className="w-4 bg-red-400 rounded-t" />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">Temmuz</span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Right Column: Recent Activity & Management Actions */}
                    <div className="space-y-6">
                      {/* Aidat Onaylama Alanı (Şerh) */}
                      <Card className="p-4 border-primary/20 bg-primary/[0.01]">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Onay Bekleyen Aidatlar</h4>
                        <div className="space-y-3">
                          {demoFees.filter(f => f.status === 'reviewing').length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 italic text-center">İncelenen ödeme bildirimi bulunmuyor. Sakin Görünümüne geçip aidat ödeyebilirsiniz.</p>
                          ) : (
                            demoFees.filter(f => f.status === 'reviewing').map(f => (
                              <div key={f.id} className="flex justify-between items-center p-2.5 rounded-lg border border-border bg-card">
                                <div>
                                  <p className="text-xs font-bold">{f.title}</p>
                                  <p className="text-[10px] text-amber-600 font-semibold">Ödeme Bildirildi • {f.amount} TL</p>
                                </div>
                                <Button size="sm" onClick={() => handleApproveFee(f.id)} className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700">
                                  Onayla
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </Card>

                      {/* Log Panel */}
                      <Card className="p-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5 text-primary" /> Son Aktivite Logları
                        </h4>
                        <div className="space-y-3.5">
                          {demoLogs.map(l => (
                            <div key={l.id} className="flex items-start gap-2 text-xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-muted-foreground leading-normal">{l.text}</p>
                                <span className="text-[10px] text-muted-foreground/60 block mt-0.5">{l.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="member-demo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* Left Column: My Bills / Fees */}
                    <div className="space-y-6">
                      <Card className="p-5">
                        <h4 className="text-sm font-bold text-foreground mb-4">Borçlarım ve Aidatlar</h4>
                        <div className="space-y-3">
                          {demoFees.map(f => (
                            <div key={f.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/10">
                              <div>
                                <h5 className="text-xs font-bold text-foreground">{f.title}</h5>
                                <p className="text-[10px] text-muted-foreground">Son Ödeme: {f.date}</p>
                                <span className="text-xs font-extrabold text-foreground block mt-1">{f.amount} TL</span>
                              </div>
                              <div>
                                {f.status === 'paid' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <Check className="h-3 w-3" /> Ödendi
                                  </span>
                                )}
                                {f.status === 'reviewing' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Kontrol Ediliyor
                                  </span>
                                )}
                                {f.status === 'pending' && (
                                  <Button size="sm" onClick={() => handlePayFee(f.id)} className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Ödeme Bildir
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Documents / Rules Mock */}
                      <Card className="p-5">
                        <h4 className="text-sm font-bold text-foreground mb-3">Apartman Belgeleri</h4>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/30 transition-colors">
                            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-red-500" /> Karar_Defteri_2026.pdf</span>
                            <span className="text-[10px] text-muted-foreground">İndir</span>
                          </div>
                          <div className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/30 transition-colors">
                            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-600" /> Haziran_Mali_Rapor.xlsx</span>
                            <span className="text-[10px] text-muted-foreground">İndir</span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Middle Column: Create Request */}
                    <div className="space-y-6">
                      <Card className="p-5">
                        <h4 className="text-sm font-bold text-foreground mb-4">Arıza / Talep Bildirimi</h4>
                        <form onSubmit={handleCreateRequest} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Talep Başlığı</label>
                            <input
                              type="text"
                              value={newRequestTitle}
                              onChange={(e) => setNewRequestTitle(e.target.value)}
                              placeholder="Örn: 3. Kat koridor ışıkları yanmıyor"
                              className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kategori</label>
                              <select
                                value={newRequestCategory}
                                onChange={(e) => setNewRequestCategory(e.target.value)}
                                className="w-full text-xs h-9 border border-border rounded-lg bg-background px-2 focus:outline-none"
                              >
                                <option value="Asansör">Asansör</option>
                                <option value="Elektrik">Elektrik</option>
                                <option value="Tesisat">Tesisat</option>
                                <option value="Temizlik">Temizlik</option>
                                <option value="Gürültü">Gürültü</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Öncelik</label>
                              <select
                                value={newRequestPriority}
                                onChange={(e) => setNewRequestPriority(e.target.value)}
                                className="w-full text-xs h-9 border border-border rounded-lg bg-background px-2 focus:outline-none"
                              >
                                <option value="low">Düşük</option>
                                <option value="medium">Orta</option>
                                <option value="high">Yüksek</option>
                              </select>
                            </div>
                          </div>
                          <Button type="submit" size="sm" className="w-full gap-2">
                            <Plus className="h-4 w-4" /> Talep Gönder
                          </Button>
                        </form>
                      </Card>
                    </div>

                    {/* Right Column: Active Requests List */}
                    <div className="space-y-6">
                      <Card className="p-5">
                        <h4 className="text-sm font-bold text-foreground mb-4">Gönderilen Taleplerim</h4>
                        <div className="space-y-3">
                          {demoRequests.map(r => (
                            <div key={r.id} className="p-3 rounded-lg border border-border bg-card">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="text-xs font-bold leading-snug">{r.title}</h5>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  r.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                }`}>
                                  {r.priority === 'high' ? 'Acil' : 'Orta'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2.5 text-[10px]">
                                <span className="text-muted-foreground">{r.category} • {r.date}</span>
                                <span className={`font-bold px-1.5 py-0.5 rounded ${
                                  r.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : (r.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')
                                }`}>
                                  {r.status === 'completed' ? 'Tamamlandı' : (r.status === 'in_progress' ? 'İşlemde' : 'Bekliyor')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          FEATURES SECTION
      ---------------------------------------------------- */}
      <section id="features" className="py-24 bg-gradient-bg relative overflow-hidden border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
              Site ve Apartman Yönetiminde İhtiyacınız Olan Her Şey
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              BİNGO, apartman yöneticileri ve sakinleri için tüm süreçleri şeffaf, hızlı ve pratik hale getirir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 glass-card">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl mb-6">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Gelişmiş Aidat Sistemi</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Borçlandırma oluşturma, sakin ödeme bildirimi ve kolay onay süreçleri ile finansal akışlarınızı hatasız yönetin.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 glass-card">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl mb-6">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Arıza & Talep Yönetimi</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ortak alan arızalarını kategorize edip öncelik seviyelerine göre yetkililere iletin, durum güncellemelerini sakinlere anlık bildirin.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 glass-card">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl mb-6">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Dijital Evrak & Belgeler</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Karar defteri, mali raporlar, faturalar ve yönetmelikleri Appwrite Storage üzerinde güvenle saklayın ve paylaşın.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 glass-card">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl mb-6">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Anlık Duyurular</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Panoda duyuru asma devri kapandı. Önemli gelişmeleri uygulama içinden duyurun, e-posta aktivasyonuyla güvenli iletim sağlayın.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 glass-card">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl mb-6">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Kamu Apartman Sayfası</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Apartmanınıza özel, giriş yapılmadan ziyaret edilebilen dinamik bir web sayfası ile şeffaf yönetim ilkelerinizi kamuya sunun.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 glass-card">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Rol Bazlı Erişim (RBAC)</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Süper Admin, Yönetici ve Üye rolleri ile veri yetkilendirmelerini kesin hatlarla ayırın, gizliliği ve güvenliği koruyun.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          PUBLIC APARTMENTS SHOWCASE
      ---------------------------------------------------- */}
      <section id="apartments" className="py-24 bg-background border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Kamuya Açık Apartman Sayfaları</h2>
            <p className="text-muted-foreground">
              Her apartmanın giriş yapmadan ziyaret edilebilen bir tanıtım ve bilgi sayfası bulunur. Aşağıdaki örnek apartman sayfalarını ziyaret edebilirsiniz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="overflow-hidden glass-card hover:scale-105 transition-all">
              <div className="h-32 bg-primary/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/30" />
                <Building2 className="h-12 w-12 text-primary relative z-10" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-foreground mb-2">Güneş Apartmanı</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  Kadıköy'ün merkezinde, 24 saat güvenlikli, otoparklı ve peyzaj alanlı modern yaşam kompleksi.
                </p>
                <Link href="/gunes-apartmani" target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                  Sayfayı Görüntüle <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden glass-card hover:scale-105 transition-all">
              <div className="h-32 bg-primary/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-500/30" />
                <Building2 className="h-12 w-12 text-indigo-600 relative z-10" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-foreground mb-2">Yıldız Sitesi</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  Çocuk oyun alanları, basketbol sahası ve geniş yeşil alanları ile aileler için huzurlu bir yaşam sitesi.
                </p>
                <Link href="/yildiz-sitesi" target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                  Sayfayı Görüntüle <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden glass-card hover:scale-105 transition-all">
              <div className="h-32 bg-primary/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-violet-500/30" />
                <Building2 className="h-12 w-12 text-violet-600 relative z-10" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-foreground mb-2">Yeşil Vadi Konakları</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  Doğa ile iç içe, akıllı ev teknolojileriyle donatılmış, lüks ve konforlu butik konut projesi.
                </p>
                <Link href="/yesil-vadi" target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                  Sayfayı Görüntüle <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          FAQ SECTION
      ---------------------------------------------------- */}
      <section id="faq" className="py-24 bg-gradient-bg border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-muted-foreground">BİNGO hakkında en çok merak edilen konuları derledik.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="border border-border bg-card rounded-xl overflow-hidden shadow-sm transition-all duration-200">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-foreground cursor-pointer focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground border-t border-border/50 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          FOOTER
      ---------------------------------------------------- */}
      <footer className="bg-card border-t border-border py-12 text-sm text-muted-foreground relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1 rounded-lg">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">BİNGO</span>
            </Link>
            <p className="text-xs leading-relaxed max-w-xs">
              Yeni nesil apartman ve site yönetim yazılımı. Appwrite Cloud altyapısı ile güvenli, PWA uyumu ile çevrimdışı çalışabilen modern yönetim sistemi.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase tracking-wider text-xs">Bağlantılar</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-foreground transition-colors">Özellikler</a></li>
              <li><a href="#demo" className="hover:text-foreground transition-colors">İnteraktif Demo</a></li>
              <li><a href="#apartments" className="hover:text-foreground transition-colors">Kamu Apartmanları</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">Sık Sorulan Sorular</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase tracking-wider text-xs">Yasal</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-foreground cursor-pointer">Kullanım Koşulları</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Gizlilik Politikası</span></li>
              <li><span className="hover:text-foreground cursor-pointer">KVKK Aydınlatma</span></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-xs">İletişim</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary shrink-0" /> Kadıköy, İstanbul, Türkiye</li>
              <li className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary shrink-0" /> +90 216 123 45 67</li>
              <li className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary shrink-0" /> destek@siteyonetim.com</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border mt-8 pt-8 text-center text-xs">
          <p>© 2026 BİNGO. Tüm hakları saklıdır. Google DeepMind Antigravity tarafından geliştirilmiştir.</p>
        </div>
      </footer>
    </div>
  );
}
