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
      setJobs(jobsData);
      setSubscription(subscriptionData);

      // Calcular estadísticas
      const activeJobs = jobsData.filter(
        (job) => job.status === 'active' || job.status === 'activo'
      );
      setStats((prev) => ({ ...prev, activeJobs: activeJobs.length }));

      // Cargar postulaciones recientes
      const allApplications: Application[] = [];
      let totalApplicants = 0;
      let interviews = 0;

      for (const job of activeJobs.slice(0, 5)) {
        try {
          const applicants = await jobService.getJobApplicants(job.id);
          allApplications.push(...applicants);
          totalApplicants += applicants.length;
          interviews += applicants.filter(
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {profile?.companyName || 'Empresa'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona tus publicaciones y postulantes desde aquí
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Empleos Activos
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.activeJobs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Postulantes
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalApplicants}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Entrevistas
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.interviews}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        {subscription && subscription.subscription?.status === 'ACTIVE' && (
          <div className="overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Plan Actual</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {subscription.planType === 'BASIC' && 'Plan Básico'}
                    {subscription.planType === 'PREMIUM' && 'Plan Premium'}
                    {subscription.planType === 'ENTERPRISE' && 'Plan Enterprise'}
                  </p>
                  {subscription.subscription?.endDate && (
                    <p className="mt-1 text-sm text-gray-600">
                      Renueva el{' '}
                      {new Date(subscription.subscription.endDate).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
                <Link
                  href="/planes"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Gestionar
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recent Applications */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Postulaciones Recientes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentApplications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay postulaciones recientes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Las postulaciones a tus empleos aparecerán aquí
                </p>
              </div>
            ) : (
              recentApplications.map((application) => {
                const postulante = application.postulante;
                const job = application.job;
                const fullName =
                  postulante?.fullName ||
                  `${postulante?.firstName || ''} ${postulante?.lastName || ''}`.trim() ||
                  'Postulante';

                return (
                  <div key={application.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {postulante?.avatar || postulante?.profilePicture ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={postulante.avatar || postulante.profilePicture}
                              alt={fullName}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                              <UsersIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fullName}</p>
                          <p className="text-sm text-gray-500">
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
                        className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700"
                      >
                        Ver Perfil
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Empleos Activos</h2>
            <Link
              href="/publicaciones"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs
              .filter((job) => job.status === 'active' || job.status === 'activo')
              .slice(0, 5)
              .map((job) => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.title || 'Sin título'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {job.ciudad && job.provincia
                          ? `${job.ciudad}, ${job.provincia}`
                          : job.location || 'Ubicación no especificada'}
                      </p>
                      {job.publishedAt && (
                        <p className="text-xs text-gray-400">
                          {getTimeAgo(new Date(job.publishedAt))}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/publicaciones/${job.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

