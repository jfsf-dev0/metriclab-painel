'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('demo_auth') === 'true') {
        router.replace('/');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        sessionStorage.setItem('demo_auth', 'true');
        router.push('/');
      } else {
        setError('Senha incorreta');
      }
    } catch {
      setError('Erro ao validar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-hairline p-8 rounded-none">
        <div className="mb-2">
          <span className="text-[32px] font-bold tracking-tight text-ink font-sans">
            m<span className="text-accent">.</span>
          </span>
        </div>
        <p className="text-[13px] font-normal text-muted mb-8 tracking-normal">
          Acesso restrito · Demo Lote 15 e 19
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Digite a senha de acesso"
              autoFocus
              className="w-full h-12 border border-hairline rounded-none px-3.5 text-ink text-sm bg-transparent outline-none focus:border-ink placeholder:text-muted transition-colors"
            />
            {error && (
              <p className="text-erro text-xs mt-2 font-normal">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-12 bg-ink text-white font-semibold text-sm rounded-none hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
