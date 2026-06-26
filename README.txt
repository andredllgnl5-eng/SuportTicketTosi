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
