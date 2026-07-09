import { create } from 'zustand';
import { account, databases, DATABASE_ID } from './appwrite';

export interface UserProfile {
  $id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'super_admin' | 'manager' | 'member';
  avatarId?: string;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  fetchUser: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, isLoading: false }),
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Get Auth account
      const authUser = await account.get();
      
      // 2. Get User profile from databases
      const profile = await databases.getDocument(
        DATABASE_ID,
        'users',
        authUser.$id
      );

      const userProfile: UserProfile = {
        $id: profile.$id,
        email: profile.email,
        fullName: profile.fullName,
        phone: profile.phone,
        role: profile.role as 'super_admin' | 'manager' | 'member',
        avatarId: profile.avatarId,
        createdAt: profile.createdAt,
      };

      set({ user: userProfile, isLoading: false });
      return userProfile;
    } catch (e: any) {
      set({ user: null, isLoading: false });
      return null;
    }
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      await account.deleteSession('current');
    } catch (e) {
      // Safe to ignore if already deleted on the server
    }
    
    // Thoroughly clear all Appwrite session cookies (server and client side)
    if (typeof document !== 'undefined') {
      document.cookie = 'appwrite-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        if (name.startsWith('a_session_') || name.includes('_session')) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
        }
      }
    }

    set({ user: null, isLoading: false });
  }
}));

// UI Store for notifications, active apartment in dashboard, search, sidebar state
interface UIState {
  sidebarOpen: boolean;
  activeApartmentId: string | null;
  notificationsCount: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveApartmentId: (id: string | null) => void;
  setNotificationsCount: (count: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeApartmentId: null,
  notificationsCount: 0,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveApartmentId: (id) => set({ activeApartmentId: id }),
  setNotificationsCount: (count) => set({ notificationsCount: count }),
}));
