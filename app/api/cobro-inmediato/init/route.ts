import { NextResponse } from 'next/server';

type InitBody = {
  jobId?: string;
  planName?: string | null;
  planId?: string | null;
};

const BASE_URL =
  process.env.COBRO_INMEDIATO_BASE_URL || 'https://preprod.comunidad.cobroinmediato.tech/paymentLink';
const AUTH_URL = `${BASE_URL}/auth/token`;
const PAYMENT_LINK_URL = `${BASE_URL}/api`;
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function toMoneyString(value: number | string | undefined): string {
  const parsed = typeof value === 'string' ? Number(value) : value ?? 0;
  const safe = Number.isFinite(parsed) ? Number(parsed) : 0;
  return safe.toFixed(2);
}

function plusDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function sanitizeCoinRedirectUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  let raw = value.trim();
  if (!raw) return '';

  // Algunos casos llegan con sufijos literales "undefined"/"null".
  raw = raw.replace(/(?:undefined|null)+$/gi, '');

  try {
    const parsed = new URL(raw);
    const toDelete: string[] = [];
    parsed.searchParams.forEach((paramValue, key) => {
      const normalized = String(paramValue || '').trim().toLowerCase();
      if (normalized === 'undefined' || normalized === 'null') {
        toDelete.push(key);
      }
    });
    for (const key of toDelete) {
      parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function buildNumericCodeFromJobId(jobId?: string): number {
  if (!jobId) return 12345678;
  const digits = jobId.replace(/\D/g, '');
  if (digits.length >= 8) return Number(digits.slice(-8));

  let hash = 0;
  for (let i = 0; i < jobId.length; i += 1) {
    hash = (hash * 31 + jobId.charCodeAt(i)) % 100000000;
  }
  return Math.max(hash, 10000001);
}

async function requestAccessToken(username: string, password: string): Promise<string> {
  const attempts: Array<Record<string, string>> = [
    { username, password },
    { email: username, password },
    { user: username, password },
  ];

  let lastError = 'No se pudo autenticar';

  for (const body of attempts) {
    const authRes = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const authJson = await authRes.json().catch(() => null);
    if (!authRes.ok) {
      lastError = authJson?.message || `HTTP ${authRes.status}`;
      continue;
    }

    const token =
      authJson?.token ||
      authJson?.access_token ||
      authJson?.accessToken ||
      authJson?.data?.token ||
      authJson?.data?.access_token;

    if (typeof token === 'string' && token.trim().length > 0) {
      return token;
    }

    lastError = 'Respuesta de auth sin token';
  }

  throw new Error(lastError);
}

function unwrapData<T = any>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function extractDigits(value?: string | number | null): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\D/g, '');
}

function normalizePlanText(value?: string | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase();
}

function extractPlanKey(value?: string | null): string {
  return normalizePlanText(value).replace(/^PLAN\s+/, '').trim();
}

function mapPlanKeyToName(planKey?: string): string | null {
  const key = extractPlanKey(planKey);
  if (!key) return null;

  const mapping: Record<string, string> = {
    BASIC: 'BASIC',
    PREMIUM: 'PREMIUM',
    ENTERPRISE: 'ENTERPRISE',
    URGENT: 'URGENT',
    STANDARD: 'STANDARD',
    CRYSTAL: 'CRYSTAL',
  };

  return mapping[key] || key || null;
}

function getPlanNameFromJob(job: any): string | null {
  return (
    job?.plan?.name ||
    job?.planName ||
    job?.selectedPlanName ||
    mapPlanKeyToName(job?.planType) ||
    mapPlanKeyToName(job?.entitlements?.[0]?.planKey) ||
    null
  );
}

function getPlanAmountArs(plan: any): number | null {
  const ars = Number(plan?.priceArs);
  if (Number.isFinite(ars) && ars > 0) return ars;
  const legacy = Number(plan?.price);
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  return null;
}

