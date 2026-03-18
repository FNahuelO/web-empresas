import { create } from 'zustand';
import { User, EmpresaProfile } from '@/types';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_SNAPSHOT_KEY = 'authUserSnapshot';

interface PersistedUserSnapshot {
  version: 1;
  savedAt: number;
  user: User;
}

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
  // Información de la empresa
  companyName: string;
  razonSocial: string;
  condicionFiscal: string;
  documento: string;
  cuit?: string;
  provincia: string;
  localidad: string;
  ciudad: string;
  calle: string;
  numero: string;
  codigoPostal: string;
  phoneCountryCode: string;
  telefono: string;
  industria: string;
  cantidadEmpleados: string;
  contribuyenteIngresosBrutos: boolean;
  // Información del usuario
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  passwordConfirm: string;
  // Términos
  aceptaTerminos: boolean;
}

function safeStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Evita romper la app por errores de storage (modo privado/cuota)
  }
}

function safeStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Sin acción: la limpieza de storage no debe romper la sesión en memoria
  }
}

function persistUserSnapshot(user: User): void {
  const payload: PersistedUserSnapshot = {
    version: 1,
    savedAt: Date.now(),
    user,
  };
  safeStorageSet(USER_SNAPSHOT_KEY, JSON.stringify(payload));
}

function clearAuthSnapshot(): void {
  safeStorageRemove(USER_SNAPSHOT_KEY);
}

function isValidUser(value: unknown): value is User {
  const candidate = value as User;
  return Boolean(
    candidate &&
      typeof candidate.id === 'string' &&
      candidate.id.trim() &&
      typeof candidate.email === 'string' &&
      candidate.email.trim() &&
      (candidate.role === 'EMPRESA' || candidate.role === 'POSTULANTE')
  );
}

function getPersistedUserSnapshot(): User | null {
  const raw = safeStorageGet(USER_SNAPSHOT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedUserSnapshot;
    if (parsed?.version !== 1 || !isValidUser(parsed.user)) {
      clearAuthSnapshot();
      return null;
    }
    return parsed.user;
  } catch {
    clearAuthSnapshot();
    return null;
  }
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

function getInitialAuthState(): Pick<AuthState, 'user' | 'isAuthenticated'> {
  const hasAccessToken = Boolean(safeStorageGet(ACCESS_TOKEN_KEY));
  const hasRefreshToken = Boolean(safeStorageGet(REFRESH_TOKEN_KEY));
  const hasSessionToken = hasAccessToken || hasRefreshToken;
  const persistedUser = getPersistedUserSnapshot();

  if (!hasSessionToken) {
    clearAuthSnapshot();
    return { user: null, isAuthenticated: false };
  }

  if (persistedUser) {
    return { user: persistedUser, isAuthenticated: true };
  }

  return { user: null, isAuthenticated: false };
}

const initialState = getInitialAuthState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialState.user,
  isAuthenticated: initialState.isAuthenticated,
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
      }>(API_ENDPOINTS.AUTH.LOGIN, { email, password, source: 'web-empresas' });

      const { user: userData, accessToken, refreshToken } = response.data;

      safeStorageSet(ACCESS_TOKEN_KEY, accessToken);
      safeStorageSet(REFRESH_TOKEN_KEY, refreshToken);

      // Obtener nombre de empresa
      const companyName = await fetchCompanyName();
      const normalizedUser: User = {
        id: userData.id,
        email: userData.email,
        role: userData.tipo?.toUpperCase() as 'EMPRESA' | 'POSTULANTE',
        companyName,
      };
      persistUserSnapshot(normalizedUser);

      set({
        user: normalizedUser,
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

      safeStorageSet(ACCESS_TOKEN_KEY, accessToken);
      safeStorageSet(REFRESH_TOKEN_KEY, refreshToken);
      const normalizedUser: User = {
        id: userData.id,
        email: userData.email,
        role: userData.tipo?.toUpperCase() as 'EMPRESA' | 'POSTULANTE',
        companyName: data.companyName,
      };
      persistUserSnapshot(normalizedUser);

      set({
        user: normalizedUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    safeStorageRemove(ACCESS_TOKEN_KEY);
    safeStorageRemove(REFRESH_TOKEN_KEY);
    clearAuthSnapshot();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    if (typeof window === 'undefined') return;

    const accessToken = safeStorageGet(ACCESS_TOKEN_KEY);
    const refreshToken = safeStorageGet(REFRESH_TOKEN_KEY);

    // Si no hay ningún token, no hay sesión
    if (!accessToken && !refreshToken) {
      clearAuthSnapshot();
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
      const normalizedUser: User = {
        id: meData.userId,
        email: meData.email,
        role: meData.userType as 'EMPRESA' | 'POSTULANTE',
        companyName,
      };
      persistUserSnapshot(normalizedUser);

      set({
        user: normalizedUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Solo limpiar si realmente no se pudo recuperar la sesión
      // (el interceptor ya intentó hacer refresh y falló)
      const stillHasTokens = safeStorageGet(ACCESS_TOKEN_KEY) || safeStorageGet(REFRESH_TOKEN_KEY);
      if (!stillHasTokens) {
        // El interceptor ya limpió todo y redirigió
        clearAuthSnapshot();
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
