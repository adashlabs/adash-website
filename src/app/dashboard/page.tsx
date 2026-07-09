import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth-actions';

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  // Role based redirection
  if (user.role === 'super_admin') {
    redirect('/dashboard/super-admin');
  } else if (user.role === 'manager') {
    redirect('/dashboard/manager');
  } else {
    redirect('/dashboard/member');
  }
}
