'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { subscriptionService } from '@/services/subscriptionService';
import { Plan, Subscription } from '@/types';
import {
  CheckIcon,
  SparklesIcon,
  StarIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        subscriptionService.getPlans().catch(() => []),
        subscriptionService.getCurrentSubscription().catch(() => null),
      ]);
      const plansArray = Array.isArray(plansData) ? plansData : [];
      const activePlans = plansArray
        .filter((p: any) => p.isActive !== false)
        .sort((a: Plan, b: Plan) => (a.order || 0) - (b.order || 0) || a.price - b.price);
      setPlans(activePlans);
      setSubscription(subscriptionData);
    } catch (error: any) {
      toast.error('Error al cargar planes');
      console.error(error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
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

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
          ) : (
            <div className="col-span-full rounded-lg bg-white p-12 text-center shadow">
              <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No hay planes disponibles</p>
            </div>
          )}
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
    </Layout>
  );
}
