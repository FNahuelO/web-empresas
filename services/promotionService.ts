import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import { LaunchTrialStatus, LaunchTrialClaimResponse } from '@/types';

class PromotionService {
  /**
   * Obtiene el estado de la promoción de lanzamiento
   */
  async getLaunchTrialStatus(): Promise<LaunchTrialStatus> {
    const response = await httpClient.get<{ data: LaunchTrialStatus }>(
      API_ENDPOINTS.PROMOTIONS.LAUNCH_TRIAL_STATUS
    );
    return response.data;
  }

  /**
   * Reclama la promoción de lanzamiento
   * @param jobPostId - ID de la publicación de empleo a la que se asociará la promoción
   */
  async claimLaunchTrial(jobPostId: string): Promise<LaunchTrialClaimResponse> {
    const response = await httpClient.post<{ data: LaunchTrialClaimResponse }>(
      API_ENDPOINTS.PROMOTIONS.LAUNCH_TRIAL_CLAIM,
      { jobPostId }
    );
    return response.data;
  }
}

export const promotionService = new PromotionService();











