'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white via-80% to-[#6092cc]">
      {/* Fondo completo - cubre toda la pantalla */}
      <div className="absolute inset-0">
        <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-teal-200/50 animate-float-1" />
        <div className="absolute -bottom-8 left-16 w-[320px] h-[320px] rounded-full bg-cyan-200/30 animate-float-2" />
        <div className="absolute -bottom-20 right-[30%] w-[280px] h-[280px] rounded-full bg-teal-100/40 animate-float-3" />
        <div className="absolute -top-16 -left-16 w-[300px] h-[300px] rounded-full bg-cyan-100/20 animate-float-4" />
        <div className="absolute -top-20 right-[10%] w-[350px] h-[350px] rounded-full bg-teal-100/25 animate-float-5" />
        <div className="absolute top-[40%] -right-16 w-[280px] h-[280px] rounded-full bg-cyan-100/20 animate-float-6" />
        <div className="absolute top-[30%] left-[15%] w-[200px] h-[200px] rounded-full bg-teal-100/20 animate-float-7" />
        <div className="absolute -bottom-16 -right-16 w-[350px] h-[350px] rounded-full bg-teal-200/30 animate-float-8" />
      </div>

      {/* Branding izquierdo - sobre el fondo */}
      <div className="hidden lg:flex absolute inset-y-0 left-0 w-[40%] items-center justify-center px-12 z-10">
        <div className="text-left">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-secondary-900">Trabajo</span>
            <span className="text-primary-500">Ya</span>
          </h1>
          <p className="mt-3 text-gray-500 text-base">
            Publicá avisos y gestioná tus búsquedas de forma simple
          </p>
        </div>
      </div>

      {/* Tarjeta del formulario - flota encima del fondo */}
      <div className="relative z-20 min-h-screen flex items-center justify-center lg:justify-end lg:pr-[17%] px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-10 py-12">
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
        </div>
      </div>
    </div>
  );
}
