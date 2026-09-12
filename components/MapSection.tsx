'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from '@/types/painel';

interface MapSectionProps {
  pins: MapPin[];
  loading?: boolean;
}

export function MapSection({ pins, loading }: MapSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const [mapError, setMapError] = useState<string | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

  // Helper for pin colors
  const getTipoColor = (tipo: MapPin['tipo']) => {
    switch (tipo) {
      case 'RDO':
        return '#111111';
      case 'Vistoria':
        return '#F5A623';
      case 'Ocorrência':
        return '#DC2626';
      default:
        return '#111111';
    }
  };

  useEffect(() => {
    if (!mapboxToken) return;

    let isMounted = true;

    async function initMap() {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        mapboxgl.accessToken = mapboxToken;

        if (!mapContainerRef.current || !isMounted) return;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-46.6333, -23.5505], // [lng, lat]
          zoom: 11,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        map.on('error', (e) => {
          console.warn('Mapbox error:', e);
          if (isMounted) setMapError('Erro ao carregar mapa interativo Mapbox.');
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapInstanceRef.current = map;
        });
      } catch (err: any) {
        console.warn('Could not initialize Mapbox:', err);
        if (isMounted) setMapError(err?.message || 'Falha ao inicializar Mapbox');
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapboxToken]);

  // Sync markers when pins update
  useEffect(() => {
    if (!mapInstanceRef.current || !mapboxToken || mapError) return;

    const map = mapInstanceRef.current;

    async function updateMarkers() {
      const mapboxgl = (await import('mapbox-gl')).default;

      pins.forEach((pin) => {
        if (
          pin.latitude == null ||
          pin.longitude == null ||
          isNaN(pin.latitude) ||
          isNaN(pin.longitude)
        ) {
          return;
        }

        // Avoid re-creating existing marker
        if (markersRef.current[pin.id]) return;

        const color = getTipoColor(pin.tipo);

        const popupHtml = `
          <div style="font-family: Inter, sans-serif; padding: 6px 4px; font-size: 12px; color: #111111; line-height: 1.4;">
            <div style="font-weight: 700; color: ${color}; margin-bottom: 2px;">${pin.tipo}</div>
            <div style="font-weight: 500;">${pin.encarregado || 'Não informado'}</div>
            <div style="color: #6B7280; font-size: 11px;">${pin.frente || 'Frente Geral'}</div>
            <div style="color: #9CA3AF; font-size: 11px; margin-top: 3px; font-family: monospace;">${pin.horario}</div>
            <div style="color: #9CA3AF; font-size: 10px; font-family: monospace; margin-top: 2px;">
              ${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 20,
          closeButton: true,
          closeOnClick: true,
        }).setHTML(popupHtml);

        const marker = new mapboxgl.Marker({ color })
          .setLngLat([pin.longitude, pin.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current[pin.id] = marker;
      });
    }

    updateMarkers();
  }, [pins, mapboxToken, mapError]);

  const hasMapbox = Boolean(mapboxToken) && !mapError;

  return (
    <section aria-label="Mapa de frentes" className="w-full">
      <div className="border border-hairline bg-surface overflow-hidden">
        {/* Header da seção */}
        <div className="px-6 py-3.5 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
              Mapa de frentes de serviço
            </h2>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-none bg-ink" />
              <span className="text-muted">RDO</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-none bg-accent" />
              <span className="text-muted">Vistoria</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-none bg-erro" />
              <span className="text-muted">Ocorrência</span>
            </span>
            <span className="text-muted font-mono border-l border-hairline pl-4">
              {pins.length} posições mapeadas
            </span>
          </div>
        </div>

        {/* Mapa ou Tabela de fallback */}
        {hasMapbox ? (
          <div
            ref={mapContainerRef}
            className="w-full h-[360px] bg-[#F7F7F5]"
            style={{ minHeight: '360px' }}
          />
        ) : (
          <div className="w-full h-[360px] overflow-y-auto bg-surface">
            <div className="px-6 py-2 bg-canvas border-b border-hairline text-[11px] text-muted font-normal flex items-center justify-between">
              <span>
                Visualização tabular de frentes geolocalizadas (Token Mapbox não configurado)
              </span>
              <span className="font-mono">{pins.length} registros</span>
            </div>

            <div className="grid grid-cols-12 px-6 py-2.5 border-b border-hairline bg-surface text-[11px] font-medium text-muted uppercase tracking-wider sticky top-0">
              <div className="col-span-2">Horário</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-3">Encarregado</div>
              <div className="col-span-3">Frente</div>
              <div className="col-span-2 text-right">Coordenadas</div>
            </div>

            <div className="divide-y divide-hairline">
              {loading ? (
                <div className="px-6 py-12 text-center text-muted text-xs">
                  Carregando coordenadas...
                </div>
              ) : pins.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted text-xs">
                  Nenhum registro com geolocalização capturada hoje.
                </div>
              ) : (
                pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="grid grid-cols-12 px-6 py-2.5 items-center hover:bg-canvas/40 transition-colors text-[13px]"
                  >
                    <div className="col-span-2 font-mono text-muted">{pin.horario}</div>
                    <div className="col-span-2 flex items-center space-x-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-none"
                        style={{ backgroundColor: getTipoColor(pin.tipo) }}
                      />
                      <span
                        className="font-semibold"
                        style={{ color: getTipoColor(pin.tipo) }}
                      >
                        {pin.tipo}
                      </span>
                    </div>
                    <div className="col-span-3 text-ink-soft truncate pr-2">
                      {pin.encarregado}
                    </div>
                    <div className="col-span-3 text-muted truncate">{pin.frente}</div>
                    <div className="col-span-2 text-right font-mono text-xs text-muted">
                      {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
