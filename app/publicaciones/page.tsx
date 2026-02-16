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
  ClockIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import JobDetailModal from '@/components/JobDetailModal';

// ── Tipos del modal de confirmación ──
type ConfirmModalData = {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: 'red' | 'yellow' | 'green';
  onConfirm: () => void;
} | null;

export default function PublicacionesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [payingJobId, setPayingJobId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estado del modal de confirmación
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData>(null);

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

  // ── Pausar publicación ──
  const handlePause = (job: Job) => {
    setConfirmModal({
      title: 'Pausar publicación',
      message: `¿Estás seguro de pausar "${job.title || 'Sin título'}"? La publicación dejará de ser visible para los postulantes mientras esté pausada.`,
      confirmLabel: 'Pausar',
      confirmColor: 'yellow',
      onConfirm: async () => {
        try {
          setPausingId(job.id);
          setConfirmModal(null);
          await jobService.pauseJob(job.id);
          toast.success('Publicación pausada');
          loadJobs();
        } catch (error: any) {
          const msg = error?.response?.data?.message || 'Error al pausar publicación';
          toast.error(msg);
          console.error(error);
        } finally {
          setPausingId(null);
        }
      },
    });
  };

  // ── Reanudar publicación ──
  const handleResume = async (job: Job) => {
    try {
      setPausingId(job.id);
      await jobService.resumeJob(job.id);
      toast.success('Publicación reanudada');
      loadJobs();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al reanudar publicación';
      toast.error(msg);
      console.error(error);
    } finally {
      setPausingId(null);
    }
  };

  // ── Eliminar publicación ──
  const handleDelete = (job: Job) => {
    // Si está activa (no pausada ni expirada), primero hay que pausarla
    if (!canDeleteDirectly(job)) {
      setConfirmModal({
        title: 'Pausar antes de eliminar',
        message: `Para eliminar "${job.title || 'Sin título'}" primero tenés que pausarla. ¿Querés pausarla ahora?`,
        confirmLabel: 'Pausar primero',
        confirmColor: 'yellow',
        onConfirm: async () => {
          try {
            setPausingId(job.id);
            setConfirmModal(null);
            await jobService.pauseJob(job.id);
            toast.success('Publicación pausada. Ahora podés eliminarla.');
            loadJobs();
          } catch (error: any) {
            const msg = error?.response?.data?.message || 'Error al pausar publicación';
            toast.error(msg);
            console.error(error);
          } finally {
            setPausingId(null);
          }
        },
      });
      return;
    }

    setConfirmModal({
      title: 'Eliminar publicación',
      message: `¿Estás seguro de eliminar "${job.title || 'Sin título'}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      confirmColor: 'red',
      onConfirm: async () => {
        try {
          setDeletingId(job.id);
          setConfirmModal(null);
          await jobService.deleteJob(job.id);
          toast.success('Publicación eliminada');
          loadJobs();
        } catch (error: any) {
          toast.error('Error al eliminar publicación');
          console.error(error);
        } finally {
          setDeletingId(null);
        }
      },
    });
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

  const getStatusColor = (status: string, moderationStatus?: string, paymentStatus?: string, job?: Job) => {
    const statusUpper = status?.toUpperCase();

    // Pausado
    if (statusUpper === 'PAUSED') {
      return 'bg-amber-100 text-amber-800';
    }
    // Si el plan expiró, mostrar como expirado
    if (job && isJobExpired(job) && moderationStatus !== 'PENDING_PAYMENT' && paymentStatus !== 'PENDING') {
      return 'bg-red-100 text-red-800';
    }

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
      ACTIVE: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
      DRAFT: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
      CLOSED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string, moderationStatus?: string, paymentStatus?: string, job?: Job) => {
    const statusUpper = status?.toUpperCase();

    // Pausado
    if (statusUpper === 'PAUSED') {
      return 'Pausado';
    }
    // Si el plan expiró, mostrar como expirado
    if (job && isJobExpired(job) && moderationStatus !== 'PENDING_PAYMENT' && paymentStatus !== 'PENDING') {
      return 'Expirado';
    }

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
      ACTIVE: 'Activo',
      inactive: 'Inactivo',
      INACTIVE: 'Inactivo',
      draft: 'Borrador',
      DRAFT: 'Borrador',
      closed: 'Cerrado',
      CLOSED: 'Cerrado',
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
      (!job.isPaid && job.status?.toLowerCase() === 'inactive')
    );
  };

  const isJobPaused = (job: Job) => {
    return job.status?.toUpperCase() === 'PAUSED';
  };

  /**
   * Verifica si el plan de un job ha expirado
   */
  const isJobExpired = (job: Job): boolean => {
    const entitlement = job.entitlements?.find(
      (ent) => ent.status === 'ACTIVE' || ent.status === 'EXPIRED'
    );
    if (!entitlement) return false;

    if (entitlement.status === 'EXPIRED') return true;

    if (entitlement.expiresAt) {
      const expiresAt = new Date(entitlement.expiresAt);
      return expiresAt < new Date();
    }
    return false;
  };

  /**
   * Determina si se puede eliminar directamente: pausada o expirada
   */
  const canDeleteDirectly = (job: Job): boolean => {
    return isJobPaused(job) || isJobExpired(job);
  };

  /**
   * Determina si se puede pausar: activa, aprobada, con entitlement vigente
   */
  const canPauseJob = (job: Job): boolean => {
    if (isJobPaused(job)) return false;
    if (isJobExpired(job)) return false;
    if (isPendingPayment(job)) return false;
    if (job.moderationStatus === 'REJECTED' || job.moderationStatus === 'AUTO_REJECTED') return false;
    if (job.moderationStatus === 'PENDING') return false;
    // Solo se puede pausar si está activa y aprobada
    return job.status?.toLowerCase() === 'active' && job.moderationStatus === 'APPROVED';
  };

  /**
   * Calcula el tiempo restante del entitlement activo
   */
  const getRemainingTime = (job: Job): { text: string; isExpired: boolean; isUrgent: boolean } | null => {
    const entitlement = job.entitlements?.find(
      (ent) => ent.status === 'ACTIVE' || ent.status === 'EXPIRED'
    );
    if (!entitlement || !entitlement.expiresAt) return null;

    const now = new Date();
    const expiresAt = new Date(entitlement.expiresAt);
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) {
      const expiredMs = Math.abs(diffMs);
      const expiredDays = Math.floor(expiredMs / (1000 * 60 * 60 * 24));
      if (expiredDays === 0) {
        return { text: 'Expiró hoy', isExpired: true, isUrgent: false };
      }
      return {
        text: `Expiró hace ${expiredDays} día${expiredDays > 1 ? 's' : ''}`,
        isExpired: true,
        isUrgent: false,
      };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return {
        text: `Expira en ${days} día${days > 1 ? 's' : ''}`,
        isExpired: false,
        isUrgent: days <= 2,
      };
    }
    if (hours > 0) {
      return {
        text: `Expira en ${hours} hora${hours > 1 ? 's' : ''}`,
        isExpired: false,
        isUrgent: true,
      };
    }

    return { text: 'Expira en menos de 1 hora', isExpired: false, isUrgent: true };
  };

  /**
   * Determina si un job puede ser modificado según su JobPostEntitlement.
   */
  const canModifyJob = (
    job: Job
  ): { canModify: boolean; reason?: string; remainingModifications?: number; maxModifications?: number } => {
    const activeEntitlement = job.entitlements?.find(
      (ent) => ent.status === 'ACTIVE'
    );

    if (!activeEntitlement) {
      return {
        canModify: false,
        reason: 'Se necesita un plan activo para modificar esta publicación',
        remainingModifications: 0,
        maxModifications: 0,
      };
    }

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

    if (activeEntitlement.maxEdits === 0) {
      return {
        canModify: false,
        reason: 'Tu plan no permite modificaciones',
        remainingModifications: 0,
        maxModifications: 0,
      };
    }

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
                const jobPaused = isJobPaused(job);
                const jobExpired = isJobExpired(job);

                return (
                  <div
                    key={job.id}
                    onClick={() => handleViewJobDetail(job)}
                    className={`cursor-pointer overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow ${
                      jobPaused ? 'border-l-4 border-amber-400' : ''
                    }`}
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
                                job.paymentStatus,
                                job
                              )}`}
                            >
                              {getStatusLabel(
                                job.status || 'active',
                                job.moderationStatus,
                                job.paymentStatus,
                                job
                              )}
                            </span>
                          </div>

                          {/* Pausado info */}
                          {jobPaused && (
                            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                              <div className="flex items-start">
                                <PauseIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-amber-800">
                                    Publicación pausada
                                  </p>
                                  <p className="text-xs text-amber-700 mt-0.5">
                                    Esta publicación no es visible para los postulantes. Podés reanudarla o eliminarla.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

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

                          {/* Banner de plan expirado */}
                          {jobExpired && !jobNeedsPayment && !jobPaused && (
                            <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3">
                              <div className="flex items-start">
                                <ClockIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-800">
                                    Plan expirado
                                  </p>
                                  <p className="text-xs text-red-700 mt-0.5">
                                    El plan de esta publicación ha expirado. La publicación ya no es visible para los postulantes.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tiempo restante del plan activo */}
                          {(() => {
                            const remaining = getRemainingTime(job);
                            if (remaining && !remaining.isExpired && !jobPaused) {
                              return (
                                <div className={`mt-2 rounded-lg p-2 flex items-center gap-1.5 ${
                                  remaining.isUrgent ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'
                                }`}>
                                  <ClockIcon className={`h-4 w-4 ${remaining.isUrgent ? 'text-orange-500' : 'text-green-500'}`} />
                                  <span className="text-xs font-medium">{remaining.text}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}

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
                            {/* Ver postulantes (activa, no expirada ni pausada) */}
                            {!jobNeedsPayment && !jobExpired && !jobPaused && (
                              <Link
                                href={`/postulantes?jobId=${job.id}`}
                                className="rounded-md bg-[#002D5A] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#02345fb6]"
                              >
                                Ver Postulantes
                              </Link>
                            )}

                            {/* Pausar publicación */}
                            {canPauseJob(job) && (
                              <button
                                onClick={() => handlePause(job)}
                                disabled={pausingId === job.id}
                                className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                                title="Pausar publicación"
                              >
                                {pausingId === job.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
                                ) : (
                                  <>
                                    <PauseIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Pausar</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Reanudar publicación */}
                            {jobPaused && (
                              <button
                                onClick={() => handleResume(job)}
                                disabled={pausingId === job.id}
                                className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                title="Reanudar publicación"
                              >
                                {pausingId === job.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                ) : (
                                  <>
                                    <PlayIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Reanudar</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Renovar plan (expirado) */}
                            {jobExpired && !jobNeedsPayment && (
                              <>
                                <Link
                                  href="/planes"
                                  className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                  <ArrowPathIcon className="h-4 w-4" />
                                  Renovar Plan
                                </Link>
                                <Link
                                  href={`/postulantes?jobId=${job.id}`}
                                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  <UsersIcon className="h-4 w-4" />
                                </Link>
                              </>
                            )}

                            {/* Pagar */}
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

                            {/* Editar */}
                            {modificationInfo.canModify && !jobPaused ? (
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
                            ) : !jobPaused && !jobExpired ? (
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
                            ) : null}

                            {/* Eliminar */}
                            {!jobNeedsPayment && (
                              <button
                                onClick={() => handleDelete(job)}
                                disabled={deletingId === job.id || pausingId === job.id}
                                className="flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                title={canDeleteDirectly(job) ? 'Eliminar publicación' : 'Pausar y eliminar publicación'}
                              >
                                {deletingId === job.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                ) : (
                                  <>
                                    <TrashIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Eliminar</span>
                                  </>
                                )}
                              </button>
                            )}
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

      {/* ── Modal de Confirmación (reemplazo de confirm/alert) ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Icono */}
            <div className="flex justify-center pt-6">
              {confirmModal.confirmColor === 'red' && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              )}
              {confirmModal.confirmColor === 'yellow' && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <PauseIcon className="h-6 w-6 text-amber-600" />
                </div>
              )}
              {confirmModal.confirmColor === 'green' && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="px-6 pt-4 pb-2 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmModal.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {confirmModal.message}
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-colors ${
                  confirmModal.confirmColor === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmModal.confirmColor === 'yellow'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
