'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { buildLoginUrlWithReturn, sanitizeReturnPath } from '@/lib/appPaymentBridge';
import Link from 'next/link';

function AppHandoffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams?.get('code')?.trim();
    const returnToFallback = sanitizeReturnPath(searchParams?.get('returnTo'));

    if (!code) {
      setError('Enlace inválido. Volvé a la app e intentá de nuevo.');
      return;
    }

    let cancelled = false;

    const exchange = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/web-handoff/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            (typeof payload?.message === 'string' && payload.message) ||
            'No se pudo validar tu sesión. Iniciá sesión para continuar.';
          if (!cancelled) {
            setError(message);
            if (returnToFallback) {
              setTimeout(() => {
                router.replace(buildLoginUrlWithReturn(returnToFallback));
              }, 2500);
            }
          }
          return;
        }

        const data = payload?.data;
        if (!data?.accessToken || !data?.refreshToken) {
          throw new Error('Respuesta de sesión incompleta');
        }

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        const userSnapshot = {
          version: 1,
          savedAt: Date.now(),
          user: {
            id: data.user.id,
            email: data.user.email,
            role: 'EMPRESA',
          },
        };
        localStorage.setItem('authUserSnapshot', JSON.stringify(userSnapshot));

        const destination =
          sanitizeReturnPath(data.returnPath) || returnToFallback || '/publicaciones';

        if (!cancelled) {
          router.replace(destination);
        }
      } catch (handoffError: any) {
        if (cancelled) return;
        setError(handoffError?.message || 'Error al conectar con el portal de empresas');
        if (returnToFallback) {
          setTimeout(() => {
            router.replace(buildLoginUrlWithReturn(returnToFallback));
          }, 2500);
        }
      }
    };

    exchange();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-gray-900">No pudimos continuar</h1>
            <p className="mt-3 text-sm text-gray-600">{error}</p>
            <p className="mt-2 text-xs text-gray-400">
              Si el enlace expiró, volvé a la app y tocá &quot;Completar pago&quot; de nuevo.
            </p>
            <Link
              href={buildLoginUrlWithReturn(sanitizeReturnPath(searchParams?.get('returnTo')))}
              className="mt-6 inline-block rounded-lg bg-[#002D5A] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Iniciar sesión manualmente
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#002D5A] border-t-transparent" />
            <h1 className="text-lg font-semibold text-gray-900">Conectando tu cuenta</h1>
            <p className="mt-2 text-sm text-gray-600">Preparando el pago de forma segura...</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function AppHandoffPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">Cargando...</p>
        </main>
      }
    >
      <AppHandoffContent />
    </Suspense>
  );
}
