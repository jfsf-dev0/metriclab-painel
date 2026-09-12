'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { KPISection } from '@/components/KPISection';
import { FeedSection } from '@/components/FeedSection';
import { KPIStats, FeedItem, MapPin } from '@/types/painel';

// Dynamic import for MapSection to prevent SSR issues with mapbox-gl
const MapSection = dynamic(
  () => import('@/components/MapSection').then((mod) => mod.MapSection),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] bg-surface border border-hairline flex items-center justify-center text-xs text-muted">
        Carregando mapa...
      </div>
    ),
  }
);

const CONTRATO_ID =
  process.env.NEXT_PUBLIC_CONTRATO_ID || 'bc33de34-4c89-521c-9f56-c2918db3522a';

export default function PainelPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<KPIStats>({
    efetivoEmCampo: 0,
    rdosHoje: 0,
    vistoriasHoje: 0,
    ocorrenciasAbertas: 0,
  });
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Auth Guard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('demo_auth') === 'true';
      if (!isAuth) {
        router.replace('/login');
      } else {
        setAuthorized(true);
      }
    }
  }, [router]);

  // Format date helper
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
  };

  // 2. Fetch KPIs
  const fetchKPIs = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_kpis', {
        p_contrato_id: CONTRATO_ID,
      });

      if (!error && data) {
        setStats({
          efetivoEmCampo: Number(data.efetivoEmCampo || 0),
          rdosHoje: Number(data.rdosHoje || 0),
          vistoriasHoje: Number(data.vistoriasHoje || 0),
          ocorrenciasAbertas: Number(data.ocorrenciasAbertas || 0),
        });
        return;
      }
    } catch (err) {
      console.warn('RPC get_kpis fallback:', err);
    }

    // Direct query fallback
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const isoToday = startOfDay.toISOString();

      const [rdosRes, vistoriasRes, ocorrenciasRes] = await Promise.all([
        supabase
          .from('rdos')
          .select('colaborador_id', { count: 'exact' })
          .eq('contrato_id', CONTRATO_ID)
          .gte('created_at', isoToday),
        supabase
          .from('vistorias')
          .select('id', { count: 'exact', head: true })
          .eq('contrato_id', CONTRATO_ID)
          .gte('created_at', isoToday),
        supabase
          .from('ocorrencias')
          .select('id', { count: 'exact', head: true })
          .eq('contrato_id', CONTRATO_ID)
          .eq('status', 'aberta'),
      ]);

      const distinctColabs = new Set(
        rdosRes.data?.map((r) => r.colaborador_id).filter(Boolean)
      );

      setStats({
        efetivoEmCampo: distinctColabs.size,
        rdosHoje: rdosRes.count || 0,
        vistoriasHoje: vistoriasRes.count || 0,
        ocorrenciasAbertas: ocorrenciasRes.count || 0,
      });
    } catch (e) {
      console.error('Error fetching fallback KPIs:', e);
    }
  }, []);

  // 3. Fetch Initial Feed & Map Data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);

      const [rdosRes, vistoriasRes, ocorrenciasRes] = await Promise.all([
        supabase
          .from('rdos')
          .select('id, created_at, encarregado, frente, latitude, longitude')
          .eq('contrato_id', CONTRATO_ID)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('vistorias')
          .select('id, created_at, encarregado, frente, latitude, longitude')
          .eq('contrato_id', CONTRATO_ID)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('ocorrencias')
          .select('id, created_at, encarregado, frente, latitude, longitude')
          .eq('contrato_id', CONTRATO_ID)
          .order('created_at', { ascending: false })
          .limit(15),
      ]);

      const items: FeedItem[] = [];
      const pins: MapPin[] = [];

      // Process RDOs
      (rdosRes.data || []).forEach((row) => {
        const time = formatTime(row.created_at);
        const item: FeedItem = {
          id: `rdo-${row.id}`,
          horario: time,
          tipo: 'RDO',
          encarregado: row.encarregado || 'Encarregado Geral',
          frente: row.frente || 'Frente Geral',
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: new Date(row.created_at).getTime(),
        };
        items.push(item);

        if (row.latitude != null && row.longitude != null) {
          pins.push({
            id: `rdo-${row.id}`,
            tipo: 'RDO',
            encarregado: item.encarregado,
            frente: item.frente,
            horario: item.horario,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
          });
        }
      });

      // Process Vistorias
      (vistoriasRes.data || []).forEach((row) => {
        const time = formatTime(row.created_at);
        const item: FeedItem = {
          id: `vistoria-${row.id}`,
          horario: time,
          tipo: 'Vistoria',
          encarregado: row.encarregado || 'Inspetor de Campo',
          frente: row.frente || 'Frente Geral',
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: new Date(row.created_at).getTime(),
        };
        items.push(item);

        if (row.latitude != null && row.longitude != null) {
          pins.push({
            id: `vistoria-${row.id}`,
            tipo: 'Vistoria',
            encarregado: item.encarregado,
            frente: item.frente,
            horario: item.horario,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
          });
        }
      });

      // Process Ocorrências
      (ocorrenciasRes.data || []).forEach((row) => {
        const time = formatTime(row.created_at);
        const item: FeedItem = {
          id: `ocorrencia-${row.id}`,
          horario: time,
          tipo: 'Ocorrência',
          encarregado: row.encarregado || 'Encarregado',
          frente: row.frente || 'Frente Geral',
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: new Date(row.created_at).getTime(),
        };
        items.push(item);

        if (row.latitude != null && row.longitude != null) {
          pins.push({
            id: `ocorrencia-${row.id}`,
            tipo: 'Ocorrência',
            encarregado: item.encarregado,
            frente: item.frente,
            horario: item.horario,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
          });
        }
      });

      // Sort reverse chronological
      items.sort((a, b) => b.timestamp - a.timestamp);

      setFeedItems(items.slice(0, 20));
      setMapPins(pins);
    } catch (err) {
      console.error('Error fetching initial feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Supabase Realtime Subscription
  useEffect(() => {
    if (!authorized) return;

    fetchKPIs();
    fetchInitialData();

    const handleNewRdo = (payload: any) => {
      const record = payload.new;
      if (!record) return;

      const time = formatTime(record.created_at || new Date().toISOString());
      const newItem: FeedItem = {
        id: `rdo-${record.id}`,
        horario: time,
        tipo: 'RDO',
        encarregado: record.encarregado || 'Encarregado Geral',
        frente: record.frente || 'Frente Geral',
        latitude: record.latitude,
        longitude: record.longitude,
        timestamp: record.created_at
          ? new Date(record.created_at).getTime()
          : Date.now(),
        isNew: true,
      };

      setFeedItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)].slice(0, 20));

      if (record.latitude != null && record.longitude != null) {
        setMapPins((prev) => [
          {
            id: newItem.id,
            tipo: 'RDO',
            encarregado: newItem.encarregado,
            frente: newItem.frente,
            horario: newItem.horario,
            latitude: Number(record.latitude),
            longitude: Number(record.longitude),
          },
          ...prev.filter((p) => p.id !== newItem.id),
        ]);
      }

      fetchKPIs();
    };

    const handleNewVistoria = (payload: any) => {
      const record = payload.new;
      if (!record) return;

      const time = formatTime(record.created_at || new Date().toISOString());
      const newItem: FeedItem = {
        id: `vistoria-${record.id}`,
        horario: time,
        tipo: 'Vistoria',
        encarregado: record.encarregado || 'Inspetor de Campo',
        frente: record.frente || 'Frente Geral',
        latitude: record.latitude,
        longitude: record.longitude,
        timestamp: record.created_at
          ? new Date(record.created_at).getTime()
          : Date.now(),
        isNew: true,
      };

      setFeedItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)].slice(0, 20));

      if (record.latitude != null && record.longitude != null) {
        setMapPins((prev) => [
          {
            id: newItem.id,
            tipo: 'Vistoria',
            encarregado: newItem.encarregado,
            frente: newItem.frente,
            horario: newItem.horario,
            latitude: Number(record.latitude),
            longitude: Number(record.longitude),
          },
          ...prev.filter((p) => p.id !== newItem.id),
        ]);
      }

      fetchKPIs();
    };

    const handleNewOcorrencia = (payload: any) => {
      const record = payload.new;
      if (!record) return;

      const time = formatTime(record.created_at || new Date().toISOString());
      const newItem: FeedItem = {
        id: `ocorrencia-${record.id}`,
        horario: time,
        tipo: 'Ocorrência',
        encarregado: record.encarregado || 'Encarregado',
        frente: record.frente || 'Frente Geral',
        latitude: record.latitude,
        longitude: record.longitude,
        timestamp: record.created_at
          ? new Date(record.created_at).getTime()
          : Date.now(),
        isNew: true,
      };

      setFeedItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)].slice(0, 20));

      if (record.latitude != null && record.longitude != null) {
        setMapPins((prev) => [
          {
            id: newItem.id,
            tipo: 'Ocorrência',
            encarregado: newItem.encarregado,
            frente: newItem.frente,
            horario: newItem.horario,
            latitude: Number(record.latitude),
            longitude: Number(record.longitude),
          },
          ...prev.filter((p) => p.id !== newItem.id),
        ]);
      }

      fetchKPIs();
    };

    const channel = supabase
      .channel('demo-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rdos',
          filter: `contrato_id=eq.${CONTRATO_ID}`,
        },
        handleNewRdo
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vistorias',
          filter: `contrato_id=eq.${CONTRATO_ID}`,
        },
        handleNewVistoria
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ocorrencias',
          filter: `contrato_id=eq.${CONTRATO_ID}`,
        },
        handleNewOcorrencia
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime channel demo-feed subscribed');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authorized, fetchKPIs, fetchInitialData]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-xs text-muted font-mono">Verificando autorização...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* SEÇÃO 1: KPIs */}
        <KPISection stats={stats} loading={loading} />

        {/* SEÇÃO 2: Feed ao vivo */}
        <FeedSection items={feedItems} loading={loading} />

        {/* SEÇÃO 3: Mapa de frentes */}
        <MapSection pins={mapPins} loading={loading} />
      </main>

      <footer className="w-full border-t border-hairline py-4 mt-8 bg-surface">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-muted">
          <span>Consórcio Lote 15 e 19 · MetricLab 2.0</span>
          <span>Sincronização em tempo real via Supabase</span>
        </div>
      </footer>
    </div>
  );
}
