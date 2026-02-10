'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { videoMeetingService } from '@/services/videoMeetingService';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function GoogleCalendarCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(
        error === 'access_denied'
          ? 'Acceso denegado. No se otorgaron los permisos necesarios para Google Calendar.'
          : `Error de autenticación: ${error}`
      );
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No se recibió el código de autorización de Google.');
      return;
    }

    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      await videoMeetingService.authorizeGoogle(code, redirectUri);
      setStatus('success');

      // Volver a la página anterior después de 2 segundos
      setTimeout(() => {
        const returnUrl = localStorage.getItem('googleCalendarReturnUrl');
        localStorage.removeItem('googleCalendarReturnUrl');
        router.push(returnUrl || '/configuracion');
      }, 2000);
    } catch (err: any) {
      console.error('Error authorizing Google Calendar:', err);
      setStatus('error');
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Error al conectar con Google Calendar'
      );
    }
  };

  const handleRetry = () => {
    const returnUrl = localStorage.getItem('googleCalendarReturnUrl');
    localStorage.removeItem('googleCalendarReturnUrl');
    router.push(returnUrl || '/configuracion');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">Conectando Google Calendar...</h2>
            <p className="mt-2 text-sm text-gray-500">
              Estamos vinculando tu cuenta de Google Calendar. Por favor espera un momento.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Google Calendar conectado
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Ahora los eventos de videollamada se crearán automáticamente en tu Google Calendar y
              en el del postulante.
            </p>
            <p className="mt-4 text-xs text-gray-400">Redirigiendo...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircleIcon className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">Error al conectar</h2>
            <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-6 rounded-lg bg-[#002D5A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#003d7a] transition-colors"
            >
              Volver e intentar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

