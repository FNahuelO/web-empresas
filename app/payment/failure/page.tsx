'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { useReturnToAppAfterPayment } from '@/hooks/useReturnToAppAfterPayment';
import { buildAppPaymentDeepLink } from '@/lib/appPaymentBridge';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams?.get('jobId') || '';
  const orderId = searchParams?.get('orderId') || '';
  const { shouldReturnToApp } = useReturnToAppAfterPayment('failure', {
    enabled: true,
    jobId,
    orderId,
    delayMs: 2000,
  });

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[75vh] w-full max-w-2xl items-center justify-center">
        <section className="w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircleIcon className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pago no completado</h1>
          <p className="mt-3 text-sm text-gray-600">
            El pago fue cancelado o rechazado. Podés intentarlo nuevamente desde tus publicaciones.
          </p>
          {shouldReturnToApp && (
            <p className="mt-2 text-sm font-medium text-[#002D5A]">Volviendo a la app...</p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {shouldReturnToApp ? (
              <a
                href={buildAppPaymentDeepLink('failure', { jobId, orderId })}
                className="rounded-lg bg-[#002D5A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#02345fb6]"
              >
                Volver a la app
              </a>
            ) : (
              <Link
                href="/publicaciones"
                className="rounded-lg bg-[#002D5A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#02345fb6]"
              >
                Volver a publicaciones
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
      <PaymentFailureContent />
    </Suspense>
  );
}
