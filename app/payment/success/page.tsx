'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { paymentService } from '@/services/paymentService';
import { useReturnToAppAfterPayment } from '@/hooks/useReturnToAppAfterPayment';
import { buildAppPaymentDeepLink } from '@/lib/appPaymentBridge';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  const jobId = searchParams?.get('jobId') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu pago...');

  const { shouldReturnToApp } = useReturnToAppAfterPayment('success', {
    enabled: status === 'success' || status === 'pending',
    jobId,
    orderId,
    delayMs: status === 'success' ? 1200 : 2000,
  });

  useEffect(() => {
    if (!orderId) {
      setStatus('success');
      setMessage('Tu transacción fue aprobada correctamente.');
      return;
    }

    let cancelled = false;

    const verifyPayment = async () => {
      try {
        const result = await paymentService.pollMercadoPagoStatus(orderId, {
          maxAttempts: 15,
          intervalMs: 2500,
        });

        if (cancelled) return;

        if (result.status === 'COMPLETED' || result.job?.isPaid) {
          setStatus('success');
          setMessage('Tu publicación fue pagada y activada correctamente.');
        } else {
          setStatus('pending');
          setMessage('El pago sigue pendiente. Te avisaremos cuando se confirme.');
        }
      } catch (error: any) {
        if (cancelled) return;
        const errorText = error?.message || 'No pudimos confirmar el pago todavía.';
        if (errorText.toLowerCase().includes('pendiente')) {
          setStatus('pending');
          setMessage(errorText);
        } else {
          setStatus('error');
          setMessage(errorText);
        }
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isPending = status === 'pending';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[75vh] w-full max-w-2xl items-center justify-center">
        <section className="w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-5 rounded-full p-3 ${
                isSuccess ? 'bg-green-50' : isPending ? 'bg-yellow-50' : isLoading ? 'bg-blue-50' : 'bg-red-50'
              }`}
            >
              {isSuccess ? (
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              ) : (
                <ExclamationTriangleIcon
                  className={`h-10 w-10 ${
                    isPending ? 'text-yellow-600' : isLoading ? 'text-blue-600' : 'text-red-600'
                  }`}
                />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {isLoading
                ? 'Confirmando pago...'
                : isSuccess
                  ? 'Pago exitoso'
                  : isPending
                    ? 'Pago pendiente'
                    : 'No se pudo confirmar el pago'}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-600 sm:text-base">{message}</p>

            {shouldReturnToApp && (isSuccess || isPending) && (
              <p className="mt-2 text-sm font-medium text-[#002D5A]">Volviendo a la app...</p>
            )}

            {jobId && (
              <p className="mt-2 text-xs text-gray-400">Publicación: {jobId}</p>
            )}

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {shouldReturnToApp ? (
                <a
                  href={buildAppPaymentDeepLink(isSuccess ? 'success' : 'pending', { jobId, orderId })}
                  className="rounded-lg bg-[#002D5A] px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#02345fb6]"
                >
                  Volver a la app
                </a>
              ) : (
                <>
                  <Link
                    href="/publicaciones"
                    className="rounded-lg bg-[#002D5A] px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#02345fb6]"
                  >
                    Ver mis publicaciones
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Ir al dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">Cargando...</p>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
