'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { subscriptionService } from '@/services/subscriptionService';
import { paymentService } from '@/services/paymentService';
import { promotionService } from '@/services/promotionService';
import { Job, Plan, LaunchTrialStatus } from '@/types';
import toast from 'react-hot-toast';
import {
  CheckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import argentinaLocationsData from '@/data/argentina-locations.json';

interface Province {
  id: string;
  code: string;
  name: string;
}

interface Locality {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  municipalityId?: string;
  municipalityName?: string;
}

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  location: string;
  localidad: string;
  jobType: string;
  modality: string;
  category: string;
  experienceLevel: string;
  minSalary: number;
  maxSalary: number;
}

const JOB_CATEGORIES = [
  { value: 'COMERCIAL_VENTAS_NEGOCIOS', label: 'Comercial, Ventas y Negocios' },
  { value: 'ADMIN_CONTABILIDAD_FINANZAS', label: 'Administración, Contabilidad y Finanzas' },
  { value: 'PRODUCCION_MANUFACTURA', label: 'Producción y Manufactura' },
  { value: 'OFICIOS_Y_OTROS', label: 'Oficios y Otros' },
  { value: 'ABASTECIMIENTO_LOGISTICA', label: 'Abastecimiento y Logística' },
  { value: 'GASTRONOMIA_TURISMO', label: 'Gastronomía y Turismo' },
  { value: 'TECNOLOGIA_SISTEMAS_TELECOM', label: 'Tecnología, Sistemas y Telecomunicaciones' },
  { value: 'ATENCION_CLIENTE_CALLCENTER_TELEMARKETING', label: 'Atención al Cliente, Call Center y Telemarketing' },
  { value: 'SALUD_MEDICINA_FARMACIA', label: 'Salud, Medicina y Farmacia' },
  { value: 'INGENIERIAS', label: 'Ingenierías' },
  { value: 'RRHH_CAPACITACION', label: 'Recursos Humanos y Capacitación' },
  { value: 'MARKETING_PUBLICIDAD', label: 'Marketing y Publicidad' },
  { value: 'ING_CIVIL_CONSTRUCCION', label: 'Ingeniería Civil y Construcción' },
  { value: 'LEGALES', label: 'Legales' },
  { value: 'SECRETARIAS_RECEPCION', label: 'Secretarias y Recepción' },
  { value: 'DISENO', label: 'Diseño' },
  { value: 'ADUANA_COMERCIO_EXTERIOR', label: 'Aduana y Comercio Exterior' },
  { value: 'SEGUROS', label: 'Seguros' },
  { value: 'GERENCIA_DIRECCION_GENERAL', label: 'Gerencia y Dirección General' },
  { value: 'MINERIA_PETROLEO_GAS', label: 'Minería, Petróleo y Gas' },
  { value: 'DEPARTAMENTO_TECNICO', label: 'Departamento Técnico' },
  { value: 'EDUCACION_DOCENCIA_INVESTIGACION', label: 'Educación, Docencia e Investigación' },
  { value: 'COMUNICACION_RELACIONES_PUBLICAS', label: 'Comunicación, Relaciones Institucionales y Públicas' },
  { value: 'ENFERMERIA', label: 'Enfermería' },
  { value: 'NAVIERA_MARITIMA_PORTUARIA', label: 'Naviero, Marítimo, Portuario' },
];

const EXPERIENCE_LEVELS = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'SEMISENIOR', label: 'Semi Senior' },
  { value: 'SENIOR', label: 'Senior' },
];

type Step = 'form' | 'payment' | 'success';

