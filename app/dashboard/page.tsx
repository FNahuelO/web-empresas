'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { profileService } from '@/services/profileService';
import { subscriptionService } from '@/services/subscriptionService';
import { Job, EmpresaProfile, Application, Subscription } from '@/types';
import {
  BriefcaseIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import JobDetailModal from '@/components/JobDetailModal';

export default function DashboardPage() {
  const [profile, setProfile] = useState<EmpresaProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    interviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, jobsData, subscriptionData] = await Promise.all([
        profileService.getEmpresaProfile(),
        jobService.getCompanyJobs(),
        subscriptionService.getCurrentSubscription().catch(() => null),
      ]);

      setProfile(profileData);
      const jobsArray = Array.isArray(jobsData) ? jobsData : [];
      setJobs(jobsArray);
      setSubscription(subscriptionData);

      const activeJobs = jobsArray.filter(
        (job) => job.status === 'active' || job.status === 'activo'
      );
      setStats((prev) => ({ ...prev, activeJobs: activeJobs.length }));

      const allApplications: Application[] = [];
      let totalApplicants = 0;
      let interviews = 0;

      for (const job of activeJobs.slice(0, 5)) {
        try {
          const applicants = await jobService.getJobApplicants(job.id);
          const applicantsArray = Array.isArray(applicants) ? applicants : [];
          allApplications.push(...applicantsArray);
          totalApplicants += applicantsArray.length;
          interviews += applicantsArray.filter(
            (app) => app.status === 'INTERVIEW' || app.estado === 'entrevista'
          ).length;
        } catch (error) {
          console.error(`Error loading applicants for job ${job.id}:`, error);
        }
      }

      const sortedApplications = allApplications.sort((a, b) => {
        const dateA = new Date(a.appliedAt || a.fechaAplicacion || 0).getTime();
        const dateB = new Date(b.appliedAt || b.fechaAplicacion || 0).getTime();
        return dateB - dateA;
      });

      setRecentApplications(sortedApplications.slice(0, 5));
      setStats({
        activeJobs: activeJobs.length,
        totalApplicants,
        interviews,
      });
    } catch (error: any) {
      toast.error('Error al cargar datos del dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
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

  const activeJobs = Array.isArray(jobs)
    ? jobs.filter((job) => job.status === 'active' || job.status === 'activo')
    : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Bienvenido, {profile?.companyName || 'Empresa'}
          </h1>
          <Link
            href="/publicaciones/nueva"
            className="flex items-center gap-2 rounded-lg bg-[#002D5A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#02345fb6] transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva publicación
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <BriefcaseIcon className="h-5 w-5 text-[#002D5A]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Empleos activos</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeJobs}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
              <UsersIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Postulantes</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalApplicants}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Entrevistas</p>
              <p className="text-xl font-bold text-gray-900">{stats.interviews}</p>
            </div>
          </div>
        </div>

        {/* Postulaciones Recientes */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Postulaciones Recientes</h2>
          {recentApplications.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay postulaciones recientes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Las postulaciones a tus empleos aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recentApplications.map((application) => {
                const postulante = application.postulante;
                const job = application.job;
                const fullName =
                  postulante?.fullName ||
                  `${postulante?.firstName || ''} ${postulante?.lastName || ''}`.trim() ||
                  'Postulante';

                return (
                  <div
                    key={application.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {postulante?.avatar || postulante?.profilePicture ? (
                          <img
                            className="h-11 w-11 rounded-full object-cover"
                            src={postulante.avatar || postulante.profilePicture}
                            alt={fullName}
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200">
                            <UsersIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {job?.title || 'Empleo'}
                        </p>
                        {application.appliedAt && (
                          <p className="text-xs text-gray-400">
                            {getTimeAgo(new Date(application.appliedAt))}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/postulantes/${postulante?.id}`}
                      className="ml-3 flex-shrink-0 rounded-md bg-[#002D5A] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#02345fb6] transition-colors"
                    >
                      Ver perfil
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Empleos Activos */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Empleos Activos</h2>
            <Link
              href="/publicaciones"
              className="text-sm font-medium text-[#002D5A] hover:text-[#02345fb6] transition-colors"
            >
              Ver todos
            </Link>
          </div>
          <div className="p-6">
            {activeJobs.length === 0 ? (
              <div className="py-8 text-center">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay empleos activos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Crea tu primera publicación para empezar a recibir postulantes
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeJobs.slice(0, 6).map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-gray-100 bg-white p-4 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {job.title || 'Sin título'}
                      </p>
                      <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        Activo
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {job.ciudad && job.provincia
                        ? `${job.ciudad}, ${job.provincia}`
                        : job.location || 'Ubicación no especificada'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      {job.publishedAt && (
                        <p className="text-xs text-gray-400">
                          {getTimeAgo(new Date(job.publishedAt))}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDetailModal(true);
                        }}
                        className="text-sm font-medium text-[#002D5A] hover:text-[#02345fb6] transition-colors"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Publicación */}
      {selectedJob && (
        <JobDetailModal
          visible={showDetailModal}
          job={selectedJob}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </Layout>
  );
}
