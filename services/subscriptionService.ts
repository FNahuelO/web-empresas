import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import { Subscription, Plan } from '@/types';

class SubscriptionService {
  async getCurrentSubscription(): Promise<Subscription> {
    const response = await httpClient.get<{ data: Subscription }>(
      API_ENDPOINTS.SUBSCRIPTIONS.CURRENT
    );
    return response.data;
  }

  async canCreateJob(): Promise<{ canCreate: boolean; hasActiveSubscription: boolean; reason?: string }> {
    const response = await httpClient.get<{ data: { canCreate: boolean; hasActiveSubscription: boolean; reason?: string } }>(
      API_ENDPOINTS.SUBSCRIPTIONS.CAN_CREATE_JOB
    );
    return response.data;
  }

  async getPlans(): Promise<Plan[]> {
    const response = await httpClient.get<{ data: { items: Plan[]; total: number; page: number; pageSize: number; totalPages: number } }>(
      API_ENDPOINTS.PLANS.LIST
    );
    // El backend retorna respuesta paginada { items, total, ... }
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.items || [];
  }
}

export const subscriptionService = new SubscriptionService();

