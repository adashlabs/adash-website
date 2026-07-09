'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, User, Mail, Phone, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { account, databases, DATABASE_ID } from '@/lib/appwrite';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır.'),
  role: z.enum(['manager', 'member']),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Şifreler eşleşmiyor.',
  path: ['passwordConfirm'],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'member',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const userId = 'u-' + Math.random().toString(36).substring(2, 11);
      
      // 1. Create User in Auth
      await account.create(userId, data.email, data.password, data.fullName);
      
      // 2. Temporarily Login to create email verification
      await account.createEmailPasswordSession(data.email, data.password);
      
      // 3. Create Profile Document in Database
      await databases.createDocument(DATABASE_ID, 'users', userId, {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        createdAt: new Date().toISOString()
      });

      // 4. Send Email Verification link
      const redirectUrl = `${window.location.origin}/verify-email/confirm`;
      await account.createVerification(redirectUrl);

      // 5. Logout session so they cannot navigate until verified
      await account.deleteSession('current');

      toast.show('Hesabınız başarıyla oluşturuldu! Lütfen e-postanızı doğrulayın.', 'success');
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Kayıt oluşturulurken bir hata meydana geldi.');
      toast.show('Kayıt başarısız!', 'error');
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
          Yeni bir hesap oluşturun
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Zaten üye misiniz?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Giriş yapın
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Ad Soyad"
                type="text"
                placeholder="Örn: Mustafa Demir"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </div>

            <div className="relative">
              <Input
                label="E-posta Adresi"
                type="email"
                placeholder="ornek@siteyonetim.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="relative">
              <Input
                label="Telefon Numarası"
                type="tel"
                placeholder="Örn: 5551234567"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* Role Select Group */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rolünüz
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'member')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                    selectedRole === 'member'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <User className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">Bina Sakini / Üye</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'manager')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                    selectedRole === 'manager'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <Building2 className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">Apartman Yöneticisi</span>
                </button>
              </div>
              {errors.role?.message ? (
                <span className="text-xs text-destructive font-medium">{errors.role.message}</span>
              ) : null}
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

            <div className="relative">
              <Input
                label="Şifre Tekrar"
                type="password"
                placeholder="••••••"
                error={errors.passwordConfirm?.message}
                {...register('passwordConfirm')}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full justify-center group" isLoading={loading}>
                Kayıt Ol ve E-postayı Doğrula
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
