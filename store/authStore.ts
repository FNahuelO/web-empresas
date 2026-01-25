import { create } from 'zustand';
import { User } from '@/types';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  phone?: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await httpClient.post<{
        data: {
          user: User;
          accessToken: string;
          refreshToken: string;
        };
      }>(API_ENDPOINTS.AUTH.LOGIN, { email, password });

      const { user, accessToken, refreshToken } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const response = await httpClient.post<{
        data: {
          user: User;
          accessToken: string;
          refreshToken: string;
        };
      }>(API_ENDPOINTS.AUTH.REGISTER_EMPRESA, data);

      const { user, accessToken, refreshToken } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    if (typeof window === 'undefined') return;
    
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await httpClient.get<{ data: User }>(API_ENDPOINTS.AUTH.ME);
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

