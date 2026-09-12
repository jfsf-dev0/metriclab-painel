export type PerfilUsuario = 'encarregado' | 'supervisor' | 'admin';

export type StatusUsuario = 'pendente' | 'convite_enviado' | 'ativo' | 'inativo';

export interface UserProfile {
  id: string;
  auth_user_id?: string | null;
  nome: string;
  telefone: string;
  perfil: PerfilUsuario;
  contrato_id?: string | null;
  senha_temporaria?: string | null;
  status: StatusUsuario;
  created_at: string;
  updated_at?: string;
}

export interface DemoCredential {
  id: number;
  label: string;
  telefone: string;
  senha: string;
  perfil: string;
  status?: string;
  created_at?: string;
}
