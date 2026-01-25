'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { jobService } from '@/services/jobService';
import { Application, Job } from '@/types';
import { UsersIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

function PostulantesContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      loadApplicants();
    } else {
      loadAllApplicants();
    }
  }, [jobId]);

  const loadApplicants = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const [applicantsData, jobData] = await Promise.all([
        jobService.getJobApplicants(jobId),
        jobService.getJobDetail(jobId).catch(() => null),
      ]);
      // Asegurar que applicantsData sea un array
      setApplications(Array.isArray(applicantsData) ? applicantsData : []);
      setJob(jobData);
    } catch (error: any) {
      toast.error('Error al cargar postulantes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllApplicants = async () => {
    try {
      setLoading(true);
      const jobs = await jobService.getCompanyJobs();
      const activeJobs = jobs.filter((j) => j.status === 'active' || j.status === 'activo');
      const allApplications: Application[] = [];

      for (const job of activeJobs) {
        try {
          const applicants = await jobService.getJobApplicants(job.id);
          const applicantsArray = Array.isArray(applicants) ? applicants : [];
          allApplications.push(...applicantsArray.map((app) => ({ ...app, job })));
        } catch (error) {
          console.error(`Error loading applicants for job ${job.id}:`, error);
        }
      }

      setApplications(allApplications);
    } catch (error: any) {
      toast.error('Error al cargar postulantes');
      console.error(error);
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Postulantes</h1>
          {job && (
            <p className="mt-1 text-sm text-gray-500">
              Postulantes para: {job.title}
            </p>
          )}
        </div>

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
        ) : (
          <div className="space-y-4">
            {Array.isArray(applications) && applications.map((application) => {
              const postulante = application.postulante;
              const job = application.job;
              const fullName =
                postulante?.fullName ||
                `${postulante?.firstName || ''} ${postulante?.lastName || ''}`.trim() ||
                'Postulante';

              return (
                <div
                  key={application.id}
                  className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          {postulante?.avatar || postulante?.profilePicture ? (
                            <img
                              className="h-12 w-12 rounded-full"
                              src={postulante.avatar || postulante.profilePicture}
                              alt={fullName}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                              <UsersIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
                          <p className="text-sm text-gray-600">
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
                        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
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

