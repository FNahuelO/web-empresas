'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { subscriptionService } from '@/services/subscriptionService';
import { Job } from '@/types';
import toast from 'react-hot-toast';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  location: string;
  jobType: string;
  modality: string;
  minSalary: number;
  maxSalary: number;
}

export default function NuevaPublicacionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<JobFormData>({
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      benefits: '',
      location: '',
      jobType: 'TIEMPO_COMPLETO',
      modality: 'PRESENCIAL',
      minSalary: 0,
      maxSalary: 0,
    },
  });

  useEffect(() => {
    checkCanCreate();
  }, []);

  const checkCanCreate = async () => {
    try {
      const result = await subscriptionService.canCreateJob();
      setCanCreate(result.canCreate);
      if (!result.canCreate && !result.hasActiveSubscription) {
        toast.error('Necesitas un plan activo para publicar empleos');
        router.push('/planes');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    if (!canCreate) {
      toast.error('No puedes crear más empleos con tu plan actual');
      router.push('/planes');
      return;
    }

    setIsLoading(true);
    try {
      const jobData: any = {
        title: data.title.trim(),
        description: data.description.trim(),
        requirements: data.requirements.trim(),
        benefits: data.benefits.trim(),
        location: data.location.trim(),
        jobType: data.jobType,
        workMode: data.modality,
      };

      // Parsear ubicación
      const locationParts = data.location.split(',').map((p) => p.trim());
      if (locationParts[0]) jobData.city = locationParts[0];
      if (locationParts[1]) jobData.state = locationParts[1];

      if (data.minSalary > 0) jobData.minSalary = data.minSalary;
      if (data.maxSalary > 0) jobData.maxSalary = data.maxSalary;

      await jobService.createJob(jobData);
      toast.success('Publicación creada exitosamente');
      router.push('/publicaciones');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear publicación');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Publicación</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crea una nueva oferta de empleo
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Ubicación *
                </label>
                <input
                  type="text"
                  id="location"
                  placeholder="Ej: Buenos Aires, Argentina"
                  {...register('location', { required: 'La ubicación es requerida' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">
                    Tipo de Empleo
                  </label>
                  <select
                    id="jobType"
                    {...register('jobType')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  >
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="REMOTO">Remoto</option>
                    <option value="HIBRIDO">Híbrido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700">
                    Salario Mínimo
                  </label>
                  <input
                    type="number"
                    id="minSalary"
                    {...register('minSalary', { valueAsNumber: true, min: 0 })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="maxSalary" className="block text-sm font-medium text-gray-700">
                    Salario Máximo
                  </label>
                  <input
                    type="number"
                    id="maxSalary"
                    {...register('maxSalary', { valueAsNumber: true, min: 0 })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !canCreate}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear Publicación'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

