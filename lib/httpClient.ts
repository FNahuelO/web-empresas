import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './api';

// ── Utilidades para JWT ──────────────────────────────────────────────

/** Decodifica el payload de un JWT sin verificar la firma */
function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/** Verifica si un accessToken está por expirar (dentro de los próximos `marginMs` milisegundos) */
function isTokenExpiringSoon(token: string, marginMs = 60_000): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true; // sin exp → lo tratamos como expirado
  const expiresAt = payload.exp * 1000;
  return Date.now() >= expiresAt - marginMs;
}

// ── HttpClient con refresh robusto ───────────────────────────────────

type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

class HttpClient {
  private client: AxiosInstance;

  // ── Estado del refresh ──
  private isRefreshing = false;
  private failedQueue: QueueItem[] = [];
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
    this.scheduleProactiveRefresh();
    this.setupVisibilityListener();
  }

  // ── Cola de refresh ────────────────────────────────────────────────

  private processQueue(error: unknown, token: string | null = null) {
    this.failedQueue.forEach((item) => {
      if (error) {
        item.reject(error);
      } else {
        item.resolve(token!);
      }
    });
    this.failedQueue = [];
  }

  /** Ejecuta el refresh una sola vez; los demás consumidores esperan la misma promesa */
  private async doRefreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    // Guardar tokens nuevos
    localStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    // Programar el próximo refresh proactivo
    this.scheduleProactiveRefresh();

    return accessToken;
  }

  // ── Refresh proactivo ──────────────────────────────────────────────

  /** Programa un refresh automático antes de que expire el access token */
  private scheduleProactiveRefresh() {
    if (typeof window === 'undefined') return;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return;

    const expiresAt = payload.exp * 1000;
    // Refrescar 2 minutos antes de que expire (mínimo 10 segundos)
    const refreshIn = Math.max(expiresAt - Date.now() - 120_000, 10_000);

    this.refreshTimer = setTimeout(async () => {
      try {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.doRefreshToken();
          this.processQueue(null, newToken);
          this.isRefreshing = false;
        }
      } catch (err) {
        this.isRefreshing = false;
        // No redirigir aquí; el interceptor se encargará cuando falle un request real
        console.warn('[HttpClient] Proactive refresh failed, will retry on next request', err);
      }
    }, refreshIn);
  }

  // ── Listener de visibilidad ────────────────────────────────────────

  /** Cuando el usuario vuelve a la pestaña, verifica si necesita refresh */
  private setupVisibilityListener() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState !== 'visible') return;

      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      // Si no hay tokens, no hacer nada (ya está deslogueado)
      if (!accessToken && !refreshToken) return;

      // Si el access token expiró o está por expirar, refrescar
      if (!accessToken || isTokenExpiringSoon(accessToken, 120_000)) {
        if (refreshToken && !this.isRefreshing) {
          try {
            this.isRefreshing = true;
            const newToken = await this.doRefreshToken();
            this.processQueue(null, newToken);
          } catch (err) {
            console.warn('[HttpClient] Visibility refresh failed', err);
            this.processQueue(err, null);
          } finally {
            this.isRefreshing = false;
          }
        }
      } else {
        // Token aún válido, reprogramar el proactivo
        this.scheduleProactiveRefresh();
      }
    });
  }

  // ── Interceptors ───────────────────────────────────────────────────

  private setupInterceptors() {
    // Request interceptor - agregar token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - manejar refresh token con cola
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Solo intentar refresh en 401 que no sea un endpoint de auth
        const isAuthEndpoint =
          originalRequest.url?.includes('/api/auth/login') ||
          originalRequest.url?.includes('/api/auth/refresh');

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true;

          // Si ya hay un refresh en curso, encolar esta request
          if (this.isRefreshing) {
            return new Promise<string>((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((newToken) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.client(originalRequest);
            });
          }

          this.isRefreshing = true;

          try {
            const newToken = await this.doRefreshToken();

            // Resolver todas las requests encoladas
            this.processQueue(null, newToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh falló, rechazar toda la cola
            this.processQueue(refreshError, null);

            // Limpiar y redirigir a login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            if (this.refreshTimer) {
              clearTimeout(this.refreshTimer);
              this.refreshTimer = null;
            }

            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ── Métodos HTTP públicos ──────────────────────────────────────────

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const httpClient = new HttpClient();
