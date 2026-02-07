'use client';

import { Job } from '@/types';
import {
  XMarkIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  HomeModernIcon,
  UsersIcon,
  PencilIcon,
  CheckCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useRef } from 'react';

interface JobDetailModalProps {
  visible: boolean;
  job: Job;
  onClose: () => void;
}

export default function JobDetailModal({ visible, job, onClose }: JobDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const titulo = job.title || 'Sin título';
  const descripcion = job.description || 'Sin descripción';
  const requisitos = job.requirements || '';
  const beneficios = job.benefits || '';

  const getLocation = () => {
    if (job.ciudad && job.provincia) return `${job.ciudad}, ${job.provincia}`;
    if (job.location) return job.location;
    return 'Ubicación no especificada';
  };

  const getModalidad = () => {
    if (job.modality || job.workMode) {
      const value = job.modality || job.workMode || '';
      const modalidades: Record<string, string> = {
        presencial: 'Presencial',
        remoto: 'Remoto',
        hibrido: 'Híbrido',
        PRESENCIAL: 'Presencial',
        REMOTO: 'Remoto',
        HIBRIDO: 'Híbrido',
      };
      return modalidades[value] || value;
    }
    return null;
  };

  const getTipoEmpleo = () => {
    const value = job.jobType || '';
    const tipos: Record<string, string> = {
      TIEMPO_COMPLETO: 'Tiempo Completo',
      MEDIO_TIEMPO: 'Medio Tiempo',
      FREELANCE: 'Freelance',
      REMOTO: 'Remoto',
      HIBRIDO: 'Híbrido',
      PASANTIA: 'Pasantía',
      TEMPORAL: 'Temporal',
      tiempo_completo: 'Tiempo Completo',
      medio_tiempo: 'Medio Tiempo',
    };
    return tipos[value] || value || 'No especificado';
  };

  const getContractType = () => {
    const value = job.jobType || '';
    if (value === 'TIEMPO_COMPLETO' || value === 'tiempo_completo') {
      return 'Contrato por tiempo indeterminado';
    }
    return 'Contrato determinado';
  };

  const getJornada = () => {
    const tipo = getTipoEmpleo();
    return tipo === 'Tiempo Completo' ? 'Jornada completa' : 'Jornada parcial';
  };

  const getSalario = () => {
    const min = job.salarioMin || job.minSalary;
    const max = job.salarioMax || job.maxSalary;
    const moneda = job.moneda || 'ARS';

    if (min && max) return `${moneda} $${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `${moneda} $${min.toLocaleString()}`;
    if (max) return `Hasta ${moneda} $${max.toLocaleString()}`;
    return null;
  };

  const getTimeAgo = () => {
    const publishedDate = job.publishedAt || job.fechaPublicacion;
    if (!publishedDate) return null;
    return formatDistanceToNow(new Date(publishedDate), { addSuffix: true, locale: es });
  };

  const applicantsCount = job._count?.applications || 0;

  const getStatusColor = () => {
    if (job.moderationStatus === 'PENDING_PAYMENT' || job.paymentStatus === 'PENDING') {
      return 'bg-orange-100 text-orange-800';
    }
    if (job.moderationStatus) {
      const colors: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        AUTO_REJECTED: 'bg-red-100 text-red-800',
      };
      return colors[job.moderationStatus] || 'bg-gray-100 text-gray-800';
    }
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
    };
    return colors[job.status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = () => {
    if (job.moderationStatus === 'PENDING_PAYMENT' || job.paymentStatus === 'PENDING') {
      return 'Pendiente de Pago';
    }
    if (job.moderationStatus) {
      const labels: Record<string, string> = {
        PENDING: 'En Revisión',
        APPROVED: 'Aprobado',
        REJECTED: 'Rechazado',
        AUTO_REJECTED: 'Rechazado',
      };
      return labels[job.moderationStatus] || job.moderationStatus;
    }
    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador',
      closed: 'Cerrado',
    };
    return labels[job.status] || job.status;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative flex w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle bar (estilo mobile) */}
        <div className="flex items-center justify-center pb-2 pt-3 sm:hidden">
          <div className="h-1 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header con botón cerrar */}
        <div className="flex items-center justify-end px-6 pb-2 pt-3">
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Título y badge de estado */}
        <div className="px-6 pb-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{titulo}</h2>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor()}`}
            >
              {getStatusLabel()}
            </span>
           
          </div>
          {getTimeAgo() && (
            <p className="mt-2 text-sm text-gray-400">Publicado {getTimeAgo()}</p>
          )}
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Información principal con iconos (estilo mobile) */}
          <div className="mb-6 space-y-3">
            {/* Empresa */}
            {job.empresa && (
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                <span className="text-base text-gray-700">
                  {typeof job.empresa === 'string'
                    ? job.empresa
                    : job.empresa.companyName || 'Empresa'}
                </span>
              </div>
            )}

            {/* Ubicación */}
            <div className="flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
              <span className="text-base text-gray-700">{getLocation()}</span>
            </div>

            {/* Tipo de contrato */}
            <div className="flex items-center gap-3">
              <BriefcaseIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
              <span className="text-base text-gray-700">{getContractType()}</span>
            </div>

           

            {/* Salario */}
            {getSalario() && (
              <div className="flex items-start gap-3">
                <CurrencyDollarIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
                <span className="text-base text-gray-700">{getSalario()}</span>
              </div>
            )}

            {/* Jornada */}
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
              <span className="text-base text-gray-700">{getJornada()}</span>
            </div>

            {/* Modalidad */}
            {getModalidad() && (
              <div className="flex items-center gap-3">
                <HomeModernIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                <span className="text-base text-gray-700">{getModalidad()}</span>
              </div>
            )}

             {/* Nivel de experiencia */}
             {job.experienceLevel && (
              <div className="flex items-center gap-3">
                <AcademicCapIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                <span className="text-base text-gray-700">
                  {(() => {
                    const niveles: Record<string, string> = {
                      junior: 'Junior',
                      semi_senior: 'Semi Senior',
                      senior: 'Senior',
                      trainee: 'Trainee',
                      lead: 'Lead',
                      manager: 'Manager',
                      director: 'Director',
                      JUNIOR: 'Junior',
                      SEMI_SENIOR: 'Semi Senior',
                      SENIOR: 'Senior',
                      TRAINEE: 'Trainee',
                      LEAD: 'Lead',
                      MANAGER: 'Manager',
                      DIRECTOR: 'Director',
                      sin_experiencia: 'Sin experiencia',
                      SIN_EXPERIENCIA: 'Sin experiencia',
                    };
                    return niveles[job.experienceLevel!] || job.experienceLevel;
                  })()}
                </span>
              </div>
             )}

            {/* Postulantes */}
            <div className="flex items-center gap-3">
              <UsersIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
              <span className="text-base text-gray-700">
                {applicantsCount} {applicantsCount === 1 ? 'postulante' : 'postulantes'}
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Descripción de la oferta</h3>
            <p className="whitespace-pre-line leading-relaxed text-gray-700">{descripcion}</p>
          </div>

          {/* Requisitos */}
          {requisitos && (
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-bold text-gray-900">Requerimientos</h3>
              <p className="whitespace-pre-line leading-relaxed text-gray-700">{requisitos}</p>
            </div>
          )}

          {/* Beneficios */}
          {beneficios && (
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-bold text-gray-900">Beneficios</h3>
              <p className="whitespace-pre-line leading-relaxed text-gray-700">{beneficios}</p>
            </div>
          )}

          {/* Razón de rechazo */}
          {(job.moderationStatus === 'REJECTED' || job.moderationStatus === 'AUTO_REJECTED') &&
            (job.moderationReason || job.autoRejectionReason) && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
                <h3 className="text-sm font-semibold text-red-800">Razón de rechazo:</h3>
                <p className="mt-1 text-sm text-red-700">
                  {job.moderationReason || job.autoRejectionReason}
                </p>
              </div>
            )}
        </div>

        {/* Footer con botones de acción */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/postulantes?jobId=${job.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#002D5A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#003d7a] transition-colors"
            >
              <UsersIcon className="h-4 w-4" />
              Ver Postulantes
            </Link>
           
          </div>
        </div>
      </div>
    </div>
  );
}