export default function NuevaPublicacionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [createdJob, setCreatedJob] = useState<Job | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [promoStatus, setPromoStatus] = useState<LaunchTrialStatus | null>(null);
  const [promoSelected, setPromoSelected] = useState(false);
  const [claimingPromo, setClaimingPromo] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      benefits: '',
      location: '',
      localidad: '',
      jobType: 'TIEMPO_COMPLETO',
      modality: 'PRESENCIAL',
      category: '',
      experienceLevel: 'JUNIOR',
      minSalary: 0,
      maxSalary: 0,
    },
  });

  const selectedProvincia = watch('location');

  // Provincias ordenadas alfabéticamente
  const provinces = useMemo(() => {
    return [...(argentinaLocationsData.provinces as Province[])].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, []);

  // Localidades filtradas por provincia seleccionada
  const localities = useMemo(() => {
    if (!selectedProvincia) return [];
    const province = (argentinaLocationsData.provinces as Province[]).find(
      (p) => p.name === selectedProvincia
    );
    if (!province) return [];
    return (argentinaLocationsData.localities as Locality[])
      .filter(
        (loc) =>
          loc.provinceId === province.id ||
          loc.provinceName === province.name
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [selectedProvincia]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const [plansData, promoData] = await Promise.all([
        subscriptionService.getPlans(),
        promotionService.getLaunchTrialStatus().catch(() => null),
      ]);
      const plansArray = Array.isArray(plansData) ? plansData : [];
      // Filtrar solo planes activos y ordenar por precio
      const activePlans = plansArray
        .filter((p: any) => p.isActive !== false)
        .sort((a: Plan, b: Plan) => (a.order || 0) - (b.order || 0) || a.price - b.price);
      setPlans(activePlans);
      setPromoStatus(promoData);

      // Si hay promo disponible, preseleccionarla; sino seleccionar plan del medio
      if (promoData?.eligible && !promoData.alreadyUsed && promoData.windowOpen) {
        setPromoSelected(true);
        setSelectedPlan(null);
      } else if (activePlans.length > 0) {
        const midIndex = Math.floor(activePlans.length / 2);
        setSelectedPlan(activePlans[midIndex] || activePlans[0]);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    setIsLoading(true);
    try {
      const provincia = data.location.trim();
      const localidad = data.localidad?.trim() || '';
      const locationStr = localidad ? `${localidad}, ${provincia}` : provincia;

      const jobData: any = {
        title: data.title.trim(),
        description: data.description.trim(),
        requirements: data.requirements.trim(),
        benefits: data.benefits.trim(),
        location: locationStr,
        jobType: data.jobType,
        workMode: data.modality,
        experienceLevel: data.experienceLevel,
        ...(data.category ? { category: data.category } : {}),
      };

      // Asignar provincia y localidad
      jobData.state = provincia;
      if (localidad) jobData.city = localidad;

      if (data.minSalary > 0) jobData.minSalary = data.minSalary;
      if (data.maxSalary > 0) jobData.maxSalary = data.maxSalary;

      // Enviar planId si hay un plan seleccionado
      if (selectedPlan?.id) {
        jobData.planId = selectedPlan.id;
      }

      const job = await jobService.createJob(jobData);
      setCreatedJob(job);

      // Verificar si el empleo necesita pago
      if (job.moderationStatus === 'PENDING_PAYMENT' || job.paymentStatus === 'PENDING' || !job.isPaid) {
        setNeedsPayment(true);
        setStep('payment');
        toast.success('Publicación creada. Selecciona un plan y realiza el pago para publicarla.');
      } else {
        // El empleo fue creado directamente (plan PREMIUM/ENTERPRISE)
        setStep('success');
        toast.success('¡Publicación creada exitosamente!');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear publicación');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePaypalOrder = async (): Promise<string> => {
    if (!createdJob?.id) {
      throw new Error('No hay publicación creada');
    }

    setIsCreatingOrder(true);
    setPaymentError(null);

    try {
      const order = await paymentService.createJobPaymentOrder(createdJob.id);
      setPaypalOrderId(order.orderId);
      return order.orderId;
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al crear orden de pago';
      setPaymentError(msg);
      toast.error(msg);
      throw error;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaypalApprove = async (data: any) => {
    if (!createdJob?.id) return;

    setIsLoading(true);
    setPaymentError(null);

    try {
      const orderId = data.orderID || paypalOrderId;
      if (!orderId) {
        throw new Error('No se encontró el ID de la orden');
      }

      await paymentService.confirmJobPayment(createdJob.id, orderId);
      setStep('success');
      toast.success('¡Pago realizado! Tu publicación está siendo revisada.');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al confirmar el pago';
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaypalError = (error: any) => {
    console.error('PayPal error:', error);
    setPaymentError('Error en el proceso de pago. Por favor, intenta nuevamente.');
    toast.error('Error en PayPal. Intenta nuevamente.');
  };

  const handleClaimPromo = async () => {
    if (!createdJob?.id) return;
    try {
      setClaimingPromo(true);
      await promotionService.claimLaunchTrial(createdJob.id);
      toast.success('¡Promoción activada! Tu publicación ya está activa.');
      setStep('success');
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Error al activar la promoción';
      toast.error(msg);
    } finally {
      setClaimingPromo(false);
    }
  };

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Stepper indicator
  const steps = [
    { key: 'form', label: 'Datos del Empleo', icon: DocumentTextIcon },
    { key: 'payment', label: 'Pago', icon: CreditCardIcon },
    { key: 'success', label: 'Publicado', icon: CheckCircleIcon },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Publicación</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crea una nueva oferta de empleo
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((s, idx) => {
                const isCurrent = s.key === step;
                const isCompleted = idx < currentStepIndex;
                return (
                  <li
                    key={s.key}
                    className="relative flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            idx <= currentStepIndex ? 'bg-primary-600' : 'bg-gray-300'
                          }`}
                        />
                      )}
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                          isCompleted
                            ? 'bg-primary-600'
                            : isCurrent
                            ? 'border-2 border-primary-600 bg-white'
                            : 'border-2 border-gray-300 bg-white'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckIcon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                        ) : (
                          <s.icon
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${
                              isCurrent ? 'text-primary-600' : 'text-gray-400'
                            }`}
                          />
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium sm:text-sm ${
                        isCurrent
                          ? 'text-primary-600'
                          : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Step 1: Job Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-black">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Información Básica</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Título del Empleo *
                  </label>
                  <input
                    type="text"
                    id="title"
                    {...register('title', { required: 'El título es requerido' })}
                    className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Provincia *
                    </label>
                    <select
                      id="location"
                      {...register('location', { required: 'La provincia es requerida' })}
                      onChange={(e) => {
                        setValue('location', e.target.value);
                        setValue('localidad', '');
                      }}
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                      <option value="">Seleccionar provincia</option>
                      {provinces.map((province) => (
                        <option key={province.id} value={province.name}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="localidad" className="block text-sm font-medium text-gray-700">
                      Localidad
                    </label>
                    <select
                      id="localidad"
                      {...register('localidad')}
                      disabled={!selectedProvincia}
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {selectedProvincia ? 'Seleccionar localidad' : 'Primero seleccioná una provincia'}
                      </option>
                      {localities.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">
                      Tipo de Empleo
                    </label>
                    <select
                      id="jobType"
                      {...register('jobType')}
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                      <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                      <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="modality" className="block text-sm font-medium text-gray-700">
                      Modalidad
                    </label>
                    <select
                      id="modality"
                      {...register('modality')}
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="REMOTO">Remoto</option>
                      <option value="HIBRIDO">Híbrido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Categoría
                    </label>
                    <select
                      id="category"
                      {...register('category')}
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {JOB_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700">
                      Nivel de Experiencia *
                    </label>
                    <select
                      id="experienceLevel"
                      {...register('experienceLevel', { required: 'El nivel de experiencia es requerido' })}
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    {errors.experienceLevel && (
                      <p className="mt-1 text-sm text-red-600">{errors.experienceLevel.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700">
                      Salario Mínimo
                    </label>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        id="minSalary"
                        placeholder="0"
                        {...register('minSalary', { valueAsNumber: true, min: 0 })}
                        className="block w-full bg-white rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="maxSalary" className="block text-sm font-medium text-gray-700">
                      Salario Máximo
                    </label>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        id="maxSalary"
                        placeholder="0"
                        {...register('maxSalary', { valueAsNumber: true, min: 0 })}
                        className="block w-full bg-white rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Descripción</h2>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción del Empleo *
                </label>
                <textarea
                  id="description"
                  rows={8}
                  {...register('description', { required: 'La descripción es requerida' })}
                  className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Requisitos</h2>
              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                  Requisitos *
                </label>
                <textarea
                  id="requirements"
                  rows={6}
                  {...register('requirements', { required: 'Los requisitos son requeridos' })}
                  className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
                {errors.requirements && (
                  <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Beneficios</h2>
              <div>
                <label htmlFor="benefits" className="block text-sm font-medium text-gray-700">
                  Beneficios (Opcional)
                </label>
                <textarea
                  id="benefits"
                  rows={4}
                  {...register('benefits')}
                  className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Continuar'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && createdJob && (
          <div className="space-y-6">
            {/* Job Summary */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Resumen de la Publicación</h2>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Título:</span>
                  <span className="text-sm font-medium text-gray-900">{createdJob.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ubicación:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {createdJob.ciudad && createdJob.provincia
                      ? `${createdJob.ciudad}, ${createdJob.provincia}`
                      : createdJob.location || 'No especificada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    Pendiente de Pago
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona un Plan</h2>
              <p className="text-sm text-gray-500 mb-6">
                Elige el plan que mejor se adapte a tu publicación
              </p>

              {loadingPlans ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-lg border-2 border-gray-200 p-4">
                      <div className="h-5 w-2/3 rounded bg-gray-200 mb-2" />
                      <div className="h-3 w-full rounded bg-gray-100 mb-3" />
                      <div className="h-8 w-1/2 rounded bg-gray-200 mb-3" />
                      <div className="space-y-1">
                        <div className="h-3 w-3/4 rounded bg-gray-100" />
                        <div className="h-3 w-2/3 rounded bg-gray-100" />
                        <div className="h-3 w-1/2 rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (plans.length > 0 || (promoStatus?.eligible && !promoStatus.alreadyUsed)) ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Card de Promoción */}
                  {promoStatus?.promotion && promoStatus.eligible && !promoStatus.alreadyUsed && promoStatus.windowOpen && (
                    <div
                      onClick={() => {
                        setPromoSelected(true);
                        setSelectedPlan(null);
                      }}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                        promoSelected
                          ? 'border-green-500 bg-gradient-to-br from-green-600 to-emerald-700 ring-1 ring-green-500'
                          : 'border-green-300 bg-gradient-to-br from-green-600 to-emerald-700 hover:border-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GiftIcon className="h-4 w-4 text-white" />
                          <h3 className="text-base font-bold text-white">
                            {promoStatus.promotion.title}
                          </h3>
                        </div>
                        {promoSelected && (
                          <CheckIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-green-100">
                        {promoStatus.promotion.description}
                      </p>
                      <div className="mt-3">
                        <span className="text-2xl font-bold text-white">GRATIS</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-green-100">
                          ✓ {promoStatus.promotion.durationDays} días de publicación
                        </p>
                        <p className="text-xs text-green-100">✓ CVs ilimitados</p>
                        <p className="text-xs text-green-100">✓ Activación inmediata</p>
                        <p className="text-xs text-yellow-200 flex items-center gap-1">
                          <SparklesIcon className="h-3 w-3" /> Sin costo
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cards de planes */}
                  {plans.map((plan) => {
                    const isSelected = !promoSelected && selectedPlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          setSelectedPlan(plan);
                          setPromoSelected(false);
                        }}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                          {isSelected && (
                            <CheckIcon className="h-5 w-5 text-primary-600" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{plan.description || ''}</p>
                        <div className="mt-3">
                          <span className="text-2xl font-bold text-gray-900">
                            ${plan.price?.toFixed(2) || '0.00'}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            {plan.currency || 'USD'}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-600">
                            ✓ {plan.durationDays || 30} días de publicación
                          </p>
                          <p className="text-xs text-gray-600">
                            ✓ CVs ilimitados
                          </p>
                          {plan.allowedModifications > 0 && (
                            <p className="text-xs text-gray-600">
                              ✓ {plan.allowedModifications} modificaciones
                            </p>
                          )}
                          {plan.hasAIFeature && (
                            <p className="text-xs text-gray-600">
                              ✓ Generación IA de descripción
                            </p>
                          )}
                          {plan.hasFeaturedOption && (
                            <p className="text-xs text-gray-600">
                              ✓ Publicación destacada
                            </p>
                          )}
                          {plan.canModifyCategory && (
                            <p className="text-xs text-gray-600">
                              ✓ Cambio de categoría
                            </p>
                          )}
                          {(plan.features || []).map((feature, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              ✓ {feature}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-600">No hay planes disponibles</p>
                  <p className="mt-1 text-xs text-gray-500">
                    No se pudieron cargar los planes. Intenta nuevamente.
                  </p>
                  <button
                    type="button"
                    onClick={loadPlans}
                    className="mt-3 rounded-md bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>

            {/* Payment / Promo Activation Section */}
            {promoSelected && promoStatus?.promotion ? (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Activar Promoción</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Activá la promoción gratuita para publicar tu empleo sin costo
                </p>

                {/* Promo Summary */}
                <div className="mb-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <GiftIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {promoStatus.promotion.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {promoStatus.promotion.durationDays} días de publicación
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">GRATIS</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClaimPromo}
                  disabled={claimingPromo}
                  className={`w-full rounded-lg bg-green-600 py-3 text-sm font-bold text-white shadow transition-all hover:bg-green-700 ${
                    claimingPromo ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  {claimingPromo ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Activando promoción...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <SparklesIcon className="h-4 w-4" />
                      {promoStatus.promotion.metadata?.buttonText || 'Activar promoción gratuita'}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Pagar con PayPal</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Realiza el pago de forma segura con PayPal para publicar tu empleo
                </p>

                {/* Price Summary */}
                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPlan ? selectedPlan.name : 'Publicación de Empleo'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedPlan
                          ? `${selectedPlan.durationDays} días de publicación`
                          : 'Publicación estándar'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${selectedPlan?.price?.toFixed(2) || createdJob.paymentAmount?.toFixed(2) || '10.00'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedPlan?.currency || createdJob.paymentCurrency || 'USD'}
                      </p>
                    </div>
                  </div>
                </div>

                {paymentError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* PayPal Buttons */}
                {paypalClientId && paypalClientId !== 'YOUR_PAYPAL_CLIENT_ID_HERE' ? (
                  <PayPalScriptProvider
                    options={{
                      clientId: paypalClientId,
                      currency: createdJob.paymentCurrency || 'USD',
                      intent: 'capture',
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: 'vertical',
                        color: 'blue',
                        shape: 'rect',
                        label: 'pay',
                        height: 48,
                      }}
                      disabled={isLoading || isCreatingOrder}
                      createOrder={async () => {
                        return await handleCreatePaypalOrder();
                      }}
                      onApprove={async (data) => {
                        await handlePaypalApprove(data);
                      }}
                      onError={handlePaypalError}
                      onCancel={() => {
                        toast('Pago cancelado', { icon: '⚠️' });
                      }}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            PayPal no configurado
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Configura <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> en el archivo <code className="bg-yellow-100 px-1 rounded">.env.local</code> para habilitar los pagos con PayPal.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {needsPayment ? '¡Pago Realizado!' : '¡Publicación Creada!'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {needsPayment
                ? 'Tu publicación ha sido pagada y publicada exitosamente. Nuestro equipo la revisará para asegurar que cumple con nuestras políticas.'
                : 'Tu publicación ha sido creada y está siendo revisada. Te notificaremos cuando sea aprobada.'}
            </p>
            {createdJob && (
              <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left inline-block">
                <p className="text-sm text-gray-600">
                  <strong>Título:</strong> {createdJob.title}
                </p>
              </div>
            )}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => router.push('/publicaciones')}
                className="rounded-md bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Ver Mis Publicaciones
              </button>
              <button
                onClick={() => {
                  setStep('form');
                  setCreatedJob(null);
                  setNeedsPayment(false);
                  setPaypalOrderId(null);
                  setPaymentError(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Crear Otra Publicación
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
