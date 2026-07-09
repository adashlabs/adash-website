'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { account, databases, DATABASE_ID } from '@/lib/appwrite';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Clear user state on login mount to avoid stale data
    setUser(null);
  }, [setUser]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Clear any active session first to avoid "session already active" errors
      try {
        await account.deleteSession('current');
      } catch (err) {
        // No active session, safe to ignore
      }

      // Sweeping any client-side Appwrite cookies to ensure SDK session state is fully reset
      if (typeof document !== 'undefined') {
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

      // 1. Authenticate with Appwrite
      const session = await account.createEmailPasswordSession(data.email, data.password);
      
      // 2. Set Session Cookie for server component auth
      document.cookie = `appwrite-session=${session.secret}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;

      // 3. Verify if user is verified
      const authUser = await account.get();
      if (!authUser.emailVerification) {
        // Logout immediately if email is not verified
        await account.deleteSession('current');
        document.cookie = 'appwrite-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        toast.show('E-posta adresiniz henüz doğrulanmamıştır. Lütfen e-postanızı kontrol edin.', 'error');
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        setLoading(false);
        return;
      }

      // 4. Fetch User Profile to get role and redirect
      const profile = await databases.getDocument(DATABASE_ID, 'users', authUser.$id);
      
      toast.show(`Hoş geldiniz, ${profile.fullName}!`, 'success');
      
      // 5. Redirect based on role
      if (profile.role === 'super_admin') {
        router.push('/dashboard/super-admin');
      } else if (profile.role === 'manager') {
        router.push('/dashboard/manager');
      } else {
        router.push('/dashboard/member');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edip tekrar deneyin.');
      toast.show('Giriş başarısız!', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-bg grid-bg radial-mask min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 group mb-6">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md transition-transform group-hover:scale-105">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">BİNGO</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground">
          Hesabınıza giriş yapın
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Veya{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            yeni bir hesap oluşturun
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-8 px-6 shadow-xl rounded-2xl border border-border/50 glass-card">
          {errorMsg ? (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Input
                label="E-posta Adresi"
                type="email"
                placeholder="ornek@apartman.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="relative">
              <Input
                label="Şifre"
                type="password"
                placeholder="••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div>
              <Button type="submit" className="w-full justify-center group" isLoading={loading}>
                Giriş Yap
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
