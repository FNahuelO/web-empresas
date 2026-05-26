'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

function parseFriendlyError(error: any): string {
  const message = error?.response?.data?.message || error?.message;
  const raw = Array.isArray(message) ? message[0] : String(message || '');
  const key = raw.split('|')[0];

  const friendlyMessages: Record<string, string> = {
    'validation.isUuid': 'El enlace de recuperación no es válido.',
    'validation.minLength': 'La contraseña debe tener al menos 8 caracteres.',
    'validation.isNotEmpty': 'Completá todos los campos.',
    'validation.isString': 'El valor ingresado no es válido.',
  };

  return friendlyMessages[key] || raw || 'No se pudo restablecer la contraseña.';
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token')?.trim() || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const isTokenMissing = useMemo(() => !token, [token]);

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('El enlace de recuperación no es válido.');
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      toast.error('Completá todos los campos.');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      await httpClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password,
      });

      setIsSuccess(true);
      toast.success('Contraseña restablecida correctamente.');
    } catch (error: any) {
      toast.error(parseFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white via-70% to-[#6092cc]/10" />

      <div className="absolute inset-0 z-0">
        <div className="absolute -bottom-24 -left-24 h-[420px] w-[420px] animate-float-1 rounded-full bg-teal-200/20" />
        <div className="absolute -bottom-8 left-16 h-[320px] w-[320px] animate-float-2 rounded-full bg-cyan-200/15" />
        <div className="absolute -bottom-20 right-[30%] h-[280px] w-[280px] animate-float-3 rounded-full bg-teal-100/15" />
        <div className="absolute -top-16 -left-16 h-[300px] w-[300px] animate-float-4 rounded-full bg-cyan-100/10" />
        <div className="absolute -top-20 right-[10%] h-[350px] w-[350px] animate-float-5 rounded-full bg-teal-100/10" />
        <div className="absolute top-[40%] -right-16 h-[280px] w-[280px] animate-float-6 rounded-full bg-cyan-100/10" />
      </div>

      <div className="hidden lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:w-[40%] lg:items-center lg:justify-center lg:px-12">
        <div className="text-left">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-[#033360]">Trabajo</span>
            <span className="text-[#19A23A]">Ya</span>
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Publicá avisos y gestioná tus búsquedas de forma simple
          </p>
        </div>
      </div>

      <div className="relative z-20 flex min-h-screen items-stretch justify-center lg:justify-end lg:pr-[17%]">
        <div className="flex w-full max-w-md flex-col justify-center gap-6 bg-white px-10 shadow-xl">
          <div className="mb-3 flex flex-col items-center">
            <Image src="/logo.png" alt="TrabajoYa" width={100} height={100} />
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>

              <div>
                <h2 className="mb-2 text-2xl font-bold text-secondary-900">
                  Contraseña actualizada
                </h2>
                <p className="text-sm leading-relaxed text-gray-500">
                  Ya podés volver a ingresar al portal de empresas con tu nueva contraseña.
                </p>
              </div>

              <p className="text-sm text-gray-400">
                Redirigiendo al login en {countdown} segundo{countdown !== 1 ? 's' : ''}...
              </p>

              <Link
                href="/login"
                className="w-full rounded-full bg-secondary-900 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-secondary-800"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          ) : isTokenMissing ? (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <KeyIcon className="h-8 w-8 text-amber-600" />
              </div>

              <div>
                <h2 className="mb-2 text-2xl font-bold text-secondary-900">Enlace inválido</h2>
                <p className="text-sm leading-relaxed text-gray-500">
                  No encontramos el token de recuperación. Volvé a solicitar el cambio de contraseña desde el portal de empresas.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3">
                <Link
                  href="/forgot-password"
                  className="w-full rounded-full bg-secondary-900 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-secondary-800"
                >
                  Solicitar nuevo enlace
                </Link>
                <Link
                  href="/login"
                  className="w-full rounded-full border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <KeyIcon className="h-7 w-7 text-blue-600" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-secondary-900">
                  Restablecé tu contraseña
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Ingresá una nueva contraseña para tu cuenta de empresa.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm text-gray-500">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Mínimo 8 caracteres.</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1 block text-sm text-gray-500">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      aria-label={
                        showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full bg-secondary-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-800 disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
                  </button>
                </div>
              </form>

              <Link
                href="/login"
                className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