function getPlanAmountUsd(plan: any): number | null {
  const usd = Number(plan?.priceUsd);
  if (Number.isFinite(usd) && usd > 0) return usd;

  // Compatibilidad legacy: algunos catálogos usan `price` para USD.
  const legacy = Number(plan?.price);
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  return null;
}

function getJobAmountArs(job: any): number | null {
  const candidates = [
    job?.paymentAmountArs,
    job?.amountArs,
    job?.priceArs,
    job?.plan?.priceArs,
    job?.selectedPlan?.priceArs,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  // Solo usar paymentAmount si explícitamente ya viene en ARS.
  if (String(job?.paymentCurrency || '').toUpperCase() === 'ARS') {
    const arsPaymentAmount = Number(job?.paymentAmount);
    if (Number.isFinite(arsPaymentAmount) && arsPaymentAmount > 0) return arsPaymentAmount;
  }

  return null;
}

async function getPlansFromEndpoint(): Promise<any[]> {
  const plansRes = await fetch(`${BACKEND_BASE_URL}/api/plans`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!plansRes.ok) return [];

  const plansJson = await plansRes.json().catch(() => null);
  const unwrapped = unwrapData<any>(plansJson);

  const candidates = [
    unwrapped,
    unwrapped?.items,
    unwrapped?.results,
    unwrapped?.data,
    unwrapped?.data?.items,
    unwrapped?.data?.results,
    plansJson?.items,
    plansJson?.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function findPlanFromCatalog(
  plans: any[],
  job: any,
  requestedPlanName?: string | null,
  requestedPlanId?: string | null
): any | null {
  if (!Array.isArray(plans) || plans.length === 0) return null;

  const inputPlanId = String(
    requestedPlanId || job?.selectedPlanId || job?.planId || job?.plan?.id || ''
  ).trim();
  if (inputPlanId) {
    const byPlanId = plans.find((plan) => String(plan?.id || '').trim() === inputPlanId);
    if (byPlanId) return byPlanId;
  }

  const findByNameOrCode = (planNameOrKey?: string | null): any | null => {
    const normalizedInput = extractPlanKey(planNameOrKey);
    if (!normalizedInput) return null;

    return (
      plans.find((plan) => {
        const name = extractPlanKey(plan?.name);
        const code = extractPlanKey(plan?.code);
        const subscriptionPlan = extractPlanKey(plan?.subscriptionPlan);
        return (
          normalizedInput === name ||
          normalizedInput === code ||
          normalizedInput === subscriptionPlan
        );
      }) || null
    );
  };

  if (requestedPlanName) {
    const byRequestedName = findByNameOrCode(requestedPlanName);
    if (byRequestedName) return byRequestedName;
  }

  const jobPlanName = getPlanNameFromJob(job);
  if (jobPlanName) {
    const byJobName = findByNameOrCode(jobPlanName);
    if (byJobName) return byJobName;
  }

  const expectedAmount = getJobAmountArs(job);
  if (Number.isFinite(expectedAmount)) {
    const byLegacyAmount = plans.find((plan) => {
      const planAmount = getPlanAmountArs(plan);
      return Number(planAmount) === expectedAmount;
    });
    if (byLegacyAmount) return byLegacyAmount;
  }

  const expectedUsdAmount = Number(job?.paymentAmount);
  if (Number.isFinite(expectedUsdAmount) && expectedUsdAmount > 0) {
    const byUsdAmount = plans.find((plan) => {
      const planUsd = getPlanAmountUsd(plan);
      if (!planUsd) return false;
      return Math.abs(planUsd - expectedUsdAmount) < 0.01;
    });
    if (byUsdAmount) return byUsdAmount;
  }

  return null;
}

async function getPlanNameFromPlansEndpoint(job: any): Promise<string | null> {
  const plans = await getPlansFromEndpoint();
  const matchedPlan = findPlanFromCatalog(plans, job);
  return matchedPlan?.name || null;
}

async function getCoinAmountAndCurrency(
  job: any,
  requestedPlanName?: string | null,
  requestedPlanId?: string | null
): Promise<{ amount: string; currency: string }> {
  const plans = await getPlansFromEndpoint();
  const matchedPlan = findPlanFromCatalog(plans, job, requestedPlanName, requestedPlanId);

  const arsAmount = matchedPlan ? getPlanAmountArs(matchedPlan) : null;
  if (arsAmount && arsAmount > 0) {
    return { amount: toMoneyString(arsAmount), currency: 'ARS' };
  }

  const jobAmountArs = getJobAmountArs(job);
  if (jobAmountArs && jobAmountArs > 0) {
    return { amount: toMoneyString(jobAmountArs), currency: 'ARS' };
  }

  const minPlanArs = plans
    .map((plan) => getPlanAmountArs(plan))
    .filter((value): value is number => Number.isFinite(value) && Number(value) > 0)
    .sort((a, b) => a - b)[0];

  if (minPlanArs && minPlanArs > 0) {
    return { amount: toMoneyString(minPlanArs), currency: 'ARS' };
  }

  const configuredFallbackArs = Number(process.env.COBRO_INMEDIATO_FALLBACK_ARS || 10000);
  return {
    amount: toMoneyString(configuredFallbackArs > 0 ? configuredFallbackArs : 10000),
    currency: 'ARS',
  };
}

async function fetchBackendJobAndClientData(userToken: string, jobId: string) {
  const jobsRes = await fetch(`${BACKEND_BASE_URL}/api/empresas/jobs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!jobsRes.ok) {
    throw new Error(`No se pudo consultar jobs en backend: HTTP ${jobsRes.status}`);
  }

  const jobsJson = await jobsRes.json().catch(() => null);
  const jobsData = unwrapData<any[]>(jobsJson);
  const jobs = Array.isArray(jobsData) ? jobsData : [];
  const job = jobs.find((item) => item?.id === jobId);

  if (!job) {
    throw new Error('No se encontró la publicación en backend');
  }

  const profileRes = await fetch(`${BACKEND_BASE_URL}/api/empresas/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  let profile: any = null;
  if (profileRes.ok) {
    const profileJson = await profileRes.json().catch(() => null);
    profile = unwrapData(profileJson);
  }

  return { job, profile };
}

async function ensureBackendPaymentOrderId(
  userToken: string,
  job: any,
  requestedPlanId?: string | null
): Promise<string | null> {
  const existingOrderId = String(job?.paymentOrderId || "").trim();
  if (existingOrderId) {
    return existingOrderId;
  }

  const createOrderRes = await fetch(
    `${BACKEND_BASE_URL}/api/empresas/jobs/${job?.id}/payment/create-order`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        requestedPlanId
          ? {
              planId: requestedPlanId,
            }
          : {}
      ),
      cache: "no-store",
    }
  );

  if (!createOrderRes.ok) {
    const errorJson = await createOrderRes.json().catch(() => null);
    console.warn("No se pudo crear orderId en backend para COIN", {
      jobId: job?.id,
      status: createOrderRes.status,
      message: errorJson?.message || `HTTP ${createOrderRes.status}`,
    });
    return null;
  }

  const createOrderJson = await createOrderRes.json().catch(() => null);
  const orderData = unwrapData<any>(createOrderJson);
  const orderId = String(
    orderData?.orderId || createOrderJson?.data?.orderId || createOrderJson?.orderId || ""
  ).trim();

  return orderId || null;
}

async function persistCoinLinkInBackendJob(
  userToken: string,
  jobId: string,
  payload: {
    coinPaymentLinkUrl: string;
  }
) {
  const updateRes = await fetch(`${BACKEND_BASE_URL}/api/empresas/jobs/${jobId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!updateRes.ok) {
    const updateJson = await updateRes.json().catch(() => null);
    console.warn('No se pudo persistir coinPaymentLink en backend', {
      jobId,
      status: updateRes.status,
      message: updateJson?.message || `HTTP ${updateRes.status}`,
    });
  }
}

export async function POST(request: Request) {
  try {
    const username = process.env.COBRO_INMEDIATO_USERNAME;
    const password = process.env.COBRO_INMEDIATO_PASSWORD;
    const clientId = process.env.COBRO_INMEDIATO_CLIENT_ID;

    if (!username || !password || !clientId) {
      return NextResponse.json(
        {
          message:
            'Faltan variables COBRO_INMEDIATO_USERNAME, COBRO_INMEDIATO_PASSWORD o COBRO_INMEDIATO_CLIENT_ID',
        },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const userToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!userToken) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as InitBody;
    if (!body.jobId) {
      return NextResponse.json({ message: 'jobId es requerido' }, { status: 400 });
    }

    const requestedPlanName = body.planName?.trim() || null;
    const requestedPlanId = body.planId?.trim() || null;
    const { job, profile } = await fetchBackendJobAndClientData(userToken, body.jobId);
    const paymentOrderId = await ensureBackendPaymentOrderId(userToken, job, requestedPlanId);

    console.log('job', job);
    console.log('body', body);

    const debtTypeId = Number(process.env.COBRO_INMEDIATO_DEBT_TYPE_ID || 1);
    const expirationDate = process.env.COBRO_INMEDIATO_EXPIRATION_DATE || plusDaysISO(7);
    const title = job.title || 'Publicación de empleo';
    const planNameFromJob = getPlanNameFromJob(job);
    const planNameFromCatalog = planNameFromJob
      ? null
      : await getPlanNameFromPlansEndpoint(job);
    const planDetail =
      requestedPlanName ||
      planNameFromJob ||
      planNameFromCatalog ||
      'Plan de publicación';
    const { amount, currency } = await getCoinAmountAndCurrency(
      job,
      requestedPlanName,
      requestedPlanId
    );

    const cuitDigits = extractDigits(profile?.cuit);
    const dniDigits =
      extractDigits(profile?.dni) ||
      extractDigits(profile?.documentNumber) ||
      extractDigits(profile?.ownerDocumentNumber);
    const clientCode = Number(cuitDigits || buildNumericCodeFromJobId(body.jobId));
    const payerIdentityNumber = Number(
      process.env.COBRO_INMEDIATO_PAYER_IDENTITY_NUMBER ||
      dniDigits ||
      cuitDigits ||
      clientCode
    );
    const clientName =
      profile?.companyName ||
      profile?.razonSocial ||
      profile?.nombreEmpresa ||
      profile?.businessName ||
      profile?.name ||
      title;

    const token = await requestAccessToken(username, password);

    const queryTicketTextBase = `Plan de publicación: ${planDetail}`;
    const queryTicketTextTrace = `${queryTicketTextBase} | JOB:${body.jobId}${
      paymentOrderId ? ` | ORDER:${paymentOrderId}` : ""
    }`;

    const payload = {
      clientId,
      paymentMethods: ['pagofacil'],
      amount,
      debt_type_id: debtTypeId,
      query_ticket_text: queryTicketTextTrace,
      expiration_date: expirationDate,
      client_code: clientCode,
      client_name: clientName,
      payer_identity_number: payerIdentityNumber,
      currency,
    };

    const payRes = await fetch(PAYMENT_LINK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const payJson = await payRes.json().catch(() => null);
    if (!payRes.ok) {
      return NextResponse.json(
        { message: payJson?.message || `Error creando link de pago: HTTP ${payRes.status}` },
        { status: payRes.status }
      );
    }

    const redirectUrl = sanitizeCoinRedirectUrl(payJson?.data?.link);

    if (!redirectUrl) {
      return NextResponse.json(
        { message: 'La API de Cobro Inmediato no devolvió URL de redirección' },
        { status: 502 }
      );
    }

    await persistCoinLinkInBackendJob(userToken, body.jobId, {
      coinPaymentLinkUrl: redirectUrl,
    });

    return NextResponse.json({
      ok: true,
      redirectUrl,
      paymentOrderId,
      raw: payJson,
    });
  } catch (error: any) {
    console.error('Error iniciando Cobro Inmediato:', error);
    return NextResponse.json(
      {
        message: error?.message || 'Error interno al iniciar Cobro Inmediato',
      },
      { status: 500 }
    );
  }
}
