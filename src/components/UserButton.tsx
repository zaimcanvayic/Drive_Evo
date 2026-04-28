'use client';

import { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

interface UserButtonProps {
  user: User;
}

export function UserButton({ user }: UserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-300 hover:text-red-400"
      >
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
        </div>
        <span>{user.name || user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
          <Link
            href="/"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white"
          >
            Profilim
          </Link>
          <Link
            href="/rides"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white"
          >
            Geçmiş Sürüşlerim
          </Link>
          <button
            onClick={() => signOut()}
            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white"
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
} 