'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { Job } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function PublicacionesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getCompanyJobs();
      setJobs(data);
    } catch (error: any) {
      toast.error('Error al cargar publicaciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${title}"?`)) return;

    try {
      setDeletingId(id);
      await jobService.deleteJob(id);
      toast.success('Publicación eliminada');
      loadJobs();
    } catch (error: any) {
      toast.error('Error al eliminar publicación');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string, moderationStatus?: string) => {
    if (moderationStatus) {
      const colors: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        AUTO_REJECTED: 'bg-red-100 text-red-800',
      };
      return colors[moderationStatus] || 'bg-gray-100 text-gray-800';
    }

    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string, moderationStatus?: string) => {
    if (moderationStatus) {
      const labels: Record<string, string> = {
        PENDING: 'En Revisión',
        APPROVED: 'Aprobado',
        REJECTED: 'Rechazado',
        AUTO_REJECTED: 'Rechazado',
      };
      return labels[moderationStatus] || moderationStatus;
    }

    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador',
      closed: 'Cerrado',
    };
    return labels[status] || status;
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Publicaciones</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona todas tus ofertas de empleo
            </p>
          </div>
          <Link
            href="/publicaciones/nueva"
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Publicación
          </Link>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No tienes publicaciones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primera oferta de empleo
            </p>
            <div className="mt-6">
              <Link
                href="/publicaciones/nueva"
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Crear Publicación
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const applicantsCount = job._count?.applications || 0;
              const publishedDate = job.publishedAt || job.fechaPublicacion;

              return (
                <div
                  key={job.id}
                  className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title || job.titulo || 'Sin título'}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              job.status || 'active',
                              job.moderationStatus
                            )}`}
                          >
                            {getStatusLabel(job.status || 'active', job.moderationStatus)}
                          </span>
                        </div>

                        {job.moderationStatus === 'REJECTED' && job.moderationReason && (
                          <div className="mt-2 rounded-lg bg-red-50 p-3">
                            <p className="text-xs font-semibold text-red-800">
                              Razón de rechazo:
                            </p>
                            <p className="text-xs text-red-700">{job.moderationReason}</p>
                          </div>
                        )}

                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            {job.ciudad && job.provincia
                              ? `${job.ciudad}, ${job.provincia}`
                              : job.location || 'Ubicación no especificada'}
                          </p>
                          {publishedDate && (
                            <p className="text-xs text-gray-400">
                              Publicado {formatDistanceToNow(new Date(publishedDate), { addSuffix: true, locale: es })}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <UsersIcon className="h-4 w-4" />
                            <span>{applicantsCount} postulantes</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-2">
                        <Link
                          href={`/publicaciones/${job.id}/postulantes`}
                          className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                          Ver Postulantes
                        </Link>
                        <Link
                          href={`/publicaciones/${job.id}/editar`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(job.id, job.title || job.titulo || '')}
                          disabled={deletingId === job.id}
                          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === job.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

