'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Bell,
  Wrench,
  Settings,
  LogOut,
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  TrendingUp,
  FolderOpen,
  UserCheck,
  User
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { logoutAction } from '@/lib/auth-actions';
import { useToast } from '../ui/Toast';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logoutAction();
      await logout();
      toast.show('Başarıyla çıkış yapıldı.', 'success');
      router.push('/login');
    } catch (e: any) {
      toast.show('Çıkış yapılırken bir hata oluştu.', 'error');
    }
  };

  const getLinks = () => {
    if (!user) return [];
    
    if (user.role === 'super_admin') {
      return [
        { href: '/dashboard/super-admin', label: 'Genel Bakış', icon: LayoutDashboard },
        { href: '/dashboard/super-admin/apartments', label: 'Apartman Yönetimi', icon: Building2 },
        { href: '/dashboard/super-admin/users', label: 'Kullanıcı Yönetimi', icon: Users },
        { href: '/dashboard/super-admin/logs', label: 'Sistem Logları', icon: Activity },
        { href: '/dashboard/profile', label: 'Profilim', icon: User },
      ];
    }
    
    if (user.role === 'manager') {
      return [
        { href: '/dashboard/manager', label: 'Genel Bakış', icon: LayoutDashboard },
        { href: '/dashboard/manager/units', label: 'Blok & Daireler', icon: Building2 },
        { href: '/dashboard/manager/residents', label: 'Sakin Yönetimi', icon: UserCheck },
        { href: '/dashboard/manager/fees', label: 'Aidat Yönetimi', icon: CreditCard },
        { href: '/dashboard/manager/finance', label: 'Gelir & Gider', icon: TrendingUp },
        { href: '/dashboard/manager/announcements', label: 'Duyurular', icon: Bell },
        { href: '/dashboard/manager/documents', label: 'Belgeler', icon: FolderOpen },
        { href: '/dashboard/manager/requests', label: 'Arıza & Talepler', icon: Wrench },
        { href: '/dashboard/manager/settings', label: 'Apartman Ayarları', icon: Settings },
        { href: '/dashboard/profile', label: 'Profilim', icon: User },
      ];
    }

    // Member
    return [
      { href: '/dashboard/member', label: 'Genel Bakış', icon: LayoutDashboard },
      { href: '/dashboard/member/fees', label: 'Aidat & Borçlar', icon: CreditCard },
      { href: '/dashboard/member/requests', label: 'Arıza Talepleri', icon: Wrench },
      { href: '/dashboard/member/documents', label: 'Belgeler', icon: FolderOpen },
      { href: '/dashboard/member/announcements', label: 'Duyurular', icon: Bell },
      { href: '/dashboard/profile', label: 'Profilim', icon: User },
    ];
  };

  const links = getLinks();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'Süper Admin';
      case 'manager': return 'Yönetici';
      case 'member': return 'Daire Sakini';
      default: return '';
    }
  };

  // Hydration safe classes for sidebar
  const sidebarClasses = `fixed top-0 bottom-0 left-0 z-50 md:sticky md:top-0 md:h-screen md:z-20 w-64 bg-card border-r border-border flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
    mounted && sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {mounted && sidebarOpen ? (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
        />
      ) : null}

      {/* Sidebar Drawer */}
      <aside className={sidebarClasses}>
        <div>
          {/* Header */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">BİNGO</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded hover:bg-muted cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Links List */}
          <nav className="p-4 space-y-1">
            {mounted && links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {!mounted && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Footer / User Details */}
        <div className="p-4 border-t border-border space-y-4">
          {mounted && user ? (
            <div className="flex items-center gap-3 px-2">
              <div className="bg-primary/10 text-primary h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                {user.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{user.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                <span className="inline-block bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 uppercase">
                  {getRoleBadge(user.role)}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-9 bg-muted/50 animate-pulse rounded-lg" />
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  );
}
