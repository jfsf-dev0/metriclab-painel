'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: 12 de setembro de 2026 · 15:30:00
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now);
      setCurrentDateTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('demo_auth');
      router.push('/login');
    }
  };

  return (
    <header className="w-full bg-surface border-b-[1.5px] border-ink sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo & Title */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold tracking-tight text-ink font-sans">
              m<span className="text-accent">.</span>
            </span>
            <span className="text-hairline font-light">|</span>
            <span className="text-base font-semibold text-ink tracking-tight">
              Lote 15 e 19
            </span>
          </div>

          <nav className="flex items-center space-x-1 pl-4 border-l border-hairline">
            <button
              onClick={() => router.push('/')}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink hover:text-accent transition-colors"
            >
              Painel
            </button>
            <button
              onClick={() => router.push('/usuarios')}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink hover:text-accent transition-colors"
            >
              Usuários
            </button>
          </nav>
        </div>

        {/* Right: Real-time Date/Time and Exit */}
        <div className="flex items-center space-x-4">
          <div className="text-xs font-normal text-muted font-mono tracking-tight">
            {currentDateTime || 'Carregando...'}
          </div>
          <button
            onClick={handleLogout}
            title="Sair da sessão"
            className="text-xs text-muted hover:text-ink font-normal uppercase tracking-wider transition-colors border-l border-hairline pl-4"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
