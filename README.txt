Tosi Support Pro v6 - IT Help Desk / ITSM

Atualização: tela individual profissional do chamado com SLA, timeline, comentários, anexos, CMDB e relatório PDF por chamado.

TOSI TICKET V2

Inclui:
- Design mais profissional inspirado em help desks como TomTicket/Zendesk
- Login demo
- Dashboard com cards, fila, setores e prioridades
- Abertura de chamados com solicitante e anexos locais
- Listagem com busca, filtros e exportação CSV
- Modal de atendimento com status, responsável e histórico
- Kanban visual
- Base de conhecimento
- IA Tosi simulada para triagem
- Relatórios operacionais e SLA
- Configurações de departamentos e usuários
- Tema claro/escuro
- Proxy Vercel base

Login demo:
admin@tosi.com.br
123456

Como rodar:
1. Extraia o ZIP
2. npm install
3. npm run dev

Na Vercel:
Framework Preset: Other
Build Command: vazio
Output Directory: public
Install Command: npm install

Próxima etapa:
- Conectar Supabase real via proxy
- Criar autenticação com cookie HttpOnly
- Salvar chamados no banco
- Upload real no Supabase Storage

SPRINT 12 - Workflow Enterprise
- Adicionado menu Workflow.
- Criado board visual de fluxo ITSM com etapas configuráveis.
- Chamados podem ser arrastados entre etapas; status e histórico são atualizados.
- Adicionadas regras automáticas demonstrativas, analytics por etapa, KPIs e painel de configuração da etapa.
- Versão visual: v12.0 Workflow Enterprise.


SPRINT 14: Portal do Usuário Premium implementado. Acesse pelo menu "Portal do Usuário".


SPRINT 18: Business Intelligence Enterprise implementado. Acesse pelo menu Business Intelligence. Inclui KPIs executivos, saúde da TI, heatmap, ranking de técnicos, custos, ativos, exportações e modo TV/NOC.


SPRINT 19: Central NOC Enterprise implementada. Acesse pelo menu "Central NOC". Inclui monitoramento visual de serviços, rede, Microsoft 365, firewall, impressoras, mapa da empresa, linha do tempo, recomendações e Modo TV.


SPRINT 19 - Central NOC Enterprise
- Adicionado menu Central NOC.
- Painel de monitoramento visual com serviços críticos, SLA ao vivo, rede, Microsoft 365, firewall, impressoras, mapa da empresa e timeline operacional.
- Adicionado Modo TV para exibição em tela grande.
- Dados locais/demo integrados ao dashboard, chamados e CMDB.

Como testar:
1. Rode npm install e npm run dev.
2. Acesse com admin@tosi.com.br / 123456.
3. Clique no menu Central NOC.
4. Use o botão Modo TV para abrir o painel de monitoramento.


SPRINT 19 - NOC Modo TV vivo / dados sincronizados
- O botão Modo TV agora abre uma janela que mantém o relógio rodando.
- A tela de TV lê o snapshot vivo do NOC a cada 1 segundo.
- O front-end publica o snapshot localmente e envia para /api/noc-snapshot a cada 5 segundos.
- O endpoint /api/noc-snapshot salva no Supabase quando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estiverem configurados.
- Adicionada tabela noc_snapshots ao schema.sql.
- Enquanto o Supabase não estiver configurado, o sistema usa fallback local/demo.


SPRINT 21 - Banco Real + Supabase
- Dados falsos de chamados e ativos foram removidos do front-end.
- O sistema agora carrega chamados/ativos via /api/bootstrap.
- Novo chamado salva em /api/tickets e persiste no Supabase.
- CMDB/ativos serão lidos da tabela assets.
- NOC continua atualizando snapshot e pode persistir em noc_snapshots.
- Rode schema.sql no Supabase antes do deploy.
- Configure na Vercel: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
- Enquanto o Supabase não estiver configurado, o sistema fica vazio e exibe aviso de banco real.

SPRINT 21.1 - Limpeza real de aprovações
- Removidos dados demo do módulo Aprovações.
- Removido botão Restaurar demo.
- Aprovações agora carregam apenas do Supabase via /api/approvals.
- Se não houver dados reais, a tela mostra estado vazio.
- Adicionados endpoints GET/POST/PATCH para aprovações.
- Schema atualizado com campos adicionais e índices para aprovações reais.
