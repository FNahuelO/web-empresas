import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';

export interface PaymentOrder {
  orderId: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
  amount?: number;
  currency?: string;
}

export interface CaptureResult {
  status: string;
  id?: string;
  purchase_units?: Array<{
    amount?: { value: string; currency_code: string };
    description?: string;
  }>;
}

export interface MercadoPagoPreference {
  orderId: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  amount: number;
  currency: string;
}

export interface MercadoPagoOrderStatus {
  orderId: string;
  status: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  job?: {
    id: string;
    isPaid: boolean;
    paymentStatus: string | null;
    moderationStatus: string | null;
    status: string;
  } | null;
}

export interface PaymentConfig {
  defaultProvider: string;
  enableIapFallback: boolean;
  mercadoPagoConfigured: boolean;
  webEmpresasUrl?: string | null;
  iosMobileProvider?: 'iap' | 'mercadopago_web';
  androidMobileProvider?: 'iap' | 'mercadopago' | 'mercadopago_web';
}

class PaymentService {
  async getPaymentConfig(): Promise<PaymentConfig> {
    const response = await httpClient.get<{ data: PaymentConfig }>(
      API_ENDPOINTS.PAYMENTS.CONFIG
    );
    return response.data;
  }

  async createMercadoPagoPreference(params: {
    jobId: string;
    planId: string;
    platform?: 'mobile' | 'web';
    fromApp?: boolean;
  }): Promise<MercadoPagoPreference> {
    const response = await httpClient.post<{ data: MercadoPagoPreference }>(
      API_ENDPOINTS.PAYMENTS.MERCADOPAGO.CREATE_PREFERENCE,
      { ...params, platform: params.platform || 'web' }
    );
    return response.data;
  }

  async getMercadoPagoStatus(orderId: string): Promise<MercadoPagoOrderStatus> {
    const response = await httpClient.get<{ data: MercadoPagoOrderStatus }>(
      API_ENDPOINTS.PAYMENTS.MERCADOPAGO.STATUS(orderId)
    );
    return response.data;
  }

  async pollMercadoPagoStatus(
    orderId: string,
    options?: { maxAttempts?: number; intervalMs?: number }
  ): Promise<MercadoPagoOrderStatus> {
    const maxAttempts = options?.maxAttempts ?? 20;
    const intervalMs = options?.intervalMs ?? 2500;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const status = await this.getMercadoPagoStatus(orderId);
      if (status.status === 'COMPLETED' || status.job?.isPaid) {
        return status;
      }
      if (status.status === 'FAILED' || status.status === 'CANCELLED') {
        throw new Error('El pago fue rechazado o cancelado');
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('El pago sigue pendiente. Revisá tu cuenta de Mercado Pago.');
  }

  /**
   * Crear orden de pago PayPal para un empleo específico
   */
  async createJobPaymentOrder(jobId: string, planId?: string | null): Promise<PaymentOrder> {
    const response = await httpClient.post<{ data: PaymentOrder }>(
      API_ENDPOINTS.EMPRESAS.CREATE_JOB_PAYMENT(jobId),
      planId ? { planId } : {}
    );
    return response.data;
  }

  /**
   * Confirmar pago de un empleo (captura PayPal + moderación)
   */
  async confirmJobPayment(jobId: string, orderId: string): Promise<any> {
    const response = await httpClient.post<{ data: any }>(
      API_ENDPOINTS.EMPRESAS.CONFIRM_JOB_PAYMENT(jobId),
      { orderId }
    );
    return response.data;
  }

  /**
   * Crear orden de pago genérica con PayPal
   */
  async createPaymentOrder(data: {
    amount: number;
    currency?: string;
    description?: string;
    planType?: string;
    planId?: string;
  }): Promise<PaymentOrder> {
    const response = await httpClient.post<{ data: PaymentOrder }>(
      API_ENDPOINTS.PAYMENTS.CREATE_ORDER,
      data
    );
    return response.data;
  }

  /**
   * Capturar pago de una orden PayPal
   */
  async captureOrder(orderId: string, data?: {
    planType?: string;
    planId?: string;
    amount?: number;
    currency?: string;
  }): Promise<CaptureResult> {
    const response = await httpClient.post<{ data: CaptureResult }>(
      API_ENDPOINTS.PAYMENTS.CAPTURE_ORDER(orderId),
      data
    );
    return response.data;
  }

  /**
   * Obtener historial de pagos
   */
  async getPaymentHistory(): Promise<any[]> {
    const response = await httpClient.get<{ data: any[] }>(
      API_ENDPOINTS.PAYMENTS.HISTORY
    );
    return response.data;
  }
}

export const paymentService = new PaymentService();

