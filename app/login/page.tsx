'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';

function parseFriendlyError(message: unknown): string {
  const fallback = 'Error al iniciar sesión';

  if (!message) return fallback;

  const raw = Array.isArray(message) ? message[0] : String(message);
  if (!raw) return fallback;

  const key = raw.split('|')[0]; // e.g. "validation.isEmail"

  const friendlyMessages: Record<string, string> = {
    'validation.isEmail': 'Ingresá un email válido',
    'validation.isNotEmpty': 'Completá todos los campos',
    'validation.isString': 'El valor ingresado no es válido',
    'validation.minLength': 'El valor ingresado es demasiado corto',
    'validation.maxLength': 'El valor ingresado es demasiado largo',
  };

  return friendlyMessages[key] || fallback;
}

/** Detecta si el mensaje de error corresponde a email no verificado */
function isEmailNotVerifiedError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('verifica tu email') ||
    lower.includes('email not verified') ||
    lower.includes('emailnotverified') ||
    lower.includes('verifica tu correo') ||
    lower.includes('email no verificado') ||
    lower.includes('email no está verificado') ||
    lower.includes('before logging in') ||
    lower.includes('antes de iniciar sesión')
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  // Estado del modal de email no verificado
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      router.push('/dashboard');
    } catch (error: any) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message || error?.message || '';
      const messageStr = Array.isArray(apiMessage) ? apiMessage[0] : String(apiMessage);

      // Verificar si es error de email no verificado
      if (isEmailNotVerifiedError(messageStr)) {
        setShowVerifyModal(true);
      } else if (status === 401) {
        toast.error('Email o contraseña incorrectos');
      } else {
        toast.error(parseFriendlyError(apiMessage));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast.error('Ingresá tu email en el formulario para reenviar la verificación');
      return;
    }

    setResendingEmail(true);
    try {
      await httpClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        email: email.trim().toLowerCase(),
      });
      toast.success('Email de verificación reenviado. Revisá tu bandeja de entrada.');
      setShowVerifyModal(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al reenviar el email de verificación';
      toast.error(typeof msg === 'string' ? msg : 'Error al reenviar el email de verificación');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-white">
      {/* Brillo de fondo - degradado suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white via-70% to-[#6092cc]/10" />

      {/* Círculos decorativos - por detrás de todo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-teal-200/20 animate-float-1" />
        <div className="absolute -bottom-8 left-16 w-[320px] h-[320px] rounded-full bg-cyan-200/15 animate-float-2" />
        <div className="absolute -bottom-20 right-[30%] w-[280px] h-[280px] rounded-full bg-teal-100/15 animate-float-3" />
        <div className="absolute -top-16 -left-16 w-[300px] h-[300px] rounded-full bg-cyan-100/10 animate-float-4" />
        <div className="absolute -top-20 right-[10%] w-[350px] h-[350px] rounded-full bg-teal-100/10 animate-float-5" />
        <div className="absolute top-[40%] -right-16 w-[280px] h-[280px] rounded-full bg-cyan-100/10 animate-float-6" />
        <div className="absolute top-[30%] left-[15%] w-[200px] h-[200px] rounded-full bg-teal-100/10 animate-float-7" />
        <div className="absolute -bottom-16 -right-16 w-[350px] h-[350px] rounded-full bg-teal-200/15 animate-float-8" />
      </div>

      {/* Branding izquierdo */}
      <div className="hidden lg:flex absolute inset-y-0 left-0 w-[40%] items-center justify-center px-12 z-10">
        <div className="text-left">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-[#033360]">Trabajo</span>
            <span className="text-[#19A23A]">Ya</span>
          </h1>
          <p className="mt-3 text-gray-500 text-base">
            Publicá avisos y gestioná tus búsquedas de forma simple
          </p>
        </div>
      </div>

      {/* Tarjeta del formulario - por encima de los círculos */}
      <div className="relative z-20 h-full flex items-stretch justify-center lg:justify-end lg:pr-[17%]">
        <div className="w-full max-w-md flex flex-col justify-center bg-white shadow-xl px-10 gap-8">
          {/* Icono + nombre */}
          <div className="flex flex-col items-center mb-5">
            <Image
              src="/logo.png"
              alt="TrabajoYa"
              width={120}
              height={120}
            />

          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900">Bienvenido</h2>
            <p className="mt-3 text-sm font-semibold text-gray-500">
              Inicia sesión para acceder al panel de administración
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-500 mb-1">
                Email o teléfono
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-500 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
              />
            </div>

            {/* Link olvidé mi contraseña */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-600 hover:underline font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-secondary-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-secondary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-900 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>
          </form>

          {/* Link a registro */}
          <p className="text-center text-sm text-gray-500">
            ¿No tenés una cuenta?{' '}
            <Link
              href="/registro"
              className="font-semibold text-primary-500 hover:underline"
            >
              Registrá tu empresa
            </Link>
          </p>

          {/* Links legales - requerido por verificación Google OAuth */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              Al iniciar sesión, aceptás nuestros{' '}
              <a
                href="https://web.trabajo-ya.com/public/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                Términos y Condiciones
              </a>{' '}
              y la{' '}
              <a
                href="https://web.trabajo-ya.com/public/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                Política de Privacidad
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal: Email no verificado ──────────────────────────────── */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowVerifyModal(false)}
          />

          {/* Contenido del modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in fade-in zoom-in duration-200">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Ícono */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="h-8 w-8 text-amber-600" />
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Email no verificado
            </h3>

            {/* Mensaje */}
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              Tu cuenta aún no fue verificada. Revisá tu bandeja de entrada y hacé clic en el enlace de verificación que te enviamos.
              Si no lo encontrás, podés reenviar el email.
            </p>

            {/* Botones */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="w-full rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {resendingEmail ? 'Reenviando...' : 'Reenviar email de verificación'}
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-full rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
