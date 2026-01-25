'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BriefcaseIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Publicaciones', href: '/publicaciones', icon: BriefcaseIcon },
  { name: 'Postulantes', href: '/postulantes', icon: UsersIcon },
  { name: 'Mensajes', href: '/mensajes', icon: ChatBubbleLeftRightIcon },
  { name: 'Planes', href: '/planes', icon: CreditCardIcon },
  { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-secondary-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-secondary-800">
        <h1 className="text-xl font-bold text-white">TrabajoYa</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
              }`}
            >
              <item.icon
                className={`mr-3 h-6 w-6 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-secondary-400 group-hover:text-white'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-secondary-800 p-4">
        <div className="mb-2 text-sm text-secondary-300">
          <p className="font-medium text-white">{user?.nombreEmpresa || user?.email}</p>
          <p className="text-xs text-secondary-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-secondary-300 hover:bg-secondary-800 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

