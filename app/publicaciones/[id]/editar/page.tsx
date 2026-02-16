'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { Job } from '@/types';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
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
  schedule: string;
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

const JOB_SCHEDULES_FALLBACK = [
  { value: 'MANANA', label: 'Mañana' },
  { value: 'TARDE', label: 'Tarde' },
  { value: 'NOCHE', label: 'Noche' },
  { value: 'MANANA_TARDE', label: 'Mañana y Tarde' },
  { value: 'ROTATIVO', label: 'Rotativo' },
  { value: 'FLEXIBLE', label: 'Flexible' },
  { value: 'COMPLETO', label: 'Jornada Completa' },
];

export default function EditarPublicacionPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [entitlementInfo, setEntitlementInfo] = useState<{
    canModify: boolean;
    reason?: string;
    remaining?: number;
    max?: number;
  } | null>(null);
  const [scheduleOptions, setScheduleOptions] = useState<{ value: string; label: string }[]>(JOB_SCHEDULES_FALLBACK);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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
      schedule: '',
      minSalary: 0,
      maxSalary: 0,
    },
  });

  const selectedProvincia = watch('location');
  const minSalaryValue = watch('minSalary');
  const maxSalaryValue = watch('maxSalary');

  const formatSalary = (value: number): string => {
    if (!value || isNaN(value) || value === 0) return '';
    return value.toLocaleString('es-AR');
  };

  const handleSalaryChange = (field: 'minSalary' | 'maxSalary', rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, '');
    const num = parseInt(cleaned, 10);
    setValue(field, isNaN(num) ? 0 : num);
  };

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
    if (jobId) {
      loadJob();
    }
    loadCatalogs();
  }, [jobId]);

  const loadCatalogs = async () => {
    try {
      const response = await httpClient.get<{
        data: {
          jobSchedules?: Array<{ code: string; label: string }>;
        };
      }>(API_ENDPOINTS.CATALOGS.GET('es'));
      const data = response.data;
      if (data.jobSchedules && data.jobSchedules.length > 0) {
        setScheduleOptions(
          data.jobSchedules.map((s) => ({ value: s.code, label: s.label }))
        );
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const loadJob = async () => {
    setLoadingJob(true);
    try {
      const data = await jobService.getJobDetail(jobId);
      setJob(data);

      // Verificar entitlement
      const activeEntitlement = data.entitlements?.find(
        (ent) => ent.status === 'ACTIVE'
      );

      if (!activeEntitlement) {
        setEntitlementInfo({
          canModify: false,
          reason: 'Se necesita un plan activo para modificar esta publicación',
          remaining: 0,
          max: 0,
        });
      } else if (activeEntitlement.expiresAt && new Date(activeEntitlement.expiresAt) < new Date()) {
        setEntitlementInfo({
          canModify: false,
          reason: 'El plan de esta publicación ha expirado',
          remaining: 0,
          max: activeEntitlement.maxEdits,
        });
      } else if (activeEntitlement.maxEdits === 0) {
        setEntitlementInfo({
          canModify: false,
          reason: 'Tu plan no permite modificaciones',
          remaining: 0,
          max: 0,
        });
      } else {
        const editsUsed = activeEntitlement.editsUsed || 0;
        const remaining = activeEntitlement.maxEdits - editsUsed;
        if (remaining <= 0) {
          setEntitlementInfo({
            canModify: false,
            reason: `Ya usaste las ${activeEntitlement.maxEdits} modificaciones permitidas`,
            remaining: 0,
            max: activeEntitlement.maxEdits,
          });
        } else {
          setEntitlementInfo({
            canModify: true,
            remaining,
            max: activeEntitlement.maxEdits,
          });
        }
      }

      // Pre-llenar el formulario con los datos del job
      // Extraer provincia y localidad
      const provincia = data.provincia || data.location?.split(',').pop()?.trim() || '';
      const localidad = data.ciudad || '';

      reset({
        title: data.title || '',
        description: data.description || '',
        requirements: data.requirements || '',
        benefits: data.benefits || '',
        location: provincia,
        localidad: localidad,
        jobType: data.jobType || 'TIEMPO_COMPLETO',
        modality: data.workMode || data.modality || 'PRESENCIAL',
        category: data.category || '',
        experienceLevel: data.experienceLevel || 'JUNIOR',
        schedule: data.schedule || '',
        minSalary: data.salarioMin || data.minSalary || 0,
        maxSalary: data.salarioMax || data.maxSalary || 0,
      });
    } catch (error: any) {
      toast.error('Error al cargar la publicación');
      console.error(error);
      router.push('/publicaciones');
    } finally {
      setLoadingJob(false);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    if (!entitlementInfo?.canModify) {
      toast.error(entitlementInfo?.reason || 'No se puede modificar esta publicación');
      return;
    }

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
        ...(data.schedule ? { schedule: data.schedule } : {}),
      };

      // Asignar provincia y localidad
      jobData.state = provincia;
      if (localidad) jobData.city = localidad;

      if (data.minSalary > 0) jobData.minSalary = data.minSalary;
      if (data.maxSalary > 0) jobData.maxSalary = data.maxSalary;

      await jobService.updateJob(jobId, jobData);
      toast.success('¡Publicación actualizada exitosamente!');
      router.push('/publicaciones');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al actualizar la publicación';
      toast.error(msg);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingJob) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Publicación no encontrada
          </h3>
          <div className="mt-6">
            <Link
              href="/publicaciones"
              className="inline-flex items-center rounded-md bg-[#002D5A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#02345fb6]"
            >
              Volver a Publicaciones
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/publicaciones"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a Publicaciones
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Editar Publicación</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modifica los datos de tu oferta de empleo
          </p>
        </div>

        {/* Entitlement Info */}
        {entitlementInfo && (
          <>
            {entitlementInfo.canModify ? (
              <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Modificaciones disponibles
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Te quedan <strong>{entitlementInfo.remaining}</strong> de{' '}
                      <strong>{entitlementInfo.max}</strong> modificaciones permitidas por tu plan.
                      Cada vez que guardes cambios se descontará una modificación.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      No se puede modificar
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {entitlementInfo.reason}
                    </p>
                    <Link
                      href="/planes"
                      className="mt-2 inline-block text-xs font-semibold text-red-800 underline hover:text-red-900"
                    >
                      Ver planes disponibles
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Job Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-black">
          <fieldset disabled={!entitlementInfo?.canModify}>
            <div className="space-y-6">
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
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        disabled={!selectedProvincia || !entitlementInfo?.canModify}
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
                        className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="REMOTO">Remoto</option>
                        <option value="HIBRIDO">Híbrido</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">


                    <div>
                      <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700">
                        Nivel de Experiencia *
                      </label>
                      <select
                        id="experienceLevel"
                        {...register('experienceLevel', { required: 'El nivel de experiencia es requerido' })}
                        className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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

                    <div>
                      <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">
                        Horario
                      </label>
                      <select
                        id="schedule"
                        {...register('schedule')}
                        className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar horario</option>
                        {scheduleOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Categoría
                    </label>
                    <select
                      id="category"
                      {...register('category')}
                      className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar categoría</option>
                      {JOB_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700">
                        Salario Mínimo
                      </label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          id="minSalary"
                          placeholder="0"
                          value={formatSalary(minSalaryValue)}
                          onChange={(e) => handleSalaryChange('minSalary', e.target.value)}
                          className="block w-full bg-white rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                          type="text"
                          inputMode="numeric"
                          id="maxSalary"
                          placeholder="0"
                          value={formatSalary(maxSalaryValue)}
                          onChange={(e) => handleSalaryChange('maxSalary', e.target.value)}
                          className="block w-full bg-white rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="mt-1 block w-full bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            {entitlementInfo?.canModify && (
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-[#002D5A] px-6 py-2 text-sm font-semibold text-white hover:bg-[#02345fb6] disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

