import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import { Job, Application } from '@/types';

class JobService {
  async getCompanyJobs(): Promise<Job[]> {
    const response = await httpClient.get<{ data: Job[] }>(API_ENDPOINTS.EMPRESAS.JOBS);
    return response.data;
  }

  async getJobDetail(id: string): Promise<Job> {
    const response = await httpClient.get<{ data: Job }>(`/api/jobs/${id}`);
    return response.data;
  }

  async createJob(data: Partial<Job>): Promise<Job> {
    const response = await httpClient.post<{ data: Job }>(API_ENDPOINTS.EMPRESAS.CREATE_JOB, data);
    return response.data;
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    const response = await httpClient.put<{ data: Job }>(API_ENDPOINTS.EMPRESAS.UPDATE_JOB(id), data);
    return response.data;
  }

  async deleteJob(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.EMPRESAS.DELETE_JOB(id));
  }

  async getJobApplicants(jobId: string): Promise<Application[]> {
    const response = await httpClient.get<{ data: Application[] }>(
      API_ENDPOINTS.EMPRESAS.APPLICANTS(jobId)
    );
    return response.data;
  }

  async updateApplication(id: string, data: { status: string }): Promise<Application> {
    const response = await httpClient.put<{ data: Application }>(
      API_ENDPOINTS.EMPRESAS.UPDATE_APPLICATION(id),
      data
    );
    return response.data;
  }

  async generateJobDescription(data: {
    title: string;
    modality?: string;
    jobType?: string;
    location?: string;
  }): Promise<{ description: string }> {
    const response = await httpClient.post<{ data: { description: string } }>(
      API_ENDPOINTS.EMPRESAS.GENERATE_JOB_DESCRIPTION,
      data
    );
    return response.data;
  }
}

export const jobService = new JobService();

