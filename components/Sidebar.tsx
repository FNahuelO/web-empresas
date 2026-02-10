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
  XMarkIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Publicaciones', href: '/publicaciones', icon: BriefcaseIcon },
  { name: 'Postulantes', href: '/postulantes', icon: UsersIcon },
  { name: 'Mensajes', href: '/mensajes', icon: ChatBubbleLeftRightIcon },
  { name: 'Videollamadas', href: '/videollamadas', icon: VideoCameraIcon },
  { name: 'Planes', href: '/planes', icon: CreditCardIcon },
  { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavClick = () => {
    // Cerrar sidebar en mobile al navegar
    onClose();
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-secondary-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo + close button */}
        <div className="flex h-16 items-center justify-between border-b border-secondary-800 px-4">
          <h1 className="text-xl font-bold text-white">TrabajoYa</h1>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-secondary-400 hover:bg-secondary-800 hover:text-white lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                  }`}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-secondary-400 group-hover:text-white'
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
            <p className="font-medium text-white truncate">{user?.companyName || user?.email}</p>
            <p className="text-xs text-secondary-400 truncate">{user?.email}</p>
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
    </>
  );
}
