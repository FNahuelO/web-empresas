'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { messageService } from '@/services/messageService';
import { Conversation } from '@/types';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function MensajesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error: any) {
      toast.error('Error al cargar conversaciones');
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
          <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona tus conversaciones con postulantes
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay conversaciones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tus conversaciones con postulantes aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.userId}
                className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {conversation.userAvatar ? (
                          <img
                            className="h-12 w-12 rounded-full"
                            src={conversation.userAvatar}
                            alt={conversation.userName}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {conversation.userName}
                        </h3>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-600">{conversation.lastMessage}</p>
                        )}
                        {conversation.lastMessageDate && (
                          <p className="text-xs text-gray-400">
                            {new Date(conversation.lastMessageDate).toLocaleString('es-ES')}
                          </p>
                        )}
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

