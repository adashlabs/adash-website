'use client';

import * as React from 'react';
import { Bell, User, LogOut, Loader2, Check, Menu, X, Building2 } from 'lucide-react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore, useUIStore } from '@/lib/store';
import GlobalSearch from './GlobalSearch';
import { logoutAction } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';
import { useToast } from '../ui/Toast';

export default function Topbar() {
  const router = useRouter();
  const toast = useToast();
  
  const user = useAuthStore((state) => state.user);
  const { notificationsCount, setNotificationsCount, sidebarOpen, setSidebarOpen } = useUIStore();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(false);

  // Fetch in-app notifications for the user
  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const res = await databases.listDocuments(DATABASE_ID, 'notifications', [
        Query.equal('userId', user.$id),
        Query.orderDesc('createdAt'),
        Query.limit(10)
      ]);
      setNotifications(res.documents);
      const unread = res.documents.filter(n => !n.isRead).length;
      setNotificationsCount(unread);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user, setNotificationsCount]);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await databases.updateDocument(DATABASE_ID, 'notifications', id, {
        isRead: true
      });
      setNotifications(prev => prev.map(n => n.$id === id ? { ...n, isRead: true } : n));
      setNotificationsCount(Math.max(0, notificationsCount - 1));
      toast.show('Bildirim okundu olarak işaretlendi.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;
    try {
      await Promise.all(
        unreadNotifications.map(n =>
          databases.updateDocument(DATABASE_ID, 'notifications', n.$id, {
            isRead: true
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotificationsCount(0);
      toast.show('Tüm bildirimler okundu olarak işaretlendi.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logoutAction();
      await logout();
      toast.show('Başarıyla çıkış yapıldı.', 'success');
      router.push('/login');
    } catch (e) {
      toast.show('Çıkış yapılamadı.', 'error');
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 gap-2 sm:gap-4">
      
      {/* Mobile Hamburger & Logo */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
        >
          {mounted && sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-1.5">
          <div className="bg-primary text-primary-foreground p-1 rounded">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm hidden xs:inline">BİNGO</span>
        </div>
      </div>

      {/* Global Search Component */}
      <div className="flex-1 min-w-0 max-w-lg">
        <GlobalSearch />
      </div>

      {/* Action Controls (Notifications & User Menu) */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        
        {/* Notification Dropdown Menu */}
        <DropdownPrimitive.Root onOpenChange={(open) => open && fetchNotifications()}>
          <DropdownPrimitive.Trigger className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors">
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {notificationsCount}
              </span>
            )}
          </DropdownPrimitive.Trigger>

          <DropdownPrimitive.Portal>
            <DropdownPrimitive.Content
              align="end"
              sideOffset={8}
              className="w-80 rounded-xl border border-border bg-card p-4 shadow-xl z-50 text-sm max-h-[400px] flex flex-col focus:outline-none"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border mb-2">
                <span className="font-bold text-foreground">Bildirimler</span>
                {notificationsCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
                  >
                    Tümünü Oku
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-1 scrollbar-thin">
                {loadingNotifications ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Henüz bir bildiriminiz bulunmuyor.
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.$id}
                      className={`p-2.5 rounded-lg border text-xs flex justify-between gap-3 relative transition-all ${
                        notif.isRead
                          ? 'bg-muted/10 border-transparent text-muted-foreground'
                          : 'bg-primary/[0.02] border-primary/10 text-foreground font-medium'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-bold">{notif.title}</p>
                        <p className="leading-relaxed text-[11px] text-muted-foreground">{notif.message}</p>
                        <span className="text-[9px] text-muted-foreground/60 block">
                          {new Date(notif.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.$id)}
                          className="self-center p-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer shrink-0"
                          title="Okundu olarak işaretle"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DropdownPrimitive.Content>
          </DropdownPrimitive.Portal>
        </DropdownPrimitive.Root>

        {/* User Quick Profile Actions */}
        {mounted && user ? (
          <DropdownPrimitive.Root>
            <DropdownPrimitive.Trigger className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted cursor-pointer focus:outline-none transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-inner uppercase">
                {user.fullName.charAt(0)}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-foreground max-w-[100px] truncate">
                {user.fullName}
              </span>
            </DropdownPrimitive.Trigger>

            <DropdownPrimitive.Portal>
              <DropdownPrimitive.Content
                align="end"
                sideOffset={8}
                className="w-48 rounded-xl border border-border bg-card p-2 shadow-xl z-50 text-sm focus:outline-none"
              >
                <div className="px-3 py-2 border-b border-border/80 mb-1">
                  <p className="text-xs font-bold text-foreground truncate">{user.fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">{user.role}</p>
                </div>

                <DropdownPrimitive.Item
                  onClick={() => router.push('/dashboard/profile')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profilim</span>
                </DropdownPrimitive.Item>

                <DropdownPrimitive.Item
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer focus:outline-none transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownPrimitive.Item>
              </DropdownPrimitive.Content>
            </DropdownPrimitive.Portal>
          </DropdownPrimitive.Root>
        ) : (
          <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-full" />
        )}

      </div>
    </header>
  );
}
