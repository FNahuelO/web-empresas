'use client';

import { useState } from 'react';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Ingresá tu email');
      return;
    }

    setIsLoading(true);

    try {
      await httpClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: email.trim().toLowerCase(),
      });
      setEmailSent(true);
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      const messageStr = typeof msg === 'string' ? msg : 'Error al enviar el email de recuperación';

      // Si es error de email no verificado
      const lower = messageStr.toLowerCase();
      if (
        lower.includes('verifica tu email') ||
        lower.includes('email not verified') ||
        lower.includes('antes de recuperar')
      ) {
        toast.error('Primero tenés que verificar tu email. Revisá tu bandeja de entrada.');
      } else {
        // Por seguridad el backend siempre devuelve éxito, pero por si acaso
        toast.error(messageStr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-white">
      {/* Brillo de fondo - degradado suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white via-70% to-[#6092cc]/10" />

      {/* Círculos decorativos */}
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

      {/* Tarjeta del formulario */}
      <div className="relative z-20 h-full flex items-stretch justify-center lg:justify-end lg:pr-[17%]">
        <div className="w-full max-w-md flex flex-col justify-center bg-white shadow-xl px-10 gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center mb-3">
            <Image
              src="/logo.png"
              alt="TrabajoYa"
              width={100}
              height={100}
            />
          </div>

          {emailSent ? (
            /* ── Estado: Email enviado ── */
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                  Revisá tu email
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Si existe una cuenta asociada a{' '}
                  <span className="font-semibold text-gray-700">{email}</span>,
                  te enviamos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full">
                <p className="text-sm text-amber-800">
                  <strong>Tip:</strong> Revisá también tu carpeta de spam o correo no deseado.
                  El enlace expira en 1 hora.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full pt-2">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Usar otro email
                </button>
                <Link
                  href="/login"
                  className="w-full rounded-full bg-secondary-900 px-6 py-3 text-sm font-semibold text-white hover:bg-secondary-800 transition-colors text-center"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            /* ── Estado: Formulario ── */
            <>
              {/* Ícono */}
              <div className="flex justify-center mb-1">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="h-7 w-7 text-blue-600" />
                </div>
              </div>

              {/* Título */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-secondary-900">
                  Recuperá tu contraseña
                </h2>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  Ingresá el email asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-500 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full bg-secondary-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-secondary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-900 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                </div>
              </form>

              {/* Volver al login */}
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2"
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

