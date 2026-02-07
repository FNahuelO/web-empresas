import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import { Message, Conversation } from '@/types';

class MessageService {
  async getConversations(): Promise<Conversation[]> {
    const response = await httpClient.get<{ data: Conversation[] }>(API_ENDPOINTS.MESSAGES.LIST);
    return Array.isArray(response.data) ? response.data : [];
  }

  async getConversation(userId: string): Promise<Message[]> {
    const response = await httpClient.get<{ data: Message[] }>(
      API_ENDPOINTS.MESSAGES.CONVERSATION(userId)
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async sendMessage(toUserId: string, message: string): Promise<Message> {
    const response = await httpClient.post<{ data: Message }>(API_ENDPOINTS.MESSAGES.SEND, {
      toUserId,
      message,
    });
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await httpClient.get<{ data: { count: number } }>(
      API_ENDPOINTS.MESSAGES.UNREAD_COUNT
    );
    return response.data?.count ?? 0;
  }
}

export const messageService = new MessageService();

