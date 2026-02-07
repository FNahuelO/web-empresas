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

class PaymentService {
  /**
   * Crear orden de pago PayPal para un empleo específico
   */
  async createJobPaymentOrder(jobId: string): Promise<PaymentOrder> {
    const response = await httpClient.post<{ data: PaymentOrder }>(
      API_ENDPOINTS.EMPRESAS.CREATE_JOB_PAYMENT(jobId)
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

