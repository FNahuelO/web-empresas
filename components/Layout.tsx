'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && !isAuthenticated) {
        await loadUser();
      } else if (!token && !isLoading) {
        router.push('/login');
      }
    };

    init();
  }, [isAuthenticated, isLoading, loadUser, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

