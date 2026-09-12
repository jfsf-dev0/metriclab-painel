export interface KPIStats {
  efetivoEmCampo: number;
  rdosHoje: number;
  vistoriasHoje: number;
  ocorrenciasAbertas: number;
}

export interface FeedItem {
  id: string;
  horario: string;
  tipo: 'RDO' | 'Vistoria' | 'Ocorrência';
  encarregado: string;
  frente: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: number;
  isNew?: boolean;
}

export interface MapPin {
  id: string;
  tipo: 'RDO' | 'Vistoria' | 'Ocorrência';
  encarregado: string;
  frente: string;
  horario: string;
  latitude: number;
  longitude: number;
}
