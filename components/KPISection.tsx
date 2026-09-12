'use client';

import React from 'react';
import { KPIStats } from '@/types/painel';

interface KPISectionProps {
  stats: KPIStats;
  loading?: boolean;
}

export function KPISection({ stats, loading }: KPISectionProps) {
  const kpis = [
    {
      id: 'efetivo',
      label: 'Efetivo em campo agora',
      value: stats.efetivoEmCampo,
    },
    {
      id: 'rdos',
      label: 'RDOs enviados hoje',
      value: stats.rdosHoje,
    },
    {
      id: 'vistorias',
      label: 'Vistorias realizadas hoje',
      value: stats.vistoriasHoje,
    },
    {
      id: 'ocorrencias',
      label: 'Ocorrências abertas',
      value: stats.ocorrenciasAbertas,
      highlight: stats.ocorrenciasAbertas > 0,
    },
  ];

  return (
    <section aria-label="KPIs em tempo real" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-hairline bg-surface rounded-[12px] overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-hairline">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="p-6 flex flex-col justify-between">
            <span className="text-[12px] font-normal uppercase tracking-[0.1em] text-muted mb-3">
              {kpi.label}
            </span>
            <div className="flex items-baseline">
              <span className="text-[36px] font-bold text-ink leading-none tracking-[-0.5px]">
                {loading ? '—' : kpi.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
