'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'e-posta adresiniz';

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-bg grid-bg radial-mask min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 group mb-6">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md transition-transform group-hover:scale-105">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">BİNGO</span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-8 px-6 shadow-xl rounded-2xl border border-border/50 glass-card text-center flex flex-col items-center">
          <div className="bg-primary/10 p-4 rounded-full text-primary mb-6 animate-bounce">
            <Mail className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-3">
            E-postanızı Doğrulayın
          </h2>
          
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Hesabınızı etkinleştirmek için <strong className="text-foreground">{email}</strong> adresine bir aktivasyon bağlantısı gönderdik.
          </p>

          <div className="bg-muted/40 border border-border p-4 rounded-xl text-left text-xs text-muted-foreground mb-6 max-w-sm">
            <p className="font-semibold text-foreground mb-1">E-posta gelmedi mi?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Gereksiz (Spam) klasörünü kontrol edin.</li>
              <li>Bilgileri doğru girdiğinizden emin olun.</li>
              <li>Birkaç dakika bekleyip tekrar deneyin.</li>
            </ul>
          </div>

          <div className="w-full space-y-3">
            <Link href="/login" className="block w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={
      <div className="flex-1 flex flex-col justify-center items-center bg-gradient-bg min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
