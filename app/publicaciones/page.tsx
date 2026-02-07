'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { paymentService } from '@/services/paymentService';
import { Job } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  BriefcaseIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import JobDetailModal from '@/components/JobDetailModal';

export default function PublicacionesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingJobId, setPayingJobId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getCompanyJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Error al cargar publicaciones');
      console.error(error);
      setJobs([]);
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

  const handleCreatePaypalOrder = async (jobId: string): Promise<string> => {
    try {
      const order = await paymentService.createJobPaymentOrder(jobId);
      return order.orderId;
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al crear orden de pago';
      toast.error(msg);
      throw error;
    }
  };

  const handlePaypalApprove = async (jobId: string, data: any) => {
    setIsProcessingPayment(true);
    try {
      await paymentService.confirmJobPayment(jobId, data.orderID);
      toast.success('¡Pago realizado! La publicación está en revisión.');
      setPayingJobId(null);
      loadJobs();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al confirmar pago';
      toast.error(msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string, moderationStatus?: string, paymentStatus?: string) => {
    if (moderationStatus === 'PENDING_PAYMENT' || paymentStatus === 'PENDING') {
      return 'bg-orange-100 text-orange-800';
    }
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

  const getStatusLabel = (status: string, moderationStatus?: string, paymentStatus?: string) => {
    if (moderationStatus === 'PENDING_PAYMENT' || paymentStatus === 'PENDING') {
      return 'Pendiente de Pago';
    }
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

  const handleViewJobDetail = (job: Job) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const handleCloseJobDetail = () => {
    setShowDetailModal(false);
    setSelectedJob(null);
  };

  const isPendingPayment = (job: Job) => {
    return (
      job.moderationStatus === 'PENDING_PAYMENT' ||
      job.paymentStatus === 'PENDING' ||
      (!job.isPaid && job.status === 'inactive')
    );
  };

  /**
   * Determina si un job puede ser modificado según su JobPostEntitlement.
   * Lógica idéntica a la versión mobile (canModifyJob).
   */
  const canModifyJob = (
    job: Job
  ): { canModify: boolean; reason?: string; remainingModifications?: number; maxModifications?: number } => {
    // Obtener el entitlement activo de este job específico
    const activeEntitlement = job.entitlements?.find(
      (ent) => ent.status === 'ACTIVE'
    );

    // Si no hay entitlement activo para este job, no se puede modificar
    if (!activeEntitlement) {
      return {
        canModify: false,
        reason: 'Se necesita un plan activo para modificar esta publicación',
        remainingModifications: 0,
        maxModifications: 0,
      };
    }

    // Verificar si el entitlement ha expirado
    if (activeEntitlement.expiresAt) {
      const expiresAt = new Date(activeEntitlement.expiresAt);
      const now = new Date();
      if (expiresAt < now) {
        return {
          canModify: false,
          reason: 'El plan de esta publicación ha expirado',
          remainingModifications: 0,
          maxModifications: activeEntitlement.maxEdits,
        };
      }
    }

    // Si el entitlement no permite modificaciones (maxEdits === 0)
    if (activeEntitlement.maxEdits === 0) {
      return {
        canModify: false,
        reason: 'Tu plan no permite modificaciones',
        remainingModifications: 0,
        maxModifications: 0,
      };
    }

    // Calcular modificaciones restantes
    const editsUsed = activeEntitlement.editsUsed || 0;
    const remainingModifications = activeEntitlement.maxEdits - editsUsed;

    if (remainingModifications <= 0) {
      return {
        canModify: false,
        reason: `Ya usaste las ${activeEntitlement.maxEdits} modificaciones permitidas`,
        remainingModifications: 0,
        maxModifications: activeEntitlement.maxEdits,
      };
    }

    return {
      canModify: true,
      remainingModifications,
      maxModifications: activeEntitlement.maxEdits,
    };
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mis Publicaciones</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona todas tus ofertas de empleo
            </p>
          </div>
          <Link
            href="/publicaciones/nueva"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#002D5A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#02345fb6] sm:w-auto"
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
                className="inline-flex items-center rounded-md bg-[#002D5A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#02345fb6]"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Crear Publicación
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(jobs) &&
              jobs.map((job) => {
                const applicantsCount = job._count?.applications || 0;
                const publishedDate = job.publishedAt || job.fechaPublicacion;
                const jobNeedsPayment = isPendingPayment(job);
                const isPayingThis = payingJobId === job.id;
                const modificationInfo = canModifyJob(job);

                return (
                  <div
                    key={job.id}
                    onClick={() => handleViewJobDetail(job)}
                    className="cursor-pointer overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                              {job.title || 'Sin título'}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                                job.status || 'active',
                                job.moderationStatus,
                                job.paymentStatus
                              )}`}
                            >
                              {getStatusLabel(
                                job.status || 'active',
                                job.moderationStatus,
                                job.paymentStatus
                              )}
                            </span>
                          </div>

                          {/* Pending Payment Alert */}
                          {jobNeedsPayment && (
                            <div className="mt-2 rounded-lg bg-orange-50 border border-orange-200 p-3">
                              <div className="flex items-start">
                                <CreditCardIcon className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-orange-800">
                                    Pago pendiente
                                  </p>
                                  <p className="text-xs text-orange-700 mt-0.5">
                                    Esta publicación requiere pago para ser publicada.
                                    {job.paymentAmount && (
                                      <span className="font-semibold">
                                        {' '}Monto: ${job.paymentAmount.toFixed(2)} {job.paymentCurrency || 'USD'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {job.moderationStatus === 'REJECTED' && job.moderationReason && (
                            <div className="mt-2 rounded-lg bg-red-50 p-3">
                              <p className="text-xs font-semibold text-red-800">
                                Razón de rechazo:
                              </p>
                              <p className="text-xs text-red-700">{job.moderationReason}</p>
                            </div>
                          )}

                          {job.autoRejectionReason && job.moderationStatus === 'AUTO_REJECTED' && (
                            <div className="mt-2 rounded-lg bg-red-50 p-3">
                              <p className="text-xs font-semibold text-red-800">
                                Rechazado automáticamente:
                              </p>
                              <p className="text-xs text-red-700">{job.autoRejectionReason}</p>
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
                                Publicado{' '}
                                {formatDistanceToNow(new Date(publishedDate), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <UsersIcon className="h-4 w-4" />
                              <span>{applicantsCount} postulantes</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 md:ml-4 md:items-end" onClick={(e) => e.stopPropagation()}>
                          {/* Action buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            {!jobNeedsPayment && (
                              <Link
                                href={`/postulantes?jobId=${job.id}`}
                                className="rounded-md bg-[#002D5A] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#02345fb6]"
                              >
                                Ver Postulantes
                              </Link>
                            )}
                            {jobNeedsPayment && (
                              <button
                                onClick={() =>
                                  setPayingJobId(isPayingThis ? null : job.id)
                                }
                                className="flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700"
                              >
                                <CreditCardIcon className="h-4 w-4" />
                                {isPayingThis ? 'Cancelar' : 'Pagar Ahora'}
                              </button>
                            )}
                            {modificationInfo.canModify ? (
                              <div className="relative group">
                                <Link
                                  href={`/publicaciones/${job.id}/editar`}
                                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                                {modificationInfo.remainingModifications !== undefined && modificationInfo.maxModifications !== undefined && modificationInfo.maxModifications > 0 && (
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-10">
                                    <div className="whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                      {modificationInfo.remainingModifications}/{modificationInfo.maxModifications} {modificationInfo.remainingModifications === 1 ? 'modificación restante' : 'modificaciones restantes'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="relative group">
                                <button
                                  disabled
                                  className="rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-400 cursor-not-allowed inline-flex items-center gap-1"
                                >
                                  <LockClosedIcon className="h-3.5 w-3.5" />
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-10">
                                  <div className="w-56 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg text-center">
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                    {modificationInfo.reason}
                                    <Link href="/planes" className="block mt-1 text-blue-300 hover:text-blue-200 underline">
                                      Ver planes
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => handleDelete(job.id, job.title || '')}
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

                          {/* Inline PayPal Payment */}
                          {isPayingThis && paypalClientId && paypalClientId !== 'YOUR_PAYPAL_CLIENT_ID_HERE' && (
                            <div className="mt-3 w-full sm:w-72">
                              <PayPalScriptProvider
                                options={{
                                  clientId: paypalClientId,
                                  currency: job.paymentCurrency || 'USD',
                                  intent: 'capture',
                                }}
                              >
                                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                                  <p className="text-xs text-gray-500 mb-2 text-center">
                                    Pago: ${job.paymentAmount?.toFixed(2) || '10.00'}{' '}
                                    {job.paymentCurrency || 'USD'}
                                  </p>
                                  <PayPalButtons
                                    style={{
                                      layout: 'vertical',
                                      color: 'blue',
                                      shape: 'rect',
                                      label: 'pay',
                                      height: 40,
                                    }}
                                    disabled={isProcessingPayment}
                                    createOrder={async () => {
                                      return await handleCreatePaypalOrder(job.id);
                                    }}
                                    onApprove={async (data) => {
                                      await handlePaypalApprove(job.id, data);
                                    }}
                                    onError={(error) => {
                                      console.error('PayPal error:', error);
                                      toast.error('Error en PayPal');
                                    }}
                                    onCancel={() => {
                                      toast('Pago cancelado', { icon: '⚠️' });
                                    }}
                                  />
                                </div>
                              </PayPalScriptProvider>
                            </div>
                          )}

                          {isPayingThis && (!paypalClientId || paypalClientId === 'YOUR_PAYPAL_CLIENT_ID_HERE') && (
                            <div className="mt-3 w-full sm:w-72 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                              <div className="flex items-start">
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1.5 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-700">
                                  PayPal no configurado. Configura el Client ID en .env.local
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Modal de Detalle de Publicación */}
      {selectedJob && (
        <JobDetailModal
          visible={showDetailModal}
          job={selectedJob}
          onClose={handleCloseJobDetail}
        />
      )}
    </Layout>
  );
}
