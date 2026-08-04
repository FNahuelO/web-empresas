'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { messageService } from '@/services/messageService';
import { useAuthStore } from '@/store/authStore';
import { Conversation, Message, ApiUserInfo } from '@/types';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';
import Link from 'next/link';

/** Extrae el nombre legible de un ApiUserInfo */
function getUserName(user?: ApiUserInfo | null): string {
  if (!user) return 'Usuario';
  if (user.postulante?.fullName) return user.postulante.fullName;
  if (user.empresa?.companyName) return user.empresa.companyName;
  return user.email || 'Usuario';
}

/** Extrae la URL del avatar de un ApiUserInfo */
function getUserAvatar(user?: ApiUserInfo | null): string | null {
  if (!user) return null;
  if (user.postulante?.profilePicture) return user.postulante.profilePicture;
  if (user.empresa?.logo) return user.empresa.logo;
  return null;
}

/** Id de perfil del postulante (no confundir con userId) */
function getPostulanteProfileId(user?: ApiUserInfo | null): string | null {
  if (!user || user.userType !== 'POSTULANTE') return null;
  return user.postulante?.id || null;
}

/** Formatea una fecha para mostrarla de forma legible */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MensajesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar conversaciones
  // showLoader: solo mostrar spinner en la carga inicial, no al refrescar en background
  const loadConversations = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await messageService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      // Solo mostrar error si es la carga inicial
      if (showLoader) {
        toast.error('Error al cargar conversaciones');
      }
      console.error(error);
      if (showLoader) setConversations([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (userId: string) => {
    try {
      setLoadingMessages(true);
      const data = await messageService.getConversation(userId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Error al cargar mensajes');
      console.error(error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Scroll al último mensaje
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-abrir chat si viene userId en la URL
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [searchParams]);

  // Cargar mensajes cuando se selecciona una conversación
  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId, loadMessages]);

  // Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cerrar menú de conversación al hacer click fuera
  useEffect(() => {
    if (!openMenuUserId) return;
    const handleClickOutside = () => setOpenMenuUserId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuUserId]);

  // Enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await messageService.sendMessage(selectedUserId, messageText);
      // Agregar el mensaje nuevo a la lista sin recargar toda la página
      setMessages((prev) => [...prev, sentMessage]);

      // Actualizar la lista de conversaciones localmente (mover al tope con el último mensaje)
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.user?.id === selectedUserId);
        if (idx !== -1) {
          const updated = { ...prev[idx], lastMessage: sentMessage };
          const rest = prev.filter((_, i) => i !== idx);
          return [updated, ...rest];
        }
        return prev;
      });

      // Recargar conversaciones en background (sin spinner) para sincronizar
      loadConversations(false);
      inputRef.current?.focus();
    } catch (error: any) {
      toast.error('Error al enviar el mensaje');
      console.error(error);
      setNewMessage(messageText); // Restaurar el mensaje si falla
    } finally {
      setSending(false);
    }
  };

  // Encontrar la info del usuario seleccionado (lista o mensajes cargados)
  const selectedConversation = conversations.find(
    (c) => c.user?.id === selectedUserId
  );
  const selectedUserInfo =
    selectedConversation?.user ??
    messages.find((m) => m.fromUserId === selectedUserId)?.fromUser ??
    messages.find((m) => m.toUserId === selectedUserId)?.toUser ??
    null;
  const selectedPostulanteId = getPostulanteProfileId(selectedUserInfo);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002D5A] border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-xl bg-white shadow-lg sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
        <div className="flex flex-1 overflow-hidden">
          {/* Panel izquierdo - Lista de conversaciones */}
          <div
            className={`w-full border-r border-gray-200 md:w-80 lg:w-96 ${
              selectedUserId ? 'hidden md:flex md:flex-col' : 'flex flex-col'
            }`}
          >
            {/* Header conversaciones */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
              <p className="text-xs text-gray-500">
                {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
              </p>
            </div>

            {/* Lista de conversaciones */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300" />
                  <h3 className="mt-3 text-sm font-medium text-gray-900">
                    No hay conversaciones
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Tus conversaciones con postulantes aparecerán aquí
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const userName = getUserName(conversation.user);
                  const avatarUrl = getUserAvatar(conversation.user);
                  const isSelected = conversation.user?.id === selectedUserId;
                  const lastMsgContent = conversation.lastMessage?.content || '';
                  const lastMsgDate = conversation.lastMessage?.createdAt || '';
                  const postulanteId = getPostulanteProfileId(conversation.user);
                  const conversationUserId = conversation.user?.id;
                  const isMenuOpen = openMenuUserId === conversationUserId;

                  return (
                    <div
                      key={conversationUserId || Math.random()}
                      className={`relative flex w-full items-center gap-1 transition-colors hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50 border-r-2 border-[#002D5A]' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(conversationUserId || null)}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <Avatar
                            src={avatarUrl}
                            alt={userName}
                            size="md"
                          />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="truncate text-sm font-semibold text-gray-900">
                              {userName}
                            </h3>
                            {lastMsgDate && (
                              <span className="ml-2 flex-shrink-0 text-[10px] text-gray-400">
                                {formatDate(lastMsgDate)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="truncate text-xs text-gray-500">
                              {lastMsgContent || 'Sin mensajes'}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="ml-2 flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-[#002D5A] px-1.5 text-[10px] font-bold text-white">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {postulanteId && (
                        <div className="relative flex-shrink-0 pr-2">
                          <button
                            type="button"
                            aria-label="Opciones de conversación"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuUserId(isMenuOpen ? null : conversationUserId || null);
                            }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/postulantes/${postulanteId}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenMenuUserId(null)}
                              >
                                <UserIcon className="h-4 w-4 text-gray-500" />
                                Ver perfil
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel derecho - Chat */}
          <div
            className={`flex flex-1 flex-col ${
              selectedUserId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {selectedUserId ? (
              <>
                {/* Header del chat */}
                <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
                  {/* Botón volver (mobile) */}
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(null)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>

                  {selectedPostulanteId ? (
                    <Link
                      href={`/postulantes/${selectedPostulanteId}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 -ml-1 transition-colors hover:bg-gray-50"
                      title="Ver perfil del postulante"
                    >
                      <Avatar
                        src={getUserAvatar(selectedUserInfo)}
                        alt={getUserName(selectedUserInfo)}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-gray-900 hover:text-[#002D5A]">
                          {getUserName(selectedUserInfo)}
                        </h2>
                        <p className="text-[10px] text-gray-500">
                          Postulante · Ver perfil
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <Avatar
                        src={getUserAvatar(selectedUserInfo)}
                        alt={getUserName(selectedUserInfo)}
                        size="sm"
                      />
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                          {getUserName(selectedUserInfo)}
                        </h2>
                        <p className="text-[10px] text-gray-500">
                          {selectedUserInfo?.userType === 'POSTULANTE'
                            ? 'Postulante'
                            : selectedUserInfo?.userType === 'EMPRESA'
                              ? 'Empresa'
                              : ''}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#002D5A] border-t-transparent"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        No hay mensajes aún. ¡Envía el primero!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const isOwn = message.fromUserId === user?.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isOwn
                                  ? 'bg-[#002D5A] text-white'
                                  : 'bg-white text-gray-900 shadow-sm'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div
                                className={`mt-1 flex items-center gap-1 ${
                                  isOwn ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <span
                                  className={`text-[10px] ${
                                    isOwn ? 'text-blue-200' : 'text-gray-400'
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                  <span className={`text-[10px] ${
                                    message.isRead
                                      ? 'text-green-300'   // ✓✓ verde = leído
                                      : 'text-blue-300'    // ✓ o ✓✓ azul claro
                                  }`}>
                                    {message.isRead || message.isDelivered ? (
                                      <span className="flex items-center">
                                        <CheckIcon className="h-3 w-3" />
                                        <CheckIcon className="-ml-1.5 h-3 w-3" />
                                      </span>
                                    ) : (
                                      <CheckIcon className="h-3 w-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input de mensaje */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3 text-black"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#002D5A] focus:outline-none focus:ring-1 focus:ring-[#002D5A]"
                    disabled={sending}
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#002D5A] text-white transition-colors hover:bg-[#003d7a] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Estado vacío - ninguna conversación seleccionada */
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="rounded-full bg-gray-100 p-6">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Tus mensajes
                </h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Selecciona una conversación de la lista para ver los mensajes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function MensajesPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002D5A] border-t-transparent"></div>
          </div>
        </Layout>
      }
    >
      <MensajesContent />
    </Suspense>
  );
}
