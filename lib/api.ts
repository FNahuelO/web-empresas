const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER_EMPRESA: '/api/auth/register-empresa',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh',
    ME: '/api/auth/me',
  },

  // Empresas
  EMPRESAS: {
    PROFILE: '/api/empresas/profile',
    UPDATE_PROFILE: '/api/empresas/profile',
    JOBS: '/api/empresas/jobs',
    CREATE_JOB: '/api/empresas/jobs',
    UPDATE_JOB: (id: string) => `/api/empresas/jobs/${id}`,
    DELETE_JOB: (id: string) => `/api/empresas/jobs/${id}`,
    APPLICANTS: (jobId: string) => `/api/empresas/jobs/${jobId}/applicants`,
    UPDATE_APPLICATION: (id: string) => `/api/empresas/applications/${id}`,
    GENERATE_JOB_DESCRIPTION: '/api/empresas/jobs/generate-description',
  },

  // Mensajes
  MESSAGES: {
    LIST: '/api/messages',
    SEND: '/api/messages',
    CONVERSATION: (userId: string) => `/api/messages/${userId}`,
    UNREAD_COUNT: '/api/messages/unread/count',
  },

  // Suscripciones
  SUBSCRIPTIONS: {
    CURRENT: '/api/subscriptions/current',
    CAN_CREATE_JOB: '/api/subscriptions/can-create-job',
  },

  // Planes
  PLANS: {
    LIST: '/api/plans',
  },

  // Catálogos
  CATALOGS: {
    GET: (lang?: string) => `/api/catalogs${lang ? `?lang=${lang}` : ''}`,
  },
} as const;

export { API_BASE_URL };

