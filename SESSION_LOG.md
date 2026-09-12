# Session Log — MetricLab Painel Operacional

## Data: 12 de Setembro de 2026

### Objetivo
Criação do novo projeto Next.js 14 `metriclab-painel` do zero para demonstração ao vivo do Consórcio Lote 15 e 19, com deploy na Vercel em `painel.metriclab.com.br` e DNS CNAME no Cloudflare, integrado ao Supabase `keadkoqnvabhyxbrfjax` com Subscriptions Realtime, KPIs em tempo real, feed reverso de eventos com animação e mapa interativo de frentes via Mapbox GL JS.

---

### Stack Tecnológica
- **Framework**: Next.js 14 App Router, TypeScript, React 18
- **Estilização**: Tailwind CSS com o Design System MetricLab 2.0 rigoroso:
  - Fundo: `#F7F7F5` (canvas)
  - Superfície: `#FFFFFF` (cards)
  - Hairline: `1px solid #E2E2DC` e linha de cabeçalho `1.5px #111111`
  - Tipografia: Inter em todos os pesos
  - Sem border-radius nos elementos funcionais (`rounded-none`)
  - Sem sombras decorativas
  - Sem ícones
- **Autenticação**: Verificação de senha via API Route (`DEMO_PASSWORD=MetricLabDemo2026`) salvando sessão em `sessionStorage` (`demo_auth=true`)
- **Backend & Database**: Supabase (`keadkoqnvabhyxbrfjax`)
  - Tabelas públicas `rdos`, `vistorias`, `ocorrencias` integradas ao publication `supabase_realtime`
  - Triggers automáticos no Postgres sincronizando dados de `demo_rdo_registros`, `demo_lote15_vistorias` e `demo_rdo_ocorrencias`
  - Função RPC `get_kpis` executando queries consolidadas com fallback direto
- **Tempo Real**: Supabase Realtime Channel `demo-feed` com listeners para eventos de `INSERT` em `rdos`, `vistorias` e `ocorrencias`
- **Geolocalização / Mapeamento**: Mapbox GL JS com pins coloridos por tipo (RDO `#111111`, Vistoria `#F5A623`, Ocorrência `#DC2626`), tooltips detalhados ao clique e tabela de fallback com lat/lng caso token não seja configurado.

---

### Estrutura do Projeto
- `app/layout.tsx`: Configuração de fonte Inter e layout raiz MetricLab 2.0
- `app/globals.css`: Estilos base, scrollbar limpa, estilos Mapbox GL e animação `animate-fade-in` 300ms
- `app/login/page.tsx`: Tela de login minimalista com logo `m.`, input de senha e botão preto sólido
- `app/api/auth/route.ts`: API route para validação de credencial contra `process.env.DEMO_PASSWORD`
- `app/page.tsx`: Dashboard principal com autenticação guard, Supabase Realtime channel `demo-feed`
- `components/Header.tsx`: Cabeçalho fixo com logo `m.`, título do consórcio e relógio em tempo real segundo a segundo
- `components/KPISection.tsx`: 4 colunas com números 36px Inter 700 (Efetivo, RDOs, Vistorias, Ocorrências)
- `components/FeedSection.tsx`: Feed reverso (máx 20) com horário monospace, tipo, encarregado e frente com transição suave
- `components/MapSection.tsx`: Mapa interativo Mapbox GL JS 360px com pins por tipo e tooltips, com fallback tabular
- `lib/supabase.ts`: Cliente configurado com suporte a Realtime
- `types/painel.ts`: Tipagens TypeScript para KPIs, FeedItems e MapPins
