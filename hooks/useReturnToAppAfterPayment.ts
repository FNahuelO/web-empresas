'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  isPaymentFromApp,
  redirectToAppPayment,
} from '@/lib/appPaymentBridge';

type PaymentOutcome = 'success' | 'failure' | 'pending';

export function useReturnToAppAfterPayment(
  outcome: PaymentOutcome,
  options?: {
    enabled?: boolean;
    jobId?: string;
    orderId?: string;
    delayMs?: number;
  }
) {
  const searchParams = useSearchParams();
  const enabled = options?.enabled ?? true;
  const jobId = options?.jobId || searchParams?.get('jobId') || '';
  const orderId = options?.orderId || searchParams?.get('orderId') || '';
  const delayMs = options?.delayMs ?? 1200;

  const shouldReturnToApp = enabled && isPaymentFromApp(searchParams);

  useEffect(() => {
    if (!shouldReturnToApp) return;

    const timer = setTimeout(() => {
      redirectToAppPayment(outcome, {
        jobId: jobId || undefined,
        orderId: orderId || undefined,
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [shouldReturnToApp, outcome, jobId, orderId, delayMs]);

  return { shouldReturnToApp };
}
