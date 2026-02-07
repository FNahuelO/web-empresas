import { create } from 'zustand';
import { User, EmpresaProfile } from '@/types';
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

/** Carga el perfil de empresa y devuelve el companyName, o undefined si falla */
async function fetchCompanyName(): Promise<string | undefined> {
  try {
    const res = await httpClient.get<{ data: EmpresaProfile }>(API_ENDPOINTS.EMPRESAS.PROFILE);
    return res.data?.companyName;
  } catch {
    return undefined;
  }
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
          user: { id: string; email: string; tipo: string; verificado: boolean };
          accessToken: string;
          refreshToken: string;
        };
      }>(API_ENDPOINTS.AUTH.LOGIN, { email, password });

      const { user: userData, accessToken, refreshToken } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Obtener nombre de empresa
      const companyName = await fetchCompanyName();

      set({
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.tipo?.toUpperCase() as 'EMPRESA' | 'POSTULANTE',
          companyName,
        },
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
          user: { id: string; email: string; tipo: string; verificado: boolean };
          accessToken: string;
          refreshToken: string;
        };
      }>(API_ENDPOINTS.AUTH.REGISTER_EMPRESA, data);

      const { user: userData, accessToken, refreshToken } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }

      set({
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.tipo?.toUpperCase() as 'EMPRESA' | 'POSTULANTE',
          companyName: data.companyName,
        },
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
    const refreshToken = localStorage.getItem('refreshToken');

    // Si no hay ningún token, no hay sesión
    if (!accessToken && !refreshToken) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      // El interceptor de httpClient se encargará de refrescar el token
      // automáticamente si el accessToken expiró pero hay refreshToken
      const [meResponse, companyName] = await Promise.all([
        httpClient.get<{ data: { userId: string; email: string; userType: string } }>(API_ENDPOINTS.AUTH.ME),
        fetchCompanyName(),
      ]);

      const meData = meResponse.data;

      set({
        user: {
          id: meData.userId,
          email: meData.email,
          role: meData.userType as 'EMPRESA' | 'POSTULANTE',
          companyName,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Solo limpiar si realmente no se pudo recuperar la sesión
      // (el interceptor ya intentó hacer refresh y falló)
      const stillHasTokens = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
      if (!stillHasTokens) {
        // El interceptor ya limpió todo y redirigió
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } else {
        // Hubo un error de red u otro tipo, no borrar tokens
        // El usuario puede reintentar cuando vuelva la conexión
        set({
          isLoading: false,
        });
      }
    }
  },
}));
