'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Building2, ArrowRight } from 'lucide-react';
import { account } from '@/lib/appwrite';
import { Button } from '@/components/ui/Button';

function VerifyEmailConfirmContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId || !secret) {
      setStatus('error');
      setErrorMsg('Geçersiz aktivasyon bağlantısı. Bilgiler eksik.');
      return;
    }

    const confirmVerification = async () => {
      try {
        await account.updateVerification(userId, secret);
        setStatus('success');
      } catch (e: any) {
        console.error(e);
        setStatus('error');
        setErrorMsg(e.message || 'E-posta doğrulaması onaylanırken bir hata oluştu. Bağlantı süresi dolmuş olabilir.');
      }
    };

    confirmVerification();
  }, [userId, secret]);

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-bg grid-bg radial-mask min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">BİNGO</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-8 px-6 shadow-xl rounded-2xl border border-border/50 glass-card text-center flex flex-col items-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Doğrulanıyor...</h2>
              <p className="text-sm text-muted-foreground">E-posta adresiniz onaylanıyor, lütfen bekleyin.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Doğrulama Başarılı!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                E-posta adresiniz başarıyla doğrulandı. Artık hesabınıza giriş yapabilirsiniz.
              </p>
              <Link href="/login" className="w-full">
                <Button className="w-full justify-center group">
                  Giriş Yap
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-100 p-4 rounded-full text-red-600 mb-6">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Doğrulama Başarısız!</h2>
              <p className="text-sm text-red-600 mb-6 font-medium">{errorMsg}</p>
              <div className="w-full flex gap-3">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Giriş Sayfası
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">
                    Tekrar Kayıt Ol
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <React.Suspense fallback={
      <div className="flex-1 flex flex-col justify-center items-center bg-gradient-bg min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailConfirmContent />
    </React.Suspense>
  );
}
