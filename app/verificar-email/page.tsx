'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { httpClient } from '@/lib/httpClient';

type VerifyState = 'loading' | 'success' | 'already_verified' | 'error' | 'no_token';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams?.get('token');

    const [state, setState] = useState<VerifyState>(token ? 'loading' : 'no_token');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(5);

    // Verificar automáticamente cuando hay token
    useEffect(() => {
        if (!token) return;

        const verifyEmail = async () => {
            try {
                const res = await httpClient.post<{
                    data: { message: string; alreadyVerified: boolean };
                }>('/api/auth/verify-email', { token });

                if (res.data?.alreadyVerified) {
                    setState('already_verified');
                    setMessage(res.data.message || 'Tu email ya está verificado.');
                } else {
                    setState('success');
                    setMessage(res.data?.message || 'Email verificado exitosamente.');
                }
            } catch (error: any) {
                setState('error');
                const apiMsg = error?.response?.data?.message;
                setMessage(
                    typeof apiMsg === 'string'
                        ? apiMsg
                        : 'No se pudo verificar el email. El enlace puede haber expirado.'
                );
            }
        };

        verifyEmail();
    }, [token]);

    // Countdown para redirección al login cuando la verificación fue exitosa
    useEffect(() => {
        if (state !== 'success' && state !== 'already_verified') return;

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
    }, [state, router]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-white">
            {/* Brillo de fondo */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white via-70% to-[#6092cc]/10" />

            {/* Círculos decorativos */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-teal-200/20 animate-float-1" />
                <div className="absolute -bottom-8 left-16 w-[320px] h-[320px] rounded-full bg-cyan-200/15 animate-float-2" />
                <div className="absolute -bottom-20 right-[30%] w-[280px] h-[280px] rounded-full bg-teal-100/15 animate-float-3" />
                <div className="absolute -top-16 -left-16 w-[300px] h-[300px] rounded-full bg-cyan-100/10 animate-float-4" />
                <div className="absolute -top-20 right-[10%] w-[350px] h-[350px] rounded-full bg-teal-100/10 animate-float-5" />
                <div className="absolute top-[40%] -right-16 w-[280px] h-[280px] rounded-full bg-cyan-100/10 animate-float-6" />
            </div>

            {/* Contenido central */}
            <div className="relative z-20 min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Logo */}
                    <div className="mb-6">
                        <Image
                            src="/logo.png"
                            alt="TrabajoYa"
                            width={80}
                            height={80}
                            className="mx-auto"
                        />
                    </div>

                    {/* Estado: Cargando */}
                    {state === 'loading' && (
                        <>
                            <div className="mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                                    <svg className="h-8 w-8 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
                                Verificando tu email...
                            </h1>
                            <p className="text-gray-500">
                                Por favor esperá un momento
                            </p>
                        </>
                    )}

                    {/* Estado: Éxito */}
                    {state === 'success' && (
                        <>
                            <div className="mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
                                ¡Email verificado!
                            </h1>
                            <p className="text-gray-500 mb-6">
                                {message}
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                Redirigiendo al login en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                            </p>
                            <Link
                                href="/login"
                                className="inline-block w-full rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                        </>
                    )}

                    {/* Estado: Ya verificado */}
                    {state === 'already_verified' && (
                        <>
                            <div className="mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                                    <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
                                Email ya verificado
                            </h1>
                            <p className="text-gray-500 mb-6">
                                {message}
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                Redirigiendo al login en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                            </p>
                            <Link
                                href="/login"
                                className="inline-block w-full rounded-full bg-secondary-900 px-6 py-3 text-sm font-semibold text-white hover:bg-secondary-800 transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                        </>
                    )}

                    {/* Estado: Error */}
                    {state === 'error' && (
                        <>
                            <div className="mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                                    <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
                                Error de verificación
                            </h1>
                            <p className="text-gray-500 mb-6">
                                {message}
                            </p>
                            <Link
                                href="/login"
                                className="inline-block w-full rounded-full bg-secondary-900 px-6 py-3 text-sm font-semibold text-white hover:bg-secondary-800 transition-colors"
                            >
                                Ir al login
                            </Link>
                        </>
                    )}

                    {/* Estado: Sin token */}
                    {state === 'no_token' && (
                        <>
                            <div className="mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                                    <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
                                Enlace inválido
                            </h1>
                            <p className="text-gray-500 mb-6">
                                No se encontró un token de verificación. Revisá tu email y hacé clic en el enlace de verificación.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block w-full rounded-full bg-secondary-900 px-6 py-3 text-sm font-semibold text-white hover:bg-secondary-800 transition-colors"
                            >
                                Ir al login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerificarEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}

