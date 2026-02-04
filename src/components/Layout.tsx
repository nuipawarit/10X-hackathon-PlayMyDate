'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { seedDatabase, getWallet } from '@/lib/api';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const isActive = (path: string) => pathname.startsWith(path);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await getWallet();
        setWalletBalance(data.balance);
      } catch {
        // Wallet may not exist yet
      }
    };
    if (user) {
      fetchWallet();
    }
  }, [user, pathname]);

  const handleResetDatabase = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await seedDatabase();
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to reset database:', error);
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50/50 via-white to-rose-50/30">
      <header className="header-glass">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/matches" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="text-xl font-extrabold gradient-text">PlayMyDate</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/matches"
              className={isActive('/matches') ? 'nav-link-active' : 'nav-link-inactive'}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Matches
              </span>
            </Link>
            <Link
              href="/dates"
              className={isActive('/dates') ? 'nav-link-active' : 'nav-link-inactive'}
            >
              <span className="flex items-center gap-2">
                🗓️ Dates
              </span>
            </Link>
            <Link
              href="/profile"
              className={isActive('/profile') ? 'nav-link-active' : 'nav-link-inactive'}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </span>
            </Link>

            <Link
              href="/wallet"
              className="coin-counter ml-2"
            >
              <span className="text-lg">🪙</span>
              <span className="font-bold text-amber-700">{walletBalance !== null ? walletBalance.toLocaleString() : '...'}</span>
            </Link>

            <div className="flex items-center gap-3 ml-3 pl-4 border-l border-gray-200/50">
              <div className="flex items-center gap-2.5">
                <div className="avatar w-9 h-9 text-sm ring-2 ring-white shadow-md">
                  {user?.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  {user?.display_name || 'User'}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-rose-500 transition-all duration-300 p-2 hover:bg-rose-50 rounded-xl"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <div className="page-enter">
          {children}
        </div>
      </main>

      <footer className="py-6 text-center">
        <button
          onClick={handleResetDatabase}
          disabled={resetting}
          className="text-xs text-gray-400 hover:text-rose-400 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-rose-50"
        >
          {resetting ? '✨ Resetting...' : '🔄 Reset Database'}
        </button>
      </footer>
    </div>
  );
}
