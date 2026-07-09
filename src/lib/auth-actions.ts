'use server';

import { cookies } from 'next/headers';
import { createSessionClient, createAdminClient, DATABASE_ID } from './appwrite-server';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'super_admin' | 'manager' | 'member';
  emailVerified: boolean;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const { account } = await createSessionClient();
    const authUser = await account.get();
    
    // Fetch profile using Admin Client since standard users might have restricted read permissions
    const { databases } = await createAdminClient();
    const profile = await databases.getDocument(DATABASE_ID, 'users', authUser.$id);
    
    return {
      id: authUser.$id,
      email: authUser.email,
      fullName: profile.fullName || authUser.name,
      phone: profile.phone || '',
      role: profile.role as 'super_admin' | 'manager' | 'member',
      emailVerified: authUser.emailVerification
    };
  } catch (e) {
    return null;
  }
}

export async function checkRole(requiredRole: 'super_admin' | 'manager' | 'member'): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  if (!user.emailVerified) return false;
  return user.role === requiredRole;
}

export async function logoutAction() {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession('current');
  } catch (e) {
    // Ignore error
  }
  const cookieStore = await cookies();
  cookieStore.delete('appwrite-session');
}

export async function deleteUserAction(userId: string) {
  // Check authorization
  const currentUser = await getSessionUser();
  if (!currentUser || currentUser.role !== 'super_admin') {
    throw new Error('Bu işlem için Süper Admin yetkisi gereklidir.');
  }

  const { users, databases } = await createAdminClient();

  // 1. Delete Auth user account
  try {
    await users.delete(userId);
  } catch (e) {
    // Proceed if not found
  }

  // 2. Delete database profile document
  try {
    await databases.deleteDocument(DATABASE_ID, 'users', userId);
  } catch (e) {
    // Proceed if already deleted
  }

  // 3. Create log
  try {
    await databases.createDocument(DATABASE_ID, 'logs', 'unique()', {
      userId: currentUser.id,
      action: 'admin_user_deleted',
      details: `Kullanıcı ID ${userId} platformdan silindi.`,
      createdAt: new Date().toISOString()
    });
  } catch (e) {}
}

