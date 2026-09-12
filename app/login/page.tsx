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
    <main className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white border border-[#E2E2DC] rounded-[16px] p-8 sm:p-12 shadow-sm">
        {/* Logo m. centralizado no topo */}
        <div className="text-center mb-6">
          <span className="text-[32px] font-bold text-[#111111] leading-none tracking-tight font-sans">
            m<span className="text-[#F5A623]">.</span>
          </span>
        </div>

        {/* Título abaixo do logo */}
        <div className="text-center mb-8">
          <h1 className="text-[20px] font-semibold text-[#111111] tracking-[-0.3px]">
            Painel Operacional
          </h1>
          <p className="text-[13px] font-normal text-[#9CA3AF] mt-1.5">
            Acesso restrito · Demo Lote 15 e 19
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[12px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2">
              Senha de acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Digite a senha de acesso"
              autoFocus
              className="w-full h-[52px] border border-[#E2E2DC] rounded-[8px] px-4 text-[15px] text-[#111111] bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-[#9CA3AF] transition-all"
            />
            {error && (
              <p className="text-red-500 text-[13px] mt-2 text-center font-normal">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-[52px] bg-[#111111] text-white font-semibold text-[15px] rounded-[8px] hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Powered by MetricLab no rodapé */}
        <div className="text-center mt-8 pt-6 border-t border-[#E2E2DC]/60">
          <p className="text-[12px] text-[#9CA3AF]">
            Powered by <span className="text-[#F5A623] font-semibold">MetricLab</span>
          </p>
        </div>
      </div>
    </main>
  );
}
