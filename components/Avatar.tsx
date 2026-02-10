'use client';

import { useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-6 w-6',
  xl: 'h-10 w-10',
};

/**
 * Verifica si una URL de imagen es válida (comienza con http/https o data:)
 */
function isValidImageUrl(url?: string | null): url is string {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:');
}

export default function Avatar({ src, alt = '', size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const validSrc = isValidImageUrl(src);

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  if (!validSrc || hasError) {
    // Fallback: iniciales o icono
    const initials = alt
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');

    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-200 ${sizeClass} ${className}`}
      >
        {initials ? (
          <span className="text-sm font-semibold text-gray-500">{initials}</span>
        ) : (
          <UserIcon className={`${iconSize} text-gray-400`} />
        )}
      </div>
    );
  }

  return (
    <img
      className={`rounded-full object-cover ${sizeClass} ${className}`}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

