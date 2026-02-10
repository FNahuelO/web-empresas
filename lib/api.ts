const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER_EMPRESA: '/api/auth/register-empresa',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
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
    // Pagos por publicación
    CREATE_JOB_PAYMENT: (jobId: string) => `/api/empresas/jobs/${jobId}/payment/create-order`,
    CONFIRM_JOB_PAYMENT: (jobId: string) => `/api/empresas/jobs/${jobId}/payment/confirm`,
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

  // Pagos
  PAYMENTS: {
    CREATE_ORDER: '/api/payments/create-order',
    CAPTURE_ORDER: (orderId: string) => `/api/payments/capture-order/${orderId}`,
    HISTORY: '/api/payments/history',
  },

  // Video Meetings
  VIDEO_MEETINGS: {
    LIST: '/api/video-meetings',
    CREATE: '/api/video-meetings',
    GET: (id: string) => `/api/video-meetings/${id}`,
    UPDATE: (id: string) => `/api/video-meetings/${id}`,
    ACCEPT: (id: string) => `/api/video-meetings/${id}/accept`,
    REJECT: (id: string) => `/api/video-meetings/${id}/reject`,
    CANCEL: (id: string) => `/api/video-meetings/${id}/cancel`,
    START: (id: string) => `/api/video-meetings/${id}/start`,
    COMPLETE: (id: string) => `/api/video-meetings/${id}/complete`,
    ICS: (id: string) => `/api/video-meetings/${id}/ics`,
  },

  // Google Meet / Calendar
  GOOGLE_MEET: {
    AUTH_URL: '/api/google-meet/auth-url',
    AUTHORIZE: '/api/google-meet/authorize',
    REFRESH_TOKEN: '/api/google-meet/refresh-token',
    STATUS: '/api/google-meet/status',
    DISCONNECT: '/api/google-meet/disconnect',
  },

  // Catálogos
  CATALOGS: {
    GET: (lang?: string) => `/api/catalogs${lang ? `?lang=${lang}` : ''}`,
  },

  // Opciones (sectores, tamaños de empresa, etc.)
  OPTIONS: {
    GET: (category: string, lang?: string) =>
      `/api/options/${category}${lang ? `?lang=${lang}` : ''}`,
  },
} as const;

export { API_BASE_URL };
