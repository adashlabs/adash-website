'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { account, databases, DATABASE_ID } from '@/lib/appwrite';
import { useAuthStore } from '@/lib/store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { User, Lock, Loader2, Save } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır.'),
  phone: z.string().min(10, 'Telefon numarası en az 10 karakter olmalıdır.'),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(6, 'Eski şifre en az 6 karakter olmalıdır.'),
  newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır.'),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: 'Şifreler eşleşmiyor.',
  path: ['newPasswordConfirm'],
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const toast = useToast();
  const { user, fetchUser } = useAuthStore();
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [passwordLoading, setPasswordLoading] = React.useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  React.useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName);
      setValue('phone', user.phone || '');
    }
  }, [user, setValue]);

  const onUpdateProfile = async (data: ProfileValues) => {
    if (!user) return;
    setProfileLoading(true);
    try {
      // 1. Update name in Appwrite Auth
      await account.updateName(data.fullName);

      // 2. Update profile document in DB
      await databases.updateDocument(DATABASE_ID, 'users', user.$id, {
        fullName: data.fullName,
        phone: data.phone,
      });

      toast.show('Profil bilgileri başarıyla güncellendi.', 'success');
      fetchUser(); // Sync state
    } catch (e: any) {
      console.error(e);
      toast.show(e.message || 'Profil güncellenirken hata oluştu.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const onUpdatePassword = async (data: PasswordValues) => {
    setPasswordLoading(true);
    try {
      // Update password in Appwrite Auth
      await account.updatePassword(data.newPassword, data.oldPassword);
      toast.show('Şifreniz başarıyla güncellendi.', 'success');
      resetPassword();
    } catch (e: any) {
      console.error(e);
      toast.show(e.message || 'Şifre güncellenemedi. Eski şifrenizi kontrol edin.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Profil Ayarlarım</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kişisel bilgilerinizi düzenleyin ve şifrenizi güncelleyin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Profile Details Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Kişisel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Ad Soyad"
                    type="text"
                    error={profileErrors.fullName?.message}
                    {...registerProfile('fullName')}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Telefon Numarası"
                    type="tel"
                    placeholder="5551234567"
                    error={profileErrors.phone?.message}
                    {...registerProfile('phone')}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="E-posta Adresi (Değiştirilemez)"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    helperText="E-posta adresi güvenliğiniz nedeniyle değiştirilemez."
                  />
                </div>

                <Button type="submit" className="gap-2" isLoading={profileLoading}>
                  <Save className="h-4.5 w-4.5" /> Profil Kaydet
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Güvenlik & Şifre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Mevcut Şifre"
                    type="password"
                    placeholder="••••••"
                    error={passwordErrors.oldPassword?.message}
                    {...registerPassword('oldPassword')}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Yeni Şifre"
                    type="password"
                    placeholder="••••••"
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword('newPassword')}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Yeni Şifre Tekrar"
                    type="password"
                    placeholder="••••••"
                    error={passwordErrors.newPasswordConfirm?.message}
                    {...registerPassword('newPasswordConfirm')}
                  />
                </div>

                <Button type="submit" className="gap-2" isLoading={passwordLoading}>
                  <Lock className="h-4.5 w-4.5" /> Şifreyi Güncelle
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
