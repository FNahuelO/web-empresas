'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { subscriptionService } from '@/services/subscriptionService';
import { promotionService } from '@/services/promotionService';
import { jobService } from '@/services/jobService';
import { Plan, Subscription, LaunchTrialStatus, Job } from '@/types';
import {
  CheckIcon,
  SparklesIcon,
  StarIcon,
  DocumentPlusIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PlanesPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [promoStatus, setPromoStatus] = useState<LaunchTrialStatus | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingPromo, setClaimingPromo] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showJobSelector, setShowJobSelector] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData, promoData, jobsData] = await Promise.all([
        subscriptionService.getPlans().catch(() => []),
        subscriptionService.getCurrentSubscription().catch(() => null),
        promotionService.getLaunchTrialStatus().catch(() => null),
        jobService.getCompanyJobs().catch(() => []),
      ]);
      const plansArray = Array.isArray(plansData) ? plansData : [];
      const activePlans = plansArray
        .filter((p: any) => p.isActive !== false)
        .sort((a: Plan, b: Plan) => (a.order || 0) - (b.order || 0) || a.price - b.price);
      setPlans(activePlans);
      setSubscription(subscriptionData);
      setPromoStatus(promoData);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (error: any) {
      toast.error('Error al cargar planes');
      console.error(error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPromo = async () => {
    if (!selectedJobId) {
      toast.error('Seleccioná una publicación para aplicar la promoción');
      return;
    }

    try {
      setClaimingPromo(true);
      await promotionService.claimLaunchTrial(selectedJobId);
      toast.success('¡Promoción activada! Tu publicación ya está activa.');
      setSelectedJobId(null);
      setShowJobSelector(false);
      await loadData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Error al activar la promoción';
      toast.error(errorMessage);
    } finally {
      setClaimingPromo(false);
    }
  };

  const handlePromoClick = () => {
    const unpaid = jobs.filter(
      (job) => !job.isPaid && job.paymentStatus !== 'COMPLETED'
    );
    if (unpaid.length === 0) {
      toast('Primero creá una publicación para usar la promoción', { icon: '📝' });
      router.push('/publicaciones/nueva');
      return;
    }
    setShowJobSelector(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  const currentPlanCode = subscription?.planType?.toUpperCase();

  const unpaidJobs = jobs.filter(
    (job) => !job.isPaid && job.paymentStatus !== 'COMPLETED'
  );

  const showPromoCard =
    promoStatus?.promotion &&
    promoStatus.eligible &&
    !promoStatus.alreadyUsed;

  const promoUsed = promoStatus?.promotion && promoStatus.alreadyUsed;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes Disponibles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Conocé los planes disponibles para publicar tus ofertas de empleo
          </p>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            ¿Cómo funcionan los planes?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              Creá tu publicación de empleo con todos los detalles.
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              Seleccioná el plan que se ajuste a tus necesidades al momento de publicar.
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              Realizá el pago de forma segura con PayPal.
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              Tu publicación se publica inmediatamente y será revisada por nuestro equipo.
            </li>
          </ul>
        </div>

        {/* Current Plan */}
        {subscription && subscription.subscription?.status === 'ACTIVE' && (
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <StarIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Plan Actual</h2>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {subscription.planType === 'BASIC' && 'Plan Básico'}
              {subscription.planType === 'PREMIUM' && 'Plan Premium'}
              {subscription.planType === 'ENTERPRISE' && 'Plan Enterprise'}
            </p>
            {subscription.subscription?.endDate && (
              <p className="mt-1 text-sm text-gray-600">
                Renueva el{' '}
                {new Date(subscription.subscription.endDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        )}

        {/* Plans Grid (con promo como primera card si está disponible) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {/* ── Card de Promoción dentro del grid ── */}
          {showPromoCard && (
            <div className="relative rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 p-6 shadow transition-all hover:shadow-lg ring-2 ring-green-400">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow">
                  <GiftIcon className="h-3 w-3" />
                  Promoción
                </span>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {promoStatus!.promotion!.title}
                </h3>
              </div>
              <p className="mt-2 text-sm text-green-100">
                {promoStatus!.promotion!.description}
              </p>

              {/* Price */}
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">GRATIS</span>
                <p className="text-xs text-green-200 mt-1">
                  por publicación · {promoStatus!.promotion!.durationDays} días
                </p>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                  <span className="ml-3 text-sm text-green-100">
                    {promoStatus!.promotion!.durationDays} días de publicación
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                  <span className="ml-3 text-sm text-green-100">CVs ilimitados</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                  <span className="ml-3 text-sm text-green-100">Activación inmediata</span>
                </li>
                <li className="flex items-start">
                  <SparklesIcon className="h-5 w-5 flex-shrink-0 text-yellow-300" />
                  <span className="ml-3 text-sm text-green-100">Sin costo</span>
                </li>
              </ul>

              {/* Botón */}
              {promoStatus!.windowOpen ? (
                <button
                  onClick={handlePromoClick}
                  className="mt-6 w-full rounded-lg bg-white py-2.5 text-sm font-bold text-green-700 shadow transition-all hover:bg-green-50"
                >
                  {promoStatus!.promotion!.metadata?.buttonText || 'Activar prueba gratuita'}
                </button>
              ) : (
                <div className="mt-6 w-full rounded-lg bg-white/20 py-2.5 text-center">
                  <span className="text-sm font-semibold text-white/80">Próximamente</span>
                </div>
              )}
            </div>
          )}

          {/* Card de promo ya usada (gris, dentro del grid) */}
          {promoUsed && (
            <div className="relative rounded-lg bg-gray-100 p-6 shadow transition-all opacity-60">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-400 px-3 py-1 text-xs font-semibold text-white">
                  <CheckIcon className="h-3 w-3" />
                  Utilizada
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-500">
                {promoStatus!.promotion!.title}
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                {promoStatus!.promotion!.description}
              </p>

              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-400">GRATIS</span>
                <p className="text-xs text-gray-400 mt-1">
                  por publicación · {promoStatus!.promotion!.durationDays} días
                </p>
              </div>

              <div className="mt-6 w-full rounded-lg bg-gray-300 py-2.5 text-center">
                <span className="text-sm font-semibold text-gray-500">Ya utilizada</span>
              </div>
            </div>
          )}

          {/* Cards de planes */}
          {Array.isArray(plans) && plans.length > 0 ? (
            plans.map((plan, index) => {
              const isCurrentPlan = currentPlanCode === plan.code?.toUpperCase();
              const isPopular = index === Math.floor(plans.length / 2);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg bg-white p-6 shadow transition-all hover:shadow-lg ${
                    isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                        <SparklesIcon className="h-3 w-3" />
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name || 'Plan'}</h3>
                    {isCurrentPlan && (
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{plan.description || ''}</p>

                  {/* Price */}
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      {plan.currency || 'USD'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      por publicación · {plan.durationDays || 30} días
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                      <span className="ml-3 text-sm text-gray-600">
                        {plan.durationDays || 30} días de publicación
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                      <span className="ml-3 text-sm text-gray-600">CVs ilimitados</span>
                    </li>
                    {plan.allowedModifications > 0 && (
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                        <span className="ml-3 text-sm text-gray-600">
                          {plan.allowedModifications} modificaciones del aviso
                        </span>
                      </li>
                    )}
                    {plan.canModifyCategory && (
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                        <span className="ml-3 text-sm text-gray-600">
                          Cambio de categoría
                        </span>
                      </li>
                    )}
                    {plan.hasFeaturedOption && (
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                        <span className="ml-3 text-sm text-gray-600">
                          Publicación destacada
                        </span>
                      </li>
                    )}
                    {plan.hasAIFeature && (
                      <li className="flex items-start">
                        <SparklesIcon className="h-5 w-5 flex-shrink-0 text-purple-600" />
                        <span className="ml-3 text-sm text-gray-600">
                          Generación IA de descripciones
                        </span>
                      </li>
                    )}
                    {(plan.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                        <span className="ml-3 text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          ) : !showPromoCard && !promoUsed ? (
            <div className="col-span-full rounded-lg bg-white p-12 text-center shadow">
              <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No hay planes disponibles</p>
            </div>
          ) : null}
        </div>

        {/* CTA to create a publication */}
        <div className="flex justify-center pt-4">
          <Link
            href="/publicaciones/nueva"
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-primary-700 transition-colors"
          >
            <DocumentPlusIcon className="h-5 w-5" />
            Crear nueva publicación
          </Link>
        </div>
      </div>

      {/* ── Modal para seleccionar publicación ── */}
      {showJobSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccioná una publicación
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Elegí a qué publicación aplicar la promoción gratuita
              </p>
            </div>

            <div className="px-6 py-4 max-h-72 overflow-y-auto space-y-2">
              {unpaidJobs.map((job) => (
                <label
                  key={job.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                    selectedJobId === job.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="promoJobSelect"
                    value={job.id}
                    checked={selectedJobId === job.id}
                    onChange={() => setSelectedJobId(job.id)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {job.title || 'Sin título'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {job.ciudad && job.provincia
                        ? `${job.ciudad}, ${job.provincia}`
                        : job.location || 'Ubicación no especificada'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowJobSelector(false);
                  setSelectedJobId(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClaimPromo}
                disabled={claimingPromo || !selectedJobId}
                className={`flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-700 ${
                  claimingPromo || !selectedJobId ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                {claimingPromo ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Activando...
                  </span>
                ) : (
                  'Activar promoción'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
