'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { videoMeetingService } from '@/services/videoMeetingService';
import { VideoMeeting } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  LinkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function VideollamadasPage() {
  const [meetings, setMeetings] = useState<VideoMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [cancelMeetingId, setCancelMeetingId] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    loadMeetings();
    checkGoogleStatus();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await videoMeetingService.getMeetings();
      setMeetings(data);
    } catch (error) {
      console.error('Error loading meetings:', error);
      toast.error('Error al cargar las videollamadas');
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleStatus = async () => {
    try {
      const status = await videoMeetingService.getGoogleCalendarStatus();
      setGoogleConnected(status.connected);
    } catch {
      setGoogleConnected(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      localStorage.setItem('googleCalendarReturnUrl', window.location.href);
      const result = await videoMeetingService.getGoogleAuthUrl(redirectUri);
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Error connecting Google:', error);
      toast.error('Error al conectar Google Calendar');
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    try {
      setCancelMeetingId(null);
      await videoMeetingService.cancelMeeting(meetingId);
      toast.success('Videollamada cancelada');
      loadMeetings();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al cancelar');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Agendada', color: 'bg-blue-100 text-blue-800', icon: CalendarDaysIcon };
      case 'ACCEPTED':
        return { label: 'Aceptada', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
      case 'REJECTED':
        return { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircleIcon };
      case 'IN_PROGRESS':
        return { label: 'En progreso', color: 'bg-purple-100 text-purple-800', icon: VideoCameraIcon };
      case 'COMPLETED':
        return { label: 'Completada', color: 'bg-gray-100 text-gray-800', icon: CheckCircleIcon };
      case 'CANCELLED':
        return { label: 'Cancelada', color: 'bg-red-100 text-red-600', icon: XCircleIcon };
      case 'MISSED':
        return { label: 'Perdida', color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: CalendarDaysIcon };
    }
  };

  const isMeetingExpired = (meeting: VideoMeeting): boolean => {
    const scheduled = new Date(meeting.scheduledAt);
    const durationMs = (meeting.duration || 30) * 60 * 1000;
    const endTime = new Date(scheduled.getTime() + durationMs);
    return new Date() > endTime;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const now = new Date();
  const filteredMeetings = meetings.filter((m) => {
    const meetingDate = new Date(m.scheduledAt);
    if (filter === 'upcoming') {
      return meetingDate >= now && !['CANCELLED', 'COMPLETED', 'REJECTED'].includes(m.status);
    }
    if (filter === 'past') {
      return meetingDate < now || ['CANCELLED', 'COMPLETED', 'REJECTED'].includes(m.status);
    }
    return true;
  });

  const sortedMeetings = [...filteredMeetings].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Videollamadas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona tus videollamadas agendadas con postulantes
            </p>
          </div>
          <button
            onClick={loadMeetings}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        {/* Google Calendar Banner */}
        {googleConnected === false && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Google Calendar no conectado
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  Conecta tu Google Calendar para que los eventos se creen automáticamente en el calendario
                  de ambos participantes al agendar una videollamada.
                </p>
                <button
                  onClick={handleConnectGoogle}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Conectar Google Calendar
                </button>
              </div>
            </div>
          </div>
        )}

        {googleConnected && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Google Calendar conectado — los eventos se crean automáticamente al agendar
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[
            { key: 'upcoming' as const, label: 'Próximas' },
            { key: 'past' as const, label: 'Pasadas' },
            { key: 'all' as const, label: 'Todas' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Meeting List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : sortedMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow">
            <VideoCameraIcon className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-600">
              {filter === 'upcoming'
                ? 'No hay videollamadas próximas'
                : filter === 'past'
                ? 'No hay videollamadas pasadas'
                : 'No hay videollamadas'}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Agenda videollamadas desde el perfil de un postulante
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMeetings.map((meeting) => {
              const statusConfig = getStatusConfig(meeting.status);
              const StatusIcon = statusConfig.icon;
              const isCreator = meeting.createdById === user?.id;
              const expired = isMeetingExpired(meeting);
              const canCancel =
                isCreator && !expired && ['SCHEDULED', 'ACCEPTED'].includes(meeting.status);

              return (
                <div
                  key={meeting.id}
                  className="rounded-xl bg-white p-5 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <VideoCameraIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {meeting.title || 'Videollamada'}
                        </h3>
                        {meeting.description && (
                          <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDaysIcon className="h-4 w-4" />
                            {formatDate(meeting.scheduledAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {formatTime(meeting.scheduledAt)}
                            {meeting.duration && ` · ${meeting.duration} min`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </span>

                      <div className="flex items-center gap-2">
                        {meeting.meetingUrl && !expired && ['SCHEDULED', 'ACCEPTED', 'IN_PROGRESS'].includes(meeting.status) && (
                          <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            Unirse
                          </a>
                        )}
                        {expired && ['SCHEDULED', 'ACCEPTED', 'IN_PROGRESS'].includes(meeting.status) && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500">
                            <ClockIcon className="h-3.5 w-3.5" />
                            Expirada
                          </span>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => setCancelMeetingId(meeting.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Cancelar
                          </button>
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

      {/* ── Modal de Confirmación para Cancelar Videollamada ── */}
      {cancelMeetingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            {/* Icono */}
            <div className="flex justify-center pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 pt-4 pb-2 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Cancelar videollamada
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                ¿Estás seguro de cancelar esta videollamada? Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={() => setCancelMeetingId(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => handleCancelMeeting(cancelMeetingId)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Cancelar videollamada
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

