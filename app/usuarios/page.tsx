'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { UserProfile, DemoCredential, PerfilUsuario, StatusUsuario } from '@/types/usuarios';

export default function UsuariosPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'demo'>('usuarios');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [credentials, setCredentials] = useState<DemoCredential[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>('encarregado');
  const [senhaTemporaria, setSenhaTemporaria] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

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

  // Phone Mask helper: (11) 9.0000-0000 or (11) 90000-0000
  const applyPhoneMask = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 7)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}.${digits.slice(3)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}.${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  // Generate sequential/random temporary password
  const generateTempPassword = useCallback(() => {
    const seq = Math.floor(100 + Math.random() * 900);
    return `Lote1519@${seq}`;
  }, []);

  // Fetch users & credentials
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized, loadData]);

  // Open modal handler
  const handleOpenModal = () => {
    setNome('');
    setTelefone('');
    setPerfil('encarregado');
    setSenhaTemporaria(generateTempPassword());
    setModalError('');
    setIsModalOpen(true);
  };

  // Submit new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const cleanPhone = telefone.replace(/\D/g, '');
    if (!nome.trim()) {
      setModalError('Informe o nome completo');
      return;
    }
    if (cleanPhone.length < 10) {
      setModalError('Informe um telefone válido com DDD');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: cleanPhone,
          perfil,
          senhaTemporaria,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setIsModalOpen(false);
        setFeedbackMsg(`Acesso gerado e convite enviado para ${nome.trim()} via WhatsApp.`);
        setTimeout(() => setFeedbackMsg(''), 6000);
        loadData();
      } else {
        setModalError(data.error || 'Erro ao criar usuário');
      }
    } catch {
      setModalError('Falha na comunicação com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // Re-send access
  const handleResend = async (user: UserProfile) => {
    try {
      setFeedbackMsg(`Reenviando acesso para ${user.nome}...`);
      const res = await fetch('/api/users/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: user.telefone }),
      });
      if (res.ok) {
        setFeedbackMsg(`Acesso reenviado com sucesso para ${user.nome}.`);
        loadData();
      } else {
        setFeedbackMsg('Falha ao reenviar acesso.');
      }
    } catch {
      setFeedbackMsg('Erro de conexão ao reenviar.');
    } finally {
      setTimeout(() => setFeedbackMsg(''), 5000);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusLabel = (status: StatusUsuario) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'convite_enviado':
        return 'Convite enviado';
      case 'ativo':
        return 'Ativo';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  const getPerfilLabel = (p: string) => {
    switch (p.toLowerCase()) {
      case 'encarregado':
        return 'Encarregado';
      case 'supervisor':
        return 'Supervisor';
      case 'admin':
        return 'Administrador';
      default:
        return p;
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Banner de feedback temporário */}
        {feedbackMsg && (
          <div className="p-4 bg-surface border border-hairline border-l-4 border-l-ink text-xs font-medium text-ink">
            {feedbackMsg}
          </div>
        )}

        {/* Abas e Ações do Topo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-hairline pb-4 gap-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`pb-2 text-sm font-semibold tracking-tight transition-colors border-b-2 -mb-[17px] ${
                activeTab === 'usuarios'
                  ? 'border-ink text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Gestão de Usuários
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`pb-2 text-sm font-semibold tracking-tight transition-colors border-b-2 -mb-[17px] ${
                activeTab === 'demo'
                  ? 'border-ink text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Credenciais de Demonstração
            </button>
          </div>

          {activeTab === 'usuarios' && (
            <button
              onClick={handleOpenModal}
              className="h-10 px-5 bg-ink text-white text-xs font-semibold uppercase tracking-wider rounded-none hover:bg-neutral-800 transition-colors"
            >
              Adicionar usuário
            </button>
          )}
        </div>

        {/* ABA 1: LISTAGEM DE USUÁRIOS */}
        {activeTab === 'usuarios' && (
          <section className="w-full border border-hairline bg-surface overflow-hidden">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-hairline bg-canvas text-[11px] font-medium text-muted uppercase tracking-wider">
              <div className="col-span-3">Nome</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-2">Perfil</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Adicionado em</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>

            <div className="divide-y divide-hairline">
              {loading ? (
                <div className="px-6 py-12 text-center text-xs text-muted">
                  Carregando lista de usuários...
                </div>
              ) : users.length === 0 ? (
                <div className="px-6 py-12 text-center text-xs text-muted">
                  Nenhum usuário cadastrado. Clique em &quot;Adicionar usuário&quot; para iniciar.
                </div>
              ) : (
                users.map((u) => {
                  const canResend = u.status === 'pendente' || u.status === 'convite_enviado';
                  return (
                    <div
                      key={u.id}
                      className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-canvas/30 transition-colors text-[13px]"
                    >
                      <div className="col-span-3 font-semibold text-ink truncate pr-2">
                        {u.nome}
                      </div>
                      <div className="col-span-2 font-mono text-xs text-ink-soft">
                        {applyPhoneMask(u.telefone) || u.telefone}
                      </div>
                      <div className="col-span-2 text-ink-soft">
                        {getPerfilLabel(u.perfil)}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`text-xs font-normal ${
                            u.status === 'ativo'
                              ? 'text-emerald-700'
                              : u.status === 'convite_enviado'
                              ? 'text-amber-700'
                              : 'text-muted'
                          }`}
                        >
                          {getStatusLabel(u.status)}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-muted font-mono">
                        {formatDate(u.created_at)}
                      </div>
                      <div className="col-span-1 text-right">
                        {canResend && (
                          <button
                            onClick={() => handleResend(u)}
                            className="text-xs text-ink hover:text-accent font-semibold underline underline-offset-2 transition-colors"
                          >
                            Reenviar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ABA 2: SENHAS PADRÃO / CREDENCIAIS DE DEMONSTRAÇÃO */}
        {activeTab === 'demo' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-ink tracking-tight">
                Credenciais de demonstração
              </h2>
              <p className="text-xs text-muted mt-1">
                Senhas padrão para acesso rápido durante testes e demonstrações.
              </p>
            </div>

            <div className="w-full border border-hairline bg-surface overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 border-b border-hairline bg-canvas text-[11px] font-medium text-muted uppercase tracking-wider">
                <div className="col-span-3">Label</div>
                <div className="col-span-2">Telefone</div>
                <div className="col-span-3">Senha</div>
                <div className="col-span-2">Perfil</div>
                <div className="col-span-2 text-right">Ação</div>
              </div>

              <div className="divide-y divide-hairline">
                {credentials.map((cred) => {
                  const isCopied = copiedId === cred.id;
                  const copyText = `${cred.telefone} | ${cred.senha}`;

                  return (
                    <div
                      key={cred.id}
                      className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-canvas/30 transition-colors text-[13px]"
                    >
                      <div className="col-span-3 font-semibold text-ink">
                        {cred.label}
                      </div>
                      <div className="col-span-2 font-mono text-xs text-ink-soft">
                        {cred.telefone}
                      </div>
                      <div className="col-span-3 font-mono text-xs text-ink bg-canvas px-2.5 py-1 w-fit border border-hairline">
                        {cred.senha}
                      </div>
                      <div className="col-span-2 text-ink-soft">
                        {getPerfilLabel(cred.perfil)}
                      </div>
                      <div className="col-span-2 text-right">
                        <button
                          onClick={() => copyToClipboard(copyText, cred.id)}
                          className="px-3 py-1 bg-canvas hover:bg-neutral-200 border border-hairline text-xs font-medium text-ink transition-colors"
                        >
                          {isCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL DE ADIÇÃO DE USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-hairline p-8 rounded-none shadow-none">
            <div className="mb-6">
              <h3 className="text-base font-bold text-ink tracking-tight">
                Adicionar Usuário
              </h3>
              <p className="text-xs text-muted mt-1">
                Cadastro de credenciais e envio automático de convite via WhatsApp.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-ink mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Mendes"
                  required
                  className="w-full h-11 border border-hairline rounded-none px-3 text-ink text-sm bg-transparent outline-none focus:border-ink placeholder:text-muted"
                />
              </div>

              {/* Telefone WhatsApp */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-ink mb-1.5">
                  Telefone WhatsApp
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(applyPhoneMask(e.target.value))}
                  placeholder="(11) 9.0000-0000"
                  required
                  className="w-full h-11 border border-hairline rounded-none px-3 text-ink text-sm font-mono bg-transparent outline-none focus:border-ink placeholder:text-muted"
                />
              </div>

              {/* Perfil */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-ink mb-1.5">
                  Perfil de Acesso
                </label>
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
                  className="w-full h-11 border border-hairline rounded-none px-3 text-ink text-sm bg-surface outline-none focus:border-ink"
                >
                  <option value="encarregado">Encarregado (Acesso RDO)</option>
                  <option value="supervisor">Supervisor (Acesso Painel)</option>
                  <option value="admin">Administrador Geral</option>
                </select>
              </div>

              {/* Senha Temporária com Botão Copiar */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-ink mb-1.5">
                  Senha Temporária Gerada
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={senhaTemporaria}
                    className="flex-1 h-11 border border-hairline border-r-0 rounded-none px-3 text-ink text-sm font-mono bg-canvas"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(senhaTemporaria, 'temp-pwd')}
                    className="h-11 px-4 border border-hairline bg-canvas hover:bg-neutral-200 text-xs font-semibold text-ink transition-colors"
                  >
                    {copiedId === 'temp-pwd' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {modalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-erro text-xs">
                  {modalError}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-ink text-white font-semibold text-sm rounded-none hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Gerando acesso...' : 'Enviar acesso'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="w-full h-10 border border-hairline text-ink text-xs font-medium rounded-none hover:bg-canvas transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
