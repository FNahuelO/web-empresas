'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { Application, Job } from '@/types';
import { ChatBubbleLeftRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

type ContactFilter = 'all' | 'contacted' | 'pending';

function PostulantesContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactFilter, setContactFilter] = useState<ContactFilter>('all');

  useEffect(() => {
    let cancelled = false;

    const loadApplicants = async () => {
      if (!jobId) return;
      try {
        setLoading(true);
        const [applicantsData, jobData] = await Promise.all([
          jobService.getJobApplicants(jobId),
          jobService.getJobDetail(jobId).catch(() => null),
        ]);
        if (cancelled) return;
        setApplications(Array.isArray(applicantsData) ? applicantsData : []);
        setJob(jobData);
      } catch (error: any) {
        if (cancelled) return;
        toast.error('Error al cargar postulantes');
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadAllApplicants = async () => {
      try {
        setLoading(true);
        const jobs = await jobService.getCompanyJobs();
        if (cancelled) return;
        // Todas las publicaciones de la empresa (activas, pausadas, inactivas por plan vencido, etc.).
        // Antes solo se incluían active|activo: al expirar el plan el cron pasa el job a "inactive" y los
        // postulantes desaparecían de esta pantalla aunque siguieran en la base.
        const companyJobs = Array.isArray(jobs) ? jobs : [];

        // Cargar todos los postulantes en PARALELO en vez de secuencial
        const results = await Promise.allSettled(
          companyJobs.map(async (job) => {
            const applicants = await jobService.getJobApplicants(job.id);
            const applicantsArray = Array.isArray(applicants) ? applicants : [];
            return applicantsArray.map((app) => ({ ...app, job }));
          })
        );

        if (cancelled) return;

        const allApplications: Application[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            allApplications.push(...result.value);
          }
        }

        setApplications(allApplications);
      } catch (error: any) {
        if (cancelled) return;
        toast.error('Error al cargar postulantes');
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (jobId) {
      loadApplicants();
    } else {
      loadAllApplicants();
    }

    return () => { cancelled = true; };
  }, [jobId]);

  const contactedCount = applications.filter((app) => app.isContacted).length;
  const pendingCount = applications.length - contactedCount;

  const filteredApplications =
    contactFilter === 'contacted'
      ? applications.filter((app) => app.isContacted)
      : contactFilter === 'pending'
        ? applications.filter((app) => !app.isContacted)
        : applications;

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Postulantes</h1>
          {job && (
            <p className="mt-1 text-sm text-gray-500">
              Postulantes para: {job.title}
            </p>
          )}
        </div>

        {applications.length > 0 && (
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(
              [
                { key: 'all' as const, label: 'Todos', count: applications.length },
                { key: 'pending' as const, label: 'No contactados', count: pendingCount },
                { key: 'contacted' as const, label: 'Contactados', count: contactedCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setContactFilter(tab.key)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  contactFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-xs ${
                    contactFilter === tab.key
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-gray-200/60 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay postulantes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Los postulantes a tus empleos aparecerán aquí
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {contactFilter === 'contacted'
                ? 'No hay postulantes contactados'
                : 'No hay postulantes pendientes de contacto'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Probá con otro filtro para ver más resultados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const postulante = application.postulante;
              const job = application.job;
              const fullName =
                postulante?.fullName ||
                `${postulante?.firstName || ''} ${postulante?.lastName || ''}`.trim() ||
                'Postulante';
              const isContacted = Boolean(application.isContacted);

              return (
                <div
                  key={application.id}
                  className={`overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow ${
                    isContacted ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-gray-300'
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <Avatar
                            src={postulante?.avatar || postulante?.profilePicture}
                            alt={fullName}
                            size="lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900 truncate sm:text-lg">
                              {fullName}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isContacted
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isContacted ? 'bg-emerald-500' : 'bg-gray-400'
                                }`}
                              />
                              {isContacted ? 'Contactado' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {job?.title || 'Empleo'}
                          </p>
                          {postulante?.city && (
                            <p className="text-xs text-gray-500">{postulante.city}</p>
                          )}
                          {application.appliedAt && (
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(application.appliedAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/postulantes/${postulante?.id}`}
                        className="rounded-md bg-[#002D5A] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#02345fb6] sm:flex-shrink-0"
                      >
                        Ver Perfil
                      </Link>
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

export default function PostulantesPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          </div>
        </Layout>
      }
    >
      <PostulantesContent />
    </Suspense>
  );
}
