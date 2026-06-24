const FROM_APP_SESSION_KEY = 'ty_payment_from_app';
const APP_SCHEME = process.env.NEXT_PUBLIC_APP_DEEP_LINK_SCHEME || 'trabajoya';

const ALLOWED_RETURN_PREFIXES = ['/publicaciones', '/payment', '/planes', '/dashboard'];

export function sanitizeReturnPath(returnPath: string | null | undefined): string | null {
  if (!returnPath) return null;
  const trimmed = returnPath.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.includes('://') || trimmed.includes('..') || trimmed.includes('\\')) return null;
  if (trimmed.length > 512) return null;

  const pathOnly = trimmed.split('?')[0];
  const allowed = ALLOWED_RETURN_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)
  );
  if (!allowed) return null;

  return trimmed;
}

export function buildLoginUrlWithReturn(returnPath?: string | null): string {
  const safe = sanitizeReturnPath(returnPath);
  if (!safe) return '/login';
  return `/login?returnTo=${encodeURIComponent(safe)}`;
}

export function markPaymentFromApp(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(FROM_APP_SESSION_KEY, '1');
  } catch {
    // ignore
  }
}

export function isPaymentFromApp(searchParams: URLSearchParams | null): boolean {
  if (searchParams?.get('fromApp') === '1') return true;
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(FROM_APP_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPaymentFromApp(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(FROM_APP_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function buildAppPaymentDeepLink(
  outcome: 'success' | 'failure' | 'pending',
  params: { jobId?: string; orderId?: string }
): string {
  const query = new URLSearchParams();
  if (params.jobId) query.set('jobId', params.jobId);
  if (params.orderId) query.set('orderId', params.orderId);
  const suffix = query.toString();
  return `${APP_SCHEME}://payment/${outcome}${suffix ? `?${suffix}` : ''}`;
}

export function redirectToAppPayment(
  outcome: 'success' | 'failure' | 'pending',
  params: { jobId?: string; orderId?: string }
): void {
  if (typeof window === 'undefined') return;
  clearPaymentFromApp();
  window.location.href = buildAppPaymentDeepLink(outcome, params);
}
