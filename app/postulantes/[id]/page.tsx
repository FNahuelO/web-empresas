'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { Application, PostulanteProfile } from '@/types';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  CodeBracketIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PostulanteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postulanteId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [postulante, setPostulante] = useState<PostulanteProfile | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    if (postulanteId) {
      loadPostulanteData();
    }
  }, [postulanteId]);

  const loadPostulanteData = async () => {
    try {
      setLoading(true);
      const jobs = await jobService.getCompanyJobs();

      for (const job of jobs) {
        try {
          const applications = await jobService.getJobApplicants(job.id);
          const applicantsArray = Array.isArray(applications) ? applications : [];
          const foundApp = applicantsArray.find(
            (app) => app.postulanteId === postulanteId || app.postulante?.id === postulanteId
          );

          if (foundApp && foundApp.postulante) {
            setApplication({ ...foundApp, job });
            setPostulante(foundApp.postulante);
            return;
          }
        } catch (error) {
          console.error(`Error loading applicants for job ${job.id}:`, error);
        }
      }

      toast.error('No se encontró el postulante');
    } catch (error: any) {
      console.error('Error loading postulante data:', error);
      toast.error('Error al cargar datos del postulante');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    status: 'PENDING' | 'REVIEWED' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED'
  ) => {
    if (!application) return;

    try {
      setUpdatingStatus(true);
      setShowStatusModal(false);
      await jobService.updateApplication(application.id, { status });
      toast.success(`Estado actualizado a: ${getStatusLabel(status)}`);
      await loadPostulanteData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Nuevo';
      case 'REVIEWED':
        return 'Revisado';
      case 'INTERVIEW':
        return 'Entrevista';
      case 'ACCEPTED':
        return 'Aceptado';
      case 'REJECTED':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'INTERVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEWED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'INTERVIEW':
        return <VideoCameraIcon className="h-5 w-5 text-blue-600" />;
      case 'REVIEWED':
        return <EyeIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDateRange = (startDate?: string, endDate?: string, isCurrent?: boolean) => {
    if (!startDate) return '';
    const start = new Date(startDate).getFullYear();
    if (isCurrent) return `${start} - Actualidad`;
    if (endDate) return `${start} - ${new Date(endDate).getFullYear()}`;
    return `${start}`;
  };

  const handleViewCV = () => {
    if (!postulante) return;
    const cvUrl = postulante.cv || postulante.cvUrl;
    if (!cvUrl) {
      toast.error('El postulante no tiene CV cargado');
      return;
    }
    window.open(cvUrl, '_blank');
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

  if (!postulante) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <UserIcon className="h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-600">Postulante no encontrado</h2>
          <button
            onClick={() => router.back()}
            className="mt-6 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Volver
          </button>
        </div>
      </Layout>
    );
  }

  const fullName =
    postulante.fullName ||
    `${postulante.firstName || ''} ${postulante.lastName || ''}`.trim() ||
    'Postulante';
  const email = postulante.email || postulante.user?.email || 'No disponible';
  const phone = postulante.phone || null;
  const location =
    postulante.city && postulante.province
      ? `${postulante.city}, ${postulante.province}`
      : postulante.city || postulante.country || null;
  const jobTitle = application?.job?.title || 'Puesto postulado';
  const status = application?.status || application?.estado;
  const isAccepted = status?.toUpperCase() === 'ACCEPTED';
  const isRejected = status?.toUpperCase() === 'REJECTED';
  const hasCV = !!(postulante.cv || postulante.cvUrl);
  const hasVideo = !!postulante.videoUrl;
  const avatarUrl = postulante.avatar || postulante.profilePicture;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>

        {/* Header Card - estilo mobile */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Banner azul */}
          {/* Contenido del perfil */}
          <div className="p-6 bg-gradient-to-r from-[#002D5A] to-[#4C84C3]">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left">
              {/* Avatar */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#002D5A] shadow-md">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(fullName)}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="mt-3 sm:mt-0 sm:ml-5 sm:pb-1 flex-1">
                <h1 className="text-2xl font-bold text-white">{fullName}</h1>
                {postulante.resumeTitle && (
                  <p className="text-base font-medium text-white">{postulante.resumeTitle}</p>
                )}
                {location && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-[#D9D9D9] sm:justify-start">
                    <MapPinIcon className="h-4 w-4" />
                    {location}
                  </p>
                )}
              </div>

              {/* Status badge */}
              {status && (
                <div className="mt-3 sm:mt-0">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status)}`}
                  >
                    {getStatusLabel(status)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {postulante.userId && (
                <Link
                  href={`/mensajes?userId=${postulante.userId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#002D5A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#003d7a] transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Contactar
                </Link>
              )}

              {application && !isAccepted && (
                <button
                  onClick={() => handleUpdateStatus('ACCEPTED')}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Aceptar
                </button>
              )}

              {application && !isRejected && (
                <button
                  onClick={() => handleUpdateStatus('REJECTED')}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Rechazar
                </button>
              )}

              <button
                onClick={() => setShowStatusModal(true)}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-full border border-white px-5 py-2.5 text-sm font-medium text-white hover:bg-[#002D5A]/5 transition-colors disabled:opacity-50"
              >
                Cambiar estado
              </button>
            </div>
          </div>
        </div>

        {/* CV y Video */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {hasVideo && (
            <button
              onClick={() => setShowVideoModal(true)}
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#002D5A] p-5 text-white shadow hover:bg-[#003d7a] transition-colors"
            >
              <VideoCameraIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Ver video de presentación</span>
            </button>
          )}

          {hasCV && (
            <button
              onClick={handleViewCV}
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#19A23A] p-5 text-white shadow hover:bg-[#148a30] transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Ver CV</span>
            </button>
          )}
        </div>

        {/* Estado de la Postulación */}
        {application && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Estado de la Postulación</h2>
              <span className="text-sm text-gray-500">{jobTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium ${getStatusColor(status)}`}
              >
                {getStatusLabel(status)}
              </span>
            </div>
          </div>
        )}

        {/* Información de Contacto */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Información de Contacto</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">{email}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{location}</span>
              </div>
            )}
            {/* Links */}
            {postulante.linkedInUrl && (
              <a
                href={postulante.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-blue-600 hover:underline"
              >
                <LinkIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm">LinkedIn</span>
              </a>
            )}
            {postulante.portfolioUrl && (
              <a
                href={postulante.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-blue-600 hover:underline"
              >
                <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm">Portfolio</span>
              </a>
            )}
            {postulante.githubUrl && (
              <a
                href={postulante.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-blue-600 hover:underline"
              >
                <CodeBracketIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm">GitHub</span>
              </a>
            )}
          </div>
        </div>

        {/* Descripción profesional */}
        {postulante.professionalDescription && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sobre el candidato</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {postulante.professionalDescription}
            </p>
          </div>
        )}

        {/* Experiencia Laboral */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Experiencia Laboral</h2>
          {postulante.experiences && postulante.experiences.length > 0 ? (
            <div className="space-y-6">
              {postulante.experiences.map((exp, index) => (
                <div key={exp.id || index} className="flex gap-4">
                  {/* Línea vertical */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <BriefcaseIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    {index < (postulante.experiences?.length || 0) - 1 && (
                      <div className="mt-2 h-full w-px bg-gray-200" />
                    )}
                  </div>
                  {/* Contenido */}
                  <div className="flex-1 pb-2">
                    <h3 className="text-base font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-sm font-medium text-blue-600">{exp.company}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                    </p>
                    {exp.description && (
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <BriefcaseIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">Sin experiencia registrada</p>
              <p className="mt-1 text-xs text-gray-400">
                El candidato no ha cargado experiencia laboral
              </p>
            </div>
          )}
        </div>

        {/* Educación */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Educación</h2>
          {postulante.education && postulante.education.length > 0 ? (
            <div className="space-y-6">
              {postulante.education.map((edu, index) => (
                <div key={edu.id || index} className="flex gap-4">
                  {/* Línea vertical */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <AcademicCapIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    {index < (postulante.education?.length || 0) - 1 && (
                      <div className="mt-2 h-full w-px bg-gray-200" />
                    )}
                  </div>
                  {/* Contenido */}
                  <div className="flex-1 pb-2">
                    <h3 className="text-base font-semibold text-gray-900">{edu.degree}</h3>
                    <p className="text-sm font-medium text-blue-600">{edu.institution}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateRange(edu.startDate, edu.endDate, edu.isCurrent)}
                    </p>
                    {edu.description && (
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <AcademicCapIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">Sin educación registrada</p>
              <p className="mt-1 text-xs text-gray-400">
                El candidato no ha cargado su formación académica
              </p>
            </div>
          )}
        </div>

        {/* Habilidades */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Habilidades</h2>
          {postulante.skills && postulante.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {postulante.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <StarIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">Sin habilidades registradas</p>
              <p className="mt-1 text-xs text-gray-400">
                El candidato no ha cargado sus habilidades
              </p>
            </div>
          )}
        </div>

        {/* Idiomas */}
        {postulante.languages && postulante.languages.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Idiomas</h2>
            <div className="space-y-3">
              {postulante.languages.map((lang, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{lang.language}</span>
                  <span className="text-xs rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 capitalize">
                    {lang.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Cambiar Estado */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Cambiar estado</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              {(['PENDING', 'REVIEWED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'] as const).map(
                (statusOption) => {
                  const isCurrent = status?.toUpperCase() === statusOption;
                  return (
                    <button
                      key={statusOption}
                      onClick={() => handleUpdateStatus(statusOption)}
                      disabled={updatingStatus || isCurrent}
                      className={`flex w-full items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                        isCurrent
                          ? 'border-[#002D5A] bg-[#002D5A]/5'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${updatingStatus || isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(statusOption)}
                        <span
                          className={`text-sm font-medium ${
                            isCurrent ? 'text-[#002D5A]' : 'text-gray-800'
                          }`}
                        >
                          {getStatusLabel(statusOption)}
                        </span>
                      </div>
                      {isCurrent && (
                        <CheckCircleIcon className="h-5 w-5 text-[#002D5A]" />
                      )}
                    </button>
                  );
                }
              )}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Video */}
      {showVideoModal && postulante.videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative w-full max-w-3xl p-4">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-2 right-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <XCircleIcon className="h-8 w-8" />
            </button>
            <video
              src={postulante.videoUrl}
              controls
              autoPlay
              className="w-full rounded-xl shadow-2xl"
              style={{ maxHeight: '80vh' }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

