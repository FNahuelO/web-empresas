'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { subscriptionService } from '@/services/subscriptionService';
import { Plan, Subscription } from '@/types';
import { CheckIcon } from '@heroicons/react/24/outline';
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
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription().catch(() => null),
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
    } catch (error: any) {
      toast.error('Error al cargar planes');
      console.error(error);
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
          <h1 className="text-3xl font-bold text-gray-900">Planes y Suscripciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        {subscription && subscription.subscription?.status === 'ACTIVE' && (
          <div className="rounded-lg bg-blue-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Plan Actual</h2>
            <p className="mt-1 text-sm text-gray-600">
              {subscription.planType === 'BASIC' && 'Plan Básico'}
              {subscription.planType === 'PREMIUM' && 'Plan Premium'}
              {subscription.planType === 'ENTERPRISE' && 'Plan Enterprise'}
            </p>
            {subscription.subscription?.endDate && (
              <p className="mt-1 text-sm text-gray-600">
                Renueva el {new Date(subscription.subscription.endDate).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlanCode === plan.code.toUpperCase();
            return (
              <div
                key={plan.id}
                className={`rounded-lg bg-white p-6 shadow ${
                  isCurrentPlan ? 'ring-2 ring-primary-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {isCurrentPlan && (
                    <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                      Actual
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-gray-600">/{plan.currency}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                      <span className="ml-3 text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Plan Actual
                    </button>
                  ) : (
                    <button className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                      Seleccionar Plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

