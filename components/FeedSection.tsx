'use client';

import React from 'react';
import { FeedItem } from '@/types/painel';

interface FeedSectionProps {
  items: FeedItem[];
  loading?: boolean;
}

export function FeedSection({ items, loading }: FeedSectionProps) {
  const getBadgeColor = (tipo: FeedItem['tipo']) => {
    switch (tipo) {
      case 'RDO':
        return 'text-ink';
      case 'Vistoria':
        return 'text-accent';
      case 'Ocorrência':
        return 'text-erro';
      default:
        return 'text-ink';
    }
  };

  const getDotBg = (tipo: FeedItem['tipo']) => {
    switch (tipo) {
      case 'RDO':
        return 'bg-ink';
      case 'Vistoria':
        return 'bg-accent';
      case 'Ocorrência':
        return 'bg-erro';
      default:
        return 'bg-ink';
    }
  };

  return (
    <section aria-label="Feed ao vivo" className="w-full">
      <div className="border border-hairline bg-surface rounded-[12px] overflow-hidden">
        {/* Header da seção */}
        <div className="px-6 py-3.5 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
              Feed ao vivo
            </h2>
          </div>
          <span className="text-xs text-muted font-mono">
            {loading ? 'Carregando feed...' : `${items.length} eventos recentes`}
          </span>
        </div>

        {/* Título das colunas */}
        <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 border-b border-hairline bg-canvas text-[11px] font-medium text-muted uppercase tracking-wider">
          <div className="col-span-2">Horário</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-4">Encarregado / Responsável</div>
          <div className="col-span-4">Frente / Trecho</div>
        </div>

        {/* Lista de eventos */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-hairline">
          {loading ? (
            <div className="px-6 py-12 text-center text-muted text-xs">
              Sincronizando feed com Supabase Realtime...
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted text-xs">
              Nenhuma atividade registrada até o momento.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`grid grid-cols-12 px-6 py-3 items-center hover:bg-canvas/40 transition-colors ${
                  item.isNew ? 'animate-fade-in bg-amber-50/40' : ''
                }`}
              >
                {/* Horário */}
                <div className="col-span-3 sm:col-span-2 text-[13px] font-normal font-mono text-muted">
                  {item.horario}
                </div>

                {/* Tipo */}
                <div className="col-span-3 sm:col-span-2 flex items-center space-x-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${getDotBg(item.tipo)}`} />
                  <span className={`text-[13px] font-semibold ${getBadgeColor(item.tipo)}`}>
                    {item.tipo}
                  </span>
                </div>

                {/* Encarregado */}
                <div className="col-span-6 sm:col-span-4 text-[13px] font-normal text-ink-soft truncate pr-2">
                  {item.encarregado || 'Não informado'}
                </div>

                {/* Frente */}
                <div className="col-span-12 sm:col-span-4 text-[13px] font-normal text-muted truncate mt-1 sm:mt-0">
                  {item.frente || 'Frente Geral'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
