'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { videoMeetingService } from '@/services/videoMeetingService';

interface ScheduleVideoMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitedUserId: string;
  invitedUserName: string;
  onMeetingCreated?: () => void;
}

export default function ScheduleVideoMeetingModal({
  isOpen,
  onClose,
  invitedUserId,
  invitedUserName,
  onMeetingCreated,
}: ScheduleVideoMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState<boolean | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkGoogleCalendarStatus();
      // Set default date/time (tomorrow at 10:00)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setTime('10:00');
    }
  }, [isOpen]);

  const checkGoogleCalendarStatus = async () => {
    try {
      const status = await videoMeetingService.getGoogleCalendarStatus();
      setGoogleCalendarConnected(status.connected);
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
      setGoogleCalendarConnected(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setConnectingGoogle(true);
      const currentUrl = window.location.href;
      const redirectUri = `${window.location.origin}/auth/google/callback`;

      // Guardar la URL actual para volver después del OAuth
      localStorage.setItem('googleCalendarReturnUrl', currentUrl);

      const result = await videoMeetingService.getGoogleAuthUrl(redirectUri);
      // Redirigir al flujo de OAuth de Google
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      toast.error('Error al conectar con Google Calendar');
      setConnectingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que Google Calendar esté conectado
    if (!googleCalendarConnected) {
      toast.error('Debes conectar tu Google Calendar antes de crear una videollamada');
      return;
    }

    if (!title.trim()) {
      toast.error('Ingresa un título para la videollamada');
      return;
    }

    if (!date || !time) {
      toast.error('Selecciona fecha y hora');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`);
    if (scheduledAt <= new Date()) {
      toast.error('La fecha debe ser en el futuro');
      return;
    }

    try {
      setIsLoading(true);

      const meeting = await videoMeetingService.createMeeting({
        invitedUserId,
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(duration, 10) || 30,
      });

      // Verificar si el evento de Google Calendar se creó correctamente
      if (meeting.warning || meeting.googleCalendarEventCreated === false) {
        toast.success('Videollamada agendada exitosamente');
        toast.error(
          meeting.warning ||
          'No se pudo crear el evento en Google Calendar. Puede que necesites reconectar tu cuenta.',
          { duration: 8000, icon: '⚠️' }
        );
      } else {
        toast.success('Videollamada agendada exitosamente');
        toast.success('Evento creado en Google Calendar', { icon: '📅' });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setDuration('30');
      onMeetingCreated?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      const errorMsg =
        error?.response?.data?.message || error?.message || 'Error al agendar la videollamada';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Minimum date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <VideoCameraIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Agendar videollamada</h3>
              <p className="text-sm text-gray-500">con {invitedUserName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Google Calendar Status */}
        <div className="px-6 pt-4">
          {googleCalendarConnected === null ? (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              Verificando conexión con Google Calendar...
            </div>
          ) : googleCalendarConnected ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              Google Calendar conectado — el evento se creará automáticamente
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 px-4 py-3 border border-amber-200">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Google Calendar requerido
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    Debes conectar tu Google Calendar para poder crear videollamadas. Esto permite generar
                    automáticamente el enlace de Google Meet y los eventos en el calendario de ambos participantes.
                  </p>
                  <button
                    onClick={handleConnectGoogleCalendar}
                    disabled={connectingGoogle}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    {connectingGoogle ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-amber-700" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Conectar Google Calendar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 text-black">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Entrevista técnica"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas o detalles de la reunión..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarDaysIcon className="inline h-4 w-4 mr-1 -mt-0.5" />
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <ClockIcon className="inline h-4 w-4 mr-1 -mt-0.5" />
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración estimada
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora 30 minutos</option>
              <option value="120">2 horas</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !googleCalendarConnected}
              className="flex-1 rounded-lg bg-[#002D5A] py-2.5 text-sm font-semibold text-white hover:bg-[#003d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Agendando...
                </>
              ) : (
                <>
                  <VideoCameraIcon className="h-4 w-4" />
                  Agendar videollamada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

