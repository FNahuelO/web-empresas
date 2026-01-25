import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import { EmpresaProfile } from '@/types';

class ProfileService {
  async getEmpresaProfile(): Promise<EmpresaProfile> {
    const response = await httpClient.get<{ data: EmpresaProfile }>(
      API_ENDPOINTS.EMPRESAS.PROFILE
    );
    return response.data;
  }

  async updateEmpresaProfile(data: Partial<EmpresaProfile>): Promise<EmpresaProfile> {
    const response = await httpClient.put<{ data: EmpresaProfile }>(
      API_ENDPOINTS.EMPRESAS.UPDATE_PROFILE,
      data
    );
    return response.data;
  }
}

export const profileService = new ProfileService();

