import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import { VideoMeeting, CreateVideoMeetingRequest, UpdateVideoMeetingRequest } from '@/types';

class VideoMeetingService {
  // ── Video Meetings ────────────────────────────────────────────────

  async getMeetings(): Promise<VideoMeeting[]> {
    const response = await httpClient.get<{ data: VideoMeeting[] }>(
      API_ENDPOINTS.VIDEO_MEETINGS.LIST
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async getMeeting(id: string): Promise<VideoMeeting> {
    const response = await httpClient.get<{ data: VideoMeeting }>(
      API_ENDPOINTS.VIDEO_MEETINGS.GET(id)
    );
    return response.data;
  }

  async createMeeting(data: CreateVideoMeetingRequest): Promise<VideoMeeting> {
    const response = await httpClient.post<{ data: VideoMeeting }>(
      API_ENDPOINTS.VIDEO_MEETINGS.CREATE,
      data
    );
    return response.data;
  }

  async updateMeeting(id: string, data: UpdateVideoMeetingRequest): Promise<VideoMeeting> {
    const response = await httpClient.patch<{ data: VideoMeeting }>(
      API_ENDPOINTS.VIDEO_MEETINGS.UPDATE(id),
      data
    );
    return response.data;
  }

  async acceptMeeting(id: string): Promise<VideoMeeting> {
    const response = await httpClient.patch<{ data: VideoMeeting }>(
      API_ENDPOINTS.VIDEO_MEETINGS.ACCEPT(id)
    );
    return response.data;
  }

  async rejectMeeting(id: string): Promise<VideoMeeting> {
    const response = await httpClient.patch<{ data: VideoMeeting }>(
      API_ENDPOINTS.VIDEO_MEETINGS.REJECT(id)
    );
    return response.data;
  }

  async cancelMeeting(id: string): Promise<VideoMeeting> {
    const response = await httpClient.patch<{ data: VideoMeeting }>(
      API_ENDPOINTS.VIDEO_MEETINGS.CANCEL(id)
    );
    return response.data;
  }

  async completeMeeting(id: string): Promise<VideoMeeting> {
    const response = await httpClient.patch<{ data: VideoMeeting }>(
      API_ENDPOINTS.VIDEO_MEETINGS.COMPLETE(id)
    );
    return response.data;
  }

  // ── Google Calendar / Meet ────────────────────────────────────────

  async getGoogleCalendarStatus(): Promise<{ connected: boolean }> {
    const response = await httpClient.get<{ data: { connected: boolean } }>(
      API_ENDPOINTS.GOOGLE_MEET.STATUS
    );
    return response.data;
  }

  async getGoogleAuthUrl(redirectUri?: string): Promise<{ authUrl: string }> {
    const params = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const response = await httpClient.get<{ data: { authUrl: string } }>(
      API_ENDPOINTS.GOOGLE_MEET.AUTH_URL + params
    );
    return response.data;
  }

  async authorizeGoogle(code: string, redirectUri?: string): Promise<{ connected: boolean }> {
    const response = await httpClient.post<{ data: { connected: boolean } }>(
      API_ENDPOINTS.GOOGLE_MEET.AUTHORIZE,
      { code, redirectUri }
    );
    return response.data;
  }

  async disconnectGoogleCalendar(): Promise<void> {
    await httpClient.post(API_ENDPOINTS.GOOGLE_MEET.DISCONNECT);
  }
}

export const videoMeetingService = new VideoMeetingService();

