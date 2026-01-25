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
    const response = await httpClient.get<{ data: Plan[] }>(API_ENDPOINTS.PLANS.LIST);
    return response.data;
  }
}

export const subscriptionService = new SubscriptionService();

