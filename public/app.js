const $=id=>document.getElementById(id);
const KEY='tosi-support-pro-v13';
const departments=['TI','Compras','Manutenção','Qualidade','RH','Produção','Engenharia','Financeiro'];
const categories=['Suporte Técnico','Acesso / Senha','Rede / Internet','Impressoras','ERP / Sistemas','Hardware','Software','E-mail / Microsoft 365','Segurança da Informação','Solicitação','Manutenção TI','Bug / Sistema'];
const statusList=['Aberto','Em atendimento','Aguardando usuário','Resolvido','Fechado'];
const users=[{name:'Administrador',email:'admin@tosi.com.br',role:'ADM',sector:'TI'},{name:'Carlos Oliveira',email:'carlos@tosi.com.br',role:'Atendente N2',sector:'TI'},{name:'Ana Paula',email:'ana@tosi.com.br',role:'Gestora',sector:'TI'},{name:'João da Silva',email:'joao@tosi.com.br',role:'Usuário',sector:'PCP'}];
const assets=[
{id:'AT-0001',nome:'Notebook Dell Latitude 5420',tipo:'Notebook',usuario:'João da Silva',local:'PCP',status:'Em uso',risco:'Baixo',garantia:'12/2026'},
{id:'AT-0002',nome:'Impressora HP LaserJet M428',tipo:'Impressora',usuario:'Setor PCP',local:'PCP',status:'Atenção',risco:'Médio',garantia:'08/2026'},
{id:'AT-0003',nome:'Servidor Aplicações Internas',tipo:'Servidor',usuario:'TI',local:'Sala TI',status:'Crítico',risco:'Alto',garantia:'05/2027'},
{id:'AT-0004',nome:'Access Point Escritório',tipo:'Rede',usuario:'Todos',local:'Administrativo',status:'Em uso',risco:'Baixo',garantia:'10/2026'},
{id:'AT-0005',nome:'Desktop Financeiro 02',tipo:'Desktop',usuario:'Fernanda Lima',local:'Financeiro',status:'Em uso',risco:'Baixo',garantia:'01/2027'}];

const assetExtras={
 'AT-0001':{brand:'Dell',model:'Latitude 5420',serial:'DL5420-PCP-001',os:'Windows 11 Pro',cpu:'Intel Core i7',ram:'16 GB',disk:'512 GB SSD',ip:'192.168.10.41',mac:'A4:5E:60:10:21:01',vendor:'Dell Brasil',nf:'NF-18452',purchase:'14/01/2024',value:6200,availability:'99,5%',lastMaint:'18 dias atrás',photo:'💻',software:['Windows 11 Pro','Microsoft 365','Chrome','AnyDesk','Antivírus','ERP Client'],licenses:['Windows OEM','Microsoft 365 Business','Antivírus Endpoint'],docs:['Nota fiscal','Termo de responsabilidade','Garantia Dell','Manual do usuário']},
 'AT-0002':{brand:'HP',model:'LaserJet M428',serial:'HP-M428-PCP-002',os:'Firmware 4.12',cpu:'Print Server',ram:'512 MB',disk:'-',ip:'192.168.10.80',mac:'B0:5A:DA:22:10:02',vendor:'HP / Revenda local',nf:'NF-19220',purchase:'10/03/2023',value:2800,availability:'92,1%',lastMaint:'6 dias atrás',photo:'🖨️',software:['Driver Universal HP','Fila de impressão PCP','Print Server'],licenses:['Firmware HP','Contrato de suprimentos'],docs:['Nota fiscal','Manual técnico','Contrato toner','Termo de instalação']},
 'AT-0003':{brand:'Dell',model:'PowerEdge T350',serial:'SRV-TOSI-003',os:'Windows Server 2022',cpu:'Xeon E-2336',ram:'64 GB',disk:'2 TB RAID',ip:'192.168.1.10',mac:'D8:9E:F3:01:12:03',vendor:'Dell Brasil',nf:'NF-17610',purchase:'02/05/2023',value:28500,availability:'97,8%',lastMaint:'Hoje',photo:'🖥️',software:['Windows Server','SQL Server','Backup Agent','Antivírus Server','Monitoramento'],licenses:['Windows Server CAL','SQL Server','Backup Cloud'],docs:['Nota fiscal','Contrato suporte','Plano de backup','Diagrama de rede']},
 'AT-0004':{brand:'Ubiquiti',model:'UniFi AP AC Pro',serial:'UBNT-AP-004',os:'UniFi OS',cpu:'-',ram:'-',disk:'-',ip:'192.168.10.2',mac:'78:8A:20:44:04',vendor:'Ubiquiti',nf:'NF-15544',purchase:'19/08/2024',value:980,availability:'99,9%',lastMaint:'35 dias atrás',photo:'🌐',software:['UniFi Controller','SSID Corporativo','SSID Visitantes'],licenses:['Controller gratuito'],docs:['Nota fiscal','Mapa Wi-Fi','Configuração VLAN']},
 'AT-0005':{brand:'Lenovo',model:'ThinkCentre M70q',serial:'LEN-FIN-005',os:'Windows 11 Pro',cpu:'Intel Core i5',ram:'16 GB',disk:'256 GB SSD',ip:'192.168.20.22',mac:'AC:12:44:51:05',vendor:'Lenovo',nf:'NF-20102',purchase:'05/02/2024',value:4300,availability:'99,2%',lastMaint:'22 dias atrás',photo:'🖥️',software:['Windows 11 Pro','Microsoft 365','ERP Financeiro','Chrome','Antivírus'],licenses:['Windows OEM','Microsoft 365 Business'],docs:['Nota fiscal','Termo de responsabilidade','Garantia Lenovo']}
};
const serviceCatalog=[
{icon:'🔐',name:'Reset de senha',sla:'4h',owner:'Service Desk',desc:'Recuperação de acesso, desbloqueio e redefinição de credenciais.'},
{icon:'💻',name:'Suporte a computador',sla:'8h',owner:'Suporte N1/N2',desc:'Problemas em notebook, desktop, periféricos e desempenho.'},
{icon:'🖨️',name:'Impressoras',sla:'6h',owner:'Infraestrutura',desc:'Fila travada, troca de toner, impressão em rede e drivers.'},
{icon:'🌐',name:'Rede / Internet',sla:'2h',owner:'Infraestrutura',desc:'Queda de rede, Wi-Fi, cabo, switch e conectividade.'},
{icon:'📧',name:'E-mail corporativo',sla:'8h',owner:'Microsoft 365',desc:'Outlook, assinatura, caixa compartilhada e spam.'},
{icon:'🧾',name:'ERP / Sistemas',sla:'12h',owner:'Sistemas',desc:'Erros em sistemas internos, permissões e integrações.'},
{icon:'🛡️',name:'Segurança da Informação',sla:'1h',owner:'Segurança',desc:'Suspeita de phishing, vírus, vazamento ou acesso indevido.'},
{icon:'🔄',name:'Mudança de TI',sla:'48h',owner:'Gestão TI',desc:'Alterações planejadas em sistemas, servidores e infraestrutura.'}];
function nowMinus(h){return new Date(Date.now()-h*3600*1000).toISOString()}function plus(h){return new Date(Date.now()+h*3600*1000).toISOString()}
let tickets=JSON.parse(localStorage.getItem(KEY)||'null')||[
{id:'CH-2026-0256',title:'Impressora não está imprimindo',requester:'João da Silva',sector:'TI',category:'Impressoras',priority:'Alta',status:'Em atendimento',type:'Incidente',asset:'AT-0002',impact:'Alto',createdAt:nowMinus(2),updatedAt:nowMinus(1),slaDueAt:plus(4),responsible:'Carlos Oliveira',attachments:['print-erro.png'],description:'Fila de impressão travada no setor PCP. Usuários sem conseguir imprimir OPs.',history:['Chamado aberto pelo usuário','Atendimento iniciado por Carlos Oliveira']},
{id:'CH-2026-0255',title:'Solicitação de compra de material de TI',requester:'Maria Santos',sector:'Compras',category:'Solicitação',priority:'Média',status:'Aberto',type:'Requisição',asset:'',impact:'Médio',createdAt:nowMinus(4),updatedAt:nowMinus(3),slaDueAt:plus(18),responsible:'Service Desk',attachments:[],description:'Solicitação de mouse, teclado e cabo HDMI para sala de reunião.',history:['Chamado aberto']},
{id:'CH-2026-0254',title:'Certidão de fornecedor vencendo no portal',requester:'Carlos Oliveira',sector:'Qualidade',category:'ERP / Sistemas',priority:'Baixa',status:'Aguardando usuário',type:'Requisição',asset:'',impact:'Baixo',createdAt:nowMinus(26),updatedAt:nowMinus(25),slaDueAt:plus(30),responsible:'Ana Paula',attachments:['certidao.pdf'],description:'Sistema de fornecedores está alertando certidão próxima do vencimento.',history:['Chamado aberto','Solicitada confirmação do fornecedor']},
{id:'CH-2026-0253',title:'Acesso ao sistema ERP bloqueado',requester:'Ana Paula',sector:'TI',category:'Acesso / Senha',priority:'Alta',status:'Aberto',type:'Acesso',asset:'',impact:'Alto',createdAt:nowMinus(26),updatedAt:nowMinus(25),slaDueAt:plus(1),responsible:'Service Desk',attachments:[],description:'Usuária não consegue acessar o ERP após tentativas de login.',history:['Chamado aberto']},
{id:'CH-2026-0252',title:'Manutenção de ar condicionado da sala TI',requester:'José Roberto',sector:'Manutenção',category:'Manutenção TI',priority:'Média',status:'Em atendimento',type:'Incidente',asset:'AT-0003',impact:'Médio',createdAt:nowMinus(34),updatedAt:nowMinus(25),slaDueAt:plus(8),responsible:'Carlos Oliveira',attachments:[],description:'Temperatura da sala TI acima do normal. Risco para servidor.',history:['Chamado aberto','Acionado manutenção']},
{id:'CH-2026-0251',title:'Solicitação de EPI para técnico externo',requester:'Fernanda Lima',sector:'RH',category:'Solicitação',priority:'Baixa',status:'Fechado',type:'Requisição',asset:'',impact:'Baixo',createdAt:nowMinus(55),updatedAt:nowMinus(50),slaDueAt:nowMinus(45),closedAt:nowMinus(50),responsible:'Service Desk',attachments:[],description:'Solicitação encerrada.',history:['Chamado aberto','Finalizado']},
{id:'CH-2026-0250',title:'Falha no login do portal interno',requester:'Paulo Henrique',sector:'TI',category:'Bug / Sistema',priority:'Alta',status:'Em atendimento',type:'Problema',asset:'',impact:'Crítico',createdAt:nowMinus(80),updatedAt:nowMinus(78),slaDueAt:nowMinus(10),responsible:'Ana Paula',attachments:['erro-login.png'],description:'Usuários relatam erro intermitente no portal interno.',history:['Chamado aberto','Escalado para sistemas']}
];
const navItems=[['dashboard','⌂','Dashboard'],['tickets','▣','Chamados'],['newTicket','＋','Novo Chamado'],['kanban','▦','Kanban'],['workflow','⟲','Workflow'],['automations','⚡','Automações'],['serviceCatalog','◈','Catálogo de Serviços'],['assets','▥','Ativos TI / CMDB'],['knowledge','▤','Base de Conhecimento'],['reports','▧','Relatórios'],['settings','⚙','Configurações']];
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function saveAll(){localStorage.setItem(KEY,JSON.stringify(tickets))}
function fmtDate(v){return new Date(v).toLocaleDateString('pt-BR')}function fmt(v){return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}
function isClosed(t){return ['Resolvido','Fechado'].includes(t.status)}function isLate(t){return !isClosed(t)&&new Date(t.slaDueAt)<new Date()}
function slaPercent(t){if(isClosed(t))return 100;const start=new Date(t.createdAt),due=new Date(t.slaDueAt),now=new Date();const total=due-start;if(total<=0)return 100;return Math.max(0,Math.min(100,Math.round((now-start)/total*100)))}
function init(){nav.innerHTML=navItems.map(([id,ic,label])=>`<button class="nav-btn" data-page="${id}"><span>${ic}</span>${label}</button>`).join('');document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>showPage(b.dataset.page));loginForm.onsubmit=e=>{e.preventDefault();loginScreen.classList.add('hidden');app.classList.remove('hidden');renderAll();};logoutBtn.onclick=()=>{app.classList.add('hidden');loginScreen.classList.remove('hidden')};themeBtn.onclick=()=>document.body.classList.toggle('dark');exportBtn.onclick=openReportCenter;printReportBtn.onclick=generateReportWindow;reportBtn.onclick=renderReports;ticketForm.onsubmit=createTicket;globalSearch.oninput=()=>{if(document.querySelector('#tickets.active-page'))renderTicketsTable()};['filterSector','filterCategory','filterPriority','filterStatus','filterSla'].forEach(id=>$(id).onchange=renderTicketsTable);fillOptions();showPage('dashboard');renderAll();}
function fillOptions(){filterSector.innerHTML='<option value="">Todos</option>'+departments.map(d=>`<option>${d}</option>`).join('');filterCategory.innerHTML='<option value="">Todas</option>'+categories.map(c=>`<option>${c}</option>`).join('');filterStatus.innerHTML='<option value="">Todos</option>'+statusList.map(s=>`<option>${s}</option>`).join('');ticketSector.innerHTML=departments.map(d=>`<option>${d}</option>`).join('');ticketCategory.innerHTML=categories.map(c=>`<option>${c}</option>`).join('');ticketAsset.innerHTML='<option value="">Nenhum</option>'+assets.map(a=>`<option value="${a.id}">${a.id} - ${a.nome}</option>`).join('');}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active-page'));$(id).classList.add('active-page');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===id));const titles={dashboard:'Dashboard Executivo',tickets:'Chamados',ticketDetail:'Chamado 360°',newTicket:'Novo Chamado',kanban:'Kanban',serviceCatalog:'Catálogo de Serviços',assets:'CMDB Enterprise',knowledge:'Base de Conhecimento',reports:'Relatórios',settings:'Configurações',assetDetail:'Ativo 360°',workflow:'Workflow Enterprise',automations:'Automações Enterprise'};pageTitle.textContent=titles[id]||'Tosi Support Pro';pageSubtitle.textContent=titles[id]||'';renderAll();}
function filteredTickets(){const q=globalSearch.value?.toLowerCase().trim()||'';return tickets.filter(t=>(!q||[t.id,t.title,t.requester,t.sector,t.category,t.status,t.asset].join(' ').toLowerCase().includes(q))&&(!filterSector.value||t.sector===filterSector.value)&&(!filterCategory.value||t.category===filterCategory.value)&&(!filterPriority.value||t.priority===filterPriority.value)&&(!filterStatus.value||t.status===filterStatus.value)&&(!filterSla.value||(filterSla.value==='late'?isLate(t):!isLate(t))))}
function counts(data=tickets){return{total:data.length,open:data.filter(t=>t.status==='Aberto').length,work:data.filter(t=>t.status==='Em atendimento').length,wait:data.filter(t=>t.status==='Aguardando usuário').length,done:data.filter(isClosed).length,late:data.filter(isLate).length}}
function setText(id,v){const e=$(id); if(e)e.textContent=v}
function renderAll(){const c=counts();['','Tickets'].forEach(s=>{setText('statTotal'+s,c.total);setText('statOpen'+s,c.open);setText('statWork'+s,c.work);setText('statWaiting'+s,c.wait);setText('statDone'+s,c.done);setText('statLate'+s,c.late)});renderDonut('statusDonut',tickets);renderBars('sectorBars',tickets);renderSlaPanel('slaPanel',tickets);renderCriticalQueue();renderTicketsTable();renderKanban();renderWorkflow();renderAutomations();renderCatalog();renderAssets();renderKb();renderReports();renderSettings();}
function renderDonut(el,data){if(!$(el))return;const total=Math.max(1,data.length),open=data.filter(t=>t.status==='Aberto').length,work=data.filter(t=>t.status==='Em atendimento').length,wait=data.filter(t=>t.status==='Aguardando usuário').length,done=data.filter(isClosed).length;let p1=open/total*100,p2=work/total*100,p3=wait/total*100;$(el).innerHTML=`<div class="donut-layout"><div class="donut" style="background:conic-gradient(#12b76a 0 ${p1}%, #1465ff ${p1}% ${p1+p2}%, #f5b700 ${p1+p2}% ${p1+p2+p3}%, #98a2b3 ${p1+p2+p3}% 100%)"><strong>${data.length}<small>Total</small></strong></div><div class="legend"><span style="--c:#12b76a"><b>Aberto</b><b>${open}</b></span><span style="--c:#1465ff"><b>Em atendimento</b><b>${work}</b></span><span style="--c:#f5b700"><b>Aguardando usuário</b><b>${wait}</b></span><span style="--c:#98a2b3"><b>Resolvido/Fechado</b><b>${done}</b></span></div></div>`}
function renderBars(el,data){if(!$(el))return;const groups={};data.forEach(t=>groups[t.sector]=(groups[t.sector]||0)+1);const max=Math.max(1,...Object.values(groups));$(el).innerHTML=Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar-track"><i style="width:${v/max*100}%"></i></div><b>${v}</b></div>`).join('')}
function renderSlaPanel(el,data){if(!$(el))return;const total=Math.max(1,data.length),late=data.filter(isLate).length,ok=data.length-late,score=Math.round(ok/total*100);$(el).innerHTML=`<div class="sla-score"><div class="circle" style="background:conic-gradient(#12b76a 0 ${score}%,#eef3f8 ${score}%)"><span>${score}%</span></div><div><p><strong>Taxa de Cumprimento</strong></p><div class="report-metric"><span>Dentro do prazo</span><strong>${ok}</strong></div><div class="report-metric"><span>Vencidos</span><strong>${late}</strong></div><div class="report-metric"><span>Total</span><strong>${data.length}</strong></div></div></div>`}
function renderCriticalQueue(){if(!criticalQueue)return;const critical=tickets.filter(t=>t.priority==='Alta'||t.priority==='Crítica'||isLate(t)).slice(0,4);criticalQueue.innerHTML=critical.map(t=>`<div class="critical-item"><div><strong>${esc(t.id)}</strong><br><span>${esc(t.title)}</span></div><span class="badge ${esc(t.priority)}">${isLate(t)?'SLA vencido':esc(t.priority)}</span></div>`).join('')||'<p>Nenhum chamado crítico.</p>'}
function renderTicketsTable(){if(!ticketsTable)return;const data=filteredTickets();const rows=data.map(t=>{const p=slaPercent(t);const stClass=isClosed(t)?'done':t.status==='Aguardando usuário'?'wait':'status';return `<tr><td><input type="checkbox"></td><td><a class="id-link" href="#" onclick="openTicket('${esc(t.id)}');return false;">${esc(t.id)}</a></td><td class="title-cell">${esc(t.title)}</td><td>${esc(t.requester)}</td><td>${esc(t.sector)}</td><td>${esc(t.category)}</td><td><span class="badge ${esc(t.priority)}">${esc(t.priority)}</span></td><td><span class="badge ${stClass}">${esc(t.status)}</span></td><td>${esc(t.type||'Incidente')}</td><td>${esc(t.asset||'-')}</td><td class="sla-cell"><span>${p}%</span><div class="bar"><i style="width:${p}%;background:${isLate(t)?'#f04438':isClosed(t)?'#12b76a':p>75?'#12b76a':p>45?'#f79009':'#f04438'}"></i></div></td><td>${fmt(t.createdAt)}</td><td>${fmt(t.updatedAt)}</td><td><button class="action-btn" onclick="openTicket('${esc(t.id)}')">...</button></td></tr>`}).join('');ticketsTable.innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th></th><th>Protocolo</th><th>Título</th><th>Solicitante</th><th>Setor</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Tipo</th><th>Ativo</th><th>SLA</th><th>Criado em</th><th>Atualizado em</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="14">Nenhum chamado encontrado.</td></tr>'}</tbody></table></div><div class="table-footer"><span>Mostrando 1 a ${data.length} de ${tickets.length} registros</span><div class="pages"><button class="page-btn">‹</button><button class="page-btn active">1</button><button class="page-btn">2</button><button class="page-btn">3</button><span>...</span><button class="page-btn">37</button><button class="page-btn">›</button><button class="page-btn">10 / página⌄</button></div></div>`}
function renderKanban(){if(!kanbanBoard)return;kanbanBoard.innerHTML=statusList.map(s=>`<div class="kanban-col"><h3>${s}</h3>${tickets.filter(t=>t.status===s).map(t=>`<div class="kanban-card" onclick="openTicket('${esc(t.id)}')"><strong>${esc(t.id)}</strong><p>${esc(t.title)}</p><span class="badge ${esc(t.priority)}">${esc(t.priority)}</span><br><small>${esc(t.type)} • ${fmtDate(t.createdAt)}</small></div>`).join('')||'<small>Sem chamados</small>'}</div>`).join('')}
function renderCatalog(){if(!catalogGrid)return;catalogGrid.innerHTML=serviceCatalog.map(s=>`<div class="card catalog-card"><div class="catalog-icon">${s.icon}</div><h4>${esc(s.name)}</h4><p>${esc(s.desc)}</p><div class="report-metric"><span>SLA</span><strong>${esc(s.sla)}</strong></div><div class="report-metric"><span>Responsável</span><strong>${esc(s.owner)}</strong></div></div>`).join('')}
function assetIcon(a){return a.tipo==='Impressora'?'🖨️':a.tipo==='Servidor'?'🖥️':a.tipo==='Rede'?'🌐':a.tipo==='Desktop'?'🖥️':'💻'}
function assetScore(a){
  const related=tickets.filter(t=>t.asset===a.id), late=related.filter(isLate).length, open=related.filter(t=>!isClosed(t)).length;
  let score=96;
  if(a.status==='Atenção')score-=18; if(a.status==='Crítico')score-=32; if(a.risco==='Alto')score-=18; if(a.risco==='Médio')score-=8; score-=late*12+open*5;
  return Math.max(22,Math.min(100,score));
}
function assetStatusClass(a){const s=assetScore(a);return s<55?'danger':s<76?'warn':'ok'}
function warrantyState(a){
  const [m,y]=String(a.garantia||'12/2026').split('/').map(Number); const end=new Date(y,m,0), days=Math.ceil((end-new Date())/86400000);
  return {days,label:days<0?'Vencida':days<90?'Vence em breve':'Vigente',cls:days<0?'danger':days<90?'warn':'ok'};
}
function renderAssets(){if(!assetsTable)return;
  const total=assets.length, critical=assets.filter(a=>assetStatusClass(a)==='danger'||a.status==='Crítico').length, attention=assets.filter(a=>assetStatusClass(a)==='warn'||a.status==='Atenção').length, linked=new Set(tickets.map(t=>t.asset).filter(Boolean)).size;
  if(window.cmdbKpis)cmdbKpis.innerHTML=`<div class="cmdb-kpi"><small>Total de ativos</small><strong>${total}</strong><span>Inventário TI</span></div><div class="cmdb-kpi danger"><small>Críticos</small><strong>${critical}</strong><span>Risco operacional</span></div><div class="cmdb-kpi warn"><small>Em atenção</small><strong>${attention}</strong><span>Monitoramento</span></div><div class="cmdb-kpi ok"><small>Vinculados</small><strong>${linked}</strong><span>Com chamados</span></div>`;
  assetsTable.innerHTML=`<div class="cmdb-toolbar"><div><h3>Inventário corporativo</h3><p> Clique em um ativo para abrir a visão 360°.</p></div><div class="cmdb-search"><input id="assetSearch" placeholder="Buscar patrimônio, usuário, local..." oninput="renderAssetCards(this.value)"></div></div><div id="assetCards" class="asset-card-grid"></div>`;
  renderAssetCards('');
  openAsset360(assets[0]?.id,false);
}
function renderAssetCards(q=''){
  const el=document.getElementById('assetCards'); if(!el)return; const term=String(q).toLowerCase();
  const list=assets.filter(a=>!term||[a.id,a.nome,a.tipo,a.usuario,a.local,a.status,a.risco].join(' ').toLowerCase().includes(term));
  el.innerHTML=list.map(a=>{const s=assetScore(a), cls=assetStatusClass(a), w=warrantyState(a), related=tickets.filter(t=>t.asset===a.id);return `<button class="cmdb-asset-card ${cls}" onclick="openAssetDetail('${esc(a.id)}')"><div class="asset-top"><span class="asset-big-icon">${assetIcon(a)}</span><div><strong>${esc(a.nome)}</strong><small>${esc(a.id)} • ${esc(a.tipo)}</small></div></div><div class="asset-health"><span>Saúde</span><b>${s}%</b><i><em style="width:${s}%"></em></i></div><div class="asset-mini"><span>Usuário <b>${esc(a.usuario)}</b></span><span>Local <b>${esc(a.local)}</b></span><span>Garantia <b class="${w.cls}">${w.label}</b></span><span>Chamados <b>${related.length}</b></span></div><span class="open-360-pill">Abrir 360° →</span></button>`}).join('')||'<div class="empty-state">Nenhum ativo encontrado.</div>';
}
window.openAsset360=(id,scroll=true)=>{
  const a=assets.find(x=>x.id===id); if(!a||!window.cmdbSidePanel)return; const related=tickets.filter(t=>t.asset===a.id); const open=related.filter(t=>!isClosed(t)); const s=assetScore(a), cls=assetStatusClass(a), w=warrantyState(a); const cost=related.reduce((sum,t)=>sum+ticketCost(t).total,0);
  cmdbSidePanel.innerHTML=`<div class="cmdb-detail-head"><div class="asset-detail-icon">${assetIcon(a)}</div><div><span class="eyebrow">Ativo 360°</span><h3>${esc(a.nome)}</h3><p>${esc(a.id)} • ${esc(a.tipo)} • ${esc(a.local)}</p></div></div><div class="asset-score-ring ${cls}"><div><strong>${s}%</strong><span>Saúde do ativo</span></div></div><div class="info-list cmdb-info"><p><span>Usuário responsável</span><strong>${esc(a.usuario)}</strong></p><p><span>Status</span><strong>${esc(a.status)}</strong></p><p><span>Risco</span><strong>${esc(a.risco)}</strong></p><p><span>Garantia</span><strong>${esc(a.garantia)} • ${w.label}</strong></p><p><span>Chamados abertos</span><strong>${open.length}</strong></p><p><span>Custo/impacto histórico</span><strong>R$ ${cost}</strong></p></div><div class="cmdb-actions"><button class="primary" onclick="showPage('newTicket');ticketAsset.value='${esc(a.id)}'">＋ Chamado deste ativo</button><button class="ghost" onclick="openAssetDetail('${esc(a.id)}')">Abrir 360° completo</button></div><h4>Histórico vinculado</h4><div class="cmdb-linked">${related.length?related.map(t=>`<button onclick="openTicket('${esc(t.id)}')"><b>${esc(t.id)}</b><span>${esc(t.title)}</span><em class="badge ${esc(t.priority)}">${esc(t.priority)}</em></button>`).join(''):'<div class="empty-state">Nenhum chamado vinculado.</div>'}</div><h4>Checklist Enterprise</h4><div class="cmdb-checks"><label><input type="checkbox" checked> Patrimônio validado</label><label><input type="checkbox" ${w.cls==='ok'?'checked':''}> Garantia vigente</label><label><input type="checkbox" ${related.length?'checked':''}> Histórico de chamados</label><label><input type="checkbox"> Nota fiscal / contrato anexado</label></div>`;
  document.querySelectorAll('.cmdb-asset-card').forEach(b=>b.classList.toggle('selected',b.textContent.includes(a.id)));
  if(scroll)cmdbSidePanel.scrollIntoView({behavior:'smooth',block:'nearest'});
}


function assetExtra(a){return assetExtras[a.id]||{brand:'-',model:a.nome,serial:a.id,os:'-',cpu:'-',ram:'-',disk:'-',ip:'-',mac:'-',vendor:'-',nf:'-',purchase:'-',value:0,availability:'-',lastMaint:'-',photo:assetIcon(a),software:[],licenses:[],docs:[]}}
function assetHealthItems(a){const s=assetScore(a), cls=assetStatusClass(a);return [
  ['Disponibilidade', assetExtra(a).availability, s],['CPU / Performance', cls==='danger'?'Alto uso':'Normal', cls==='danger'?45:86],['Memória', cls==='warn'?'Atenção':'OK', cls==='warn'?62:88],['Disco / Storage', cls==='danger'?'Crítico':'OK', cls==='danger'?38:91],['Rede', a.tipo==='Rede'?'Monitorado':'OK', a.tipo==='Rede'?96:82],['Backup', a.tipo==='Servidor'?'Obrigatório':'Padrão', a.tipo==='Servidor'?72:90],['Antivírus', 'Atualizado', 100],['Garantia', warrantyState(a).label, warrantyState(a).cls==='ok'?95:warrantyState(a).cls==='warn'?55:20]
]}
function miniBar(label,value,pct){let color=pct<50?'#f04438':pct<75?'#f79009':'#12b76a';return `<div class="asset-health-row"><div><strong>${esc(label)}</strong><span>${esc(value)}</span></div><i><em style="width:${pct}%;background:${color}"></em></i><b>${pct}%</b></div>`}
function assetTimeline(a,related){const e=assetExtra(a);const rows=[['Compra do ativo',`Registrado com ${e.vendor} • ${e.nf}`,e.purchase],['Entrada no inventário',`Patrimônio ${a.id} validado no CMDB`,'Cadastro'],['Atribuição ao usuário',`${a.usuario} • ${a.local}`,'Responsável'],['Última manutenção',e.lastMaint,'Manutenção'],...related.slice(0,4).map(t=>[`Chamado ${t.id}`,t.title,fmt(t.createdAt)])];return rows.map((r,i)=>`<div class="asset-timeline-row"><span>${i+1}</span><div><strong>${esc(r[0])}</strong><p>${esc(r[1])}</p><small>${esc(r[2])}</small></div></div>`).join('')}
window.openAssetDetail=(id)=>{const a=assets.find(x=>x.id===id); if(!a)return; const e=assetExtra(a), related=tickets.filter(t=>t.asset===a.id), open=related.filter(t=>!isClosed(t)); const s=assetScore(a), w=warrantyState(a), cost=related.reduce((sum,t)=>sum+ticketCost(t).total,0)+Number(e.value||0); showPage('assetDetail');
 assetDetailContent.innerHTML=`<div class="asset360-command"><button class="back-btn" onclick="showPage('assets')">← Voltar</button><div class="asset360-title"><span class="eyebrow">Digital Twin • CMDB 360°</span><h2>${esc(a.nome)}</h2><p>${esc(a.id)} • ${esc(e.brand)} ${esc(e.model)} • ${esc(a.local)}</p></div><div class="asset360-actions"><button class="primary" onclick="showPage('newTicket');ticketAsset.value='${esc(a.id)}'">＋ Chamado deste ativo</button><button class="ghost" onclick="alert('Documento anexado em modo demonstração.')">Anexar documento</button></div></div>
 <div class="asset360-kpis"><div><small>Saúde</small><strong>${s}%</strong><span class="${assetStatusClass(a)}">${assetStatusClass(a)==='danger'?'Crítico':assetStatusClass(a)==='warn'?'Atenção':'Saudável'}</span></div><div><small>Risco</small><strong>${esc(a.risco)}</strong><span>Impacto operacional</span></div><div><small>Chamados abertos</small><strong>${open.length}</strong><span>Histórico: ${related.length}</span></div><div><small>Garantia</small><strong>${esc(w.label)}</strong><span>${esc(a.garantia)}</span></div><div><small>Custo total</small><strong>R$ ${cost.toLocaleString('pt-BR')}</strong><span>Ativo + chamados</span></div></div>
 <div class="asset360-grid"><main class="asset360-main">
  <section class="asset-panel hero-device"><div class="device-photo">${esc(e.photo||assetIcon(a))}</div><div><span class="eyebrow">Ficha técnica</span><h3>${esc(e.brand)} ${esc(e.model)}</h3><div class="device-specs"><span><b>Serial</b>${esc(e.serial)}</span><span><b>Sistema</b>${esc(e.os)}</span><span><b>CPU</b>${esc(e.cpu)}</span><span><b>Memória</b>${esc(e.ram)}</span><span><b>Disco</b>${esc(e.disk)}</span><span><b>IP</b>${esc(e.ip)}</span><span><b>MAC</b>${esc(e.mac)}</span><span><b>Fornecedor</b>${esc(e.vendor)}</span></div></div></section>
  <section class="asset-panel"><h3>Saúde técnica do ativo</h3><div class="asset-health-list">${assetHealthItems(a).map(x=>miniBar(x[0],x[1],x[2])).join('')}</div></section>
  <section class="asset-panel"><h3>Timeline do ativo</h3><div class="asset-timeline">${assetTimeline(a,related)}</div></section>
  <section class="asset-panel"><h3>Chamados vinculados</h3><div class="asset-related-list">${related.length?related.map(t=>`<button onclick="openTicket('${esc(t.id)}')"><b>${esc(t.id)}</b><span>${esc(t.title)}</span><em class="badge ${esc(t.priority)}">${esc(t.priority)}</em><small>${esc(t.status)}</small></button>`).join(''):'<div class="empty-state">Nenhum chamado vinculado.</div>'}</div></section>
 </main><aside class="asset360-side">
  <section class="asset-panel sticky-panel"><div class="asset-score-ring ${assetStatusClass(a)}"><div><strong>${s}%</strong><span>Saúde do ativo</span></div></div><div class="info-list"><p><span>Usuário</span><strong>${esc(a.usuario)}</strong></p><p><span>Local</span><strong>${esc(a.local)}</strong></p><p><span>Status</span><strong>${esc(a.status)}</strong></p><p><span>Nota Fiscal</span><strong>${esc(e.nf)}</strong></p><p><span>Compra</span><strong>${esc(e.purchase)}</strong></p><p><span>Valor</span><strong>R$ ${Number(e.value||0).toLocaleString('pt-BR')}</strong></p></div></section>
  <section class="asset-panel"><h3>Softwares</h3><div class="chip-list">${(e.software||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></section>
  <section class="asset-panel"><h3>Licenças</h3><div class="license-list">${(e.licenses||[]).map(x=>`<p><b>${esc(x)}</b><span>Válido / controlado</span></p>`).join('')}</div></section>
  <section class="asset-panel"><h3>Documentos</h3><div class="doc-list">${(e.docs||[]).map(x=>`<button>📄 ${esc(x)}</button>`).join('')}<button>＋ Anexar novo documento</button></div></section>
  <section class="asset-panel"><h3>QR Code</h3><div class="fake-qr"><span>${esc(a.id)}</span></div><p class="muted">Escaneie para abrir a ficha 360° do ativo.</p></section>
 </aside></div>`
}


const defaultWorkflowStages=[
 {id:'novo',name:'Novo',color:'#0067d9',sla:'15 min',owner:'Service Desk',status:'Aberto',desc:'Entrada automática do chamado e registro inicial.'},
 {id:'triagem',name:'Triagem',color:'#7c3aed',sla:'30 min',owner:'Service Desk',status:'Aberto',desc:'Classificação, prioridade, categoria e impacto.'},
 {id:'n1',name:'Suporte N1',color:'#0ea5e9',sla:'4h',owner:'Atendente N1',status:'Em atendimento',desc:'Atendimento inicial, execução de procedimentos e resposta rápida.'},
 {id:'n2',name:'Suporte N2 / Infra',color:'#f79009',sla:'8h',owner:'Atendente N2',status:'Em atendimento',desc:'Casos técnicos avançados, infraestrutura, sistemas e fornecedor.'},
 {id:'usuario',name:'Aguardando usuário',color:'#f5b700',sla:'Pausado',owner:'Solicitante',status:'Aguardando usuário',desc:'SLA operacional pausado aguardando retorno ou validação.'},
 {id:'resolvido',name:'Resolvido / Fechado',color:'#12b76a',sla:'Encerrado',owner:'Service Desk',status:'Resolvido',desc:'Validação, documentação final e encerramento.'}
];
const workflowRulesData=[
 {if:'Prioridade = Alta ou Crítica',then:'Escalar para Suporte N2 / Infra',tag:'Escalação'},
 {if:'Categoria = Acesso / Senha',then:'Enviar para Suporte N1',tag:'Roteamento'},
 {if:'Status = Aguardando usuário',then:'Pausar SLA e enviar lembrete',tag:'SLA'},
 {if:'SLA consumido > 80%',then:'Notificar responsável e gestor',tag:'Alerta'},
 {if:'Ativo crítico vinculado',then:'Adicionar à fila crítica do dashboard',tag:'CMDB'}
];
let workflowStages=JSON.parse(localStorage.getItem(KEY+'-workflow')||'null')||defaultWorkflowStages;
function saveWorkflow(){localStorage.setItem(KEY+'-workflow',JSON.stringify(workflowStages))}
function workflowStageForTicket(t){
 if(isClosed(t)) return 'resolvido';
 if(t.status==='Aguardando usuário') return 'usuario';
 if(t.priority==='Alta'||t.priority==='Crítica'||t.impact==='Crítico') return 'n2';
 if(t.status==='Em atendimento') return 'n1';
 if(t.status==='Aberto' && (Date.now()-new Date(t.createdAt).getTime())>60*60*1000) return 'triagem';
 return 'novo';
}
function workflowKpiHtml(label,value,sub,cls='') {return `<div class="workflow-kpi ${cls}"><small>${esc(label)}</small><strong>${esc(String(value))}</strong><span>${esc(sub)}</span></div>`}
function renderWorkflow(){
 if(!window.workflowBoard) return;
 const byStage=Object.fromEntries(workflowStages.map(st=>[st.id,[]]));
 tickets.forEach(t=>{const sid=workflowStageForTicket(t);(byStage[sid]||byStage.novo||[]).push(t)});
 const total=tickets.length, late=tickets.filter(isLate).length, critical=tickets.filter(t=>(t.priority==='Alta'||t.priority==='Crítica')&&!isClosed(t)).length;
 if(window.workflowKpis) workflowKpis.innerHTML=[
  workflowKpiHtml('Chamados no fluxo',total,'Todos os estágios','blue'),
  workflowKpiHtml('SLA em risco',late,'Vencidos ou críticos','red'),
  workflowKpiHtml('Críticos abertos',critical,'Alta prioridade','orange'),
  workflowKpiHtml('Etapas configuradas',workflowStages.length,'Workflow Help Desk','green')
 ].join('');
 workflowBoard.innerHTML=workflowStages.map(st=>{
  const list=byStage[st.id]||[];
  const venc=list.filter(isLate).length;
  return `<div class="workflow-stage" data-stage="${esc(st.id)}" ondragover="event.preventDefault()" ondrop="dropWorkflowTicket(event,'${esc(st.id)}')">
   <div class="stage-head" style="--stage:${esc(st.color)}"><span></span><div><strong>${esc(st.name)}</strong><small>${list.length} chamados • SLA ${esc(st.sla)}</small></div><b>${venc?`${venc} ⚠`:''}</b></div>
   <div class="stage-meta"><p><small>Responsável</small><strong>${esc(st.owner)}</strong></p><p><small>Status</small><strong>${esc(st.status)}</strong></p></div>
   <div class="stage-ticket-list">${list.map(t=>workflowCard(t)).join('')||'<div class="stage-empty">Sem chamados nesta etapa</div>'}</div>
  </div>`;
 }).join('');
 renderWorkflowSide(workflowStages[0]?.id);
 renderWorkflowRules();
 renderWorkflowAnalytics(byStage);
}
function workflowCard(t){const pct=slaPercent(t);return `<div class="workflow-ticket" draggable="true" ondragstart="dragWorkflowTicket(event,'${esc(t.id)}')" onclick="openTicket('${esc(t.id)}')">
 <div><strong>${esc(t.id)}</strong><span class="badge ${esc(t.priority)}">${esc(t.priority)}</span></div>
 <p>${esc(t.title)}</p>
 <small>${esc(t.requester)} • ${esc(t.category)}</small>
 <div class="workflow-card-foot"><em>${esc(t.responsible||'Service Desk')}</em><i><b style="width:${pct}%;background:${isLate(t)?'#f04438':pct>75?'#f79009':'#12b76a'}"></b></i><span>${pct}%</span></div>
 </div>`}
window.dragWorkflowTicket=(ev,id)=>{ev.dataTransfer.setData('text/plain',id)}
window.dropWorkflowTicket=(ev,stageId)=>{ev.preventDefault();const id=ev.dataTransfer.getData('text/plain');const t=tickets.find(x=>x.id===id);const st=workflowStages.find(x=>x.id===stageId);if(!t||!st)return;t.status=st.status;t.updatedAt=new Date().toISOString();t.history=t.history||[];t.history.push(`Workflow: chamado movido para ${st.name}`);saveAll();renderAll();}
function renderWorkflowSide(stageId){if(!window.workflowSidePanel)return;const st=workflowStages.find(x=>x.id===stageId)||workflowStages[0]; if(!st)return; workflowSidePanel.innerHTML=`<span class="eyebrow">Configuração da etapa</span><h3>${esc(st.name)}</h3><p>${esc(st.desc)}</p><div class="workflow-config">
 <label>Nome da etapa<input value="${esc(st.name)}" onchange="editWorkflowStage('${esc(st.id)}','name',this.value)"></label>
 <label>Responsável<select onchange="editWorkflowStage('${esc(st.id)}','owner',this.value)">${['Service Desk','Atendente N1','Atendente N2','Gestor TI','Solicitante','Fornecedor'].map(o=>`<option ${o===st.owner?'selected':''}>${o}</option>`).join('')}</select></label>
 <label>Status do chamado<select onchange="editWorkflowStage('${esc(st.id)}','status',this.value)">${statusList.map(o=>`<option ${o===st.status?'selected':''}>${o}</option>`).join('')}</select></label>
 <label>SLA da etapa<input value="${esc(st.sla)}" onchange="editWorkflowStage('${esc(st.id)}','sla',this.value)"></label>
 <label>Cor<input type="color" value="${esc(st.color)}" onchange="editWorkflowStage('${esc(st.id)}','color',this.value)"></label>
 </div><div class="workflow-checklist"><h4>Checklist Enterprise</h4><label><input type="checkbox" checked> Registrar auditoria</label><label><input type="checkbox" checked> Notificar responsável</label><label><input type="checkbox"> Exigir aprovação</label><label><input type="checkbox"> Pausar SLA</label></div>`}
window.editWorkflowStage=(id,field,value)=>{const st=workflowStages.find(x=>x.id===id); if(!st)return; st[field]=value; saveWorkflow(); renderWorkflow();}
window.addWorkflowStage=()=>{const id='etapa'+Date.now(); workflowStages.splice(Math.max(1,workflowStages.length-1),0,{id,name:'Nova etapa',color:'#475467',sla:'2h',owner:'Service Desk',status:'Em atendimento',desc:'Etapa personalizada do fluxo.'}); saveWorkflow(); renderWorkflow();}
window.resetWorkflowDemo=()=>{workflowStages=JSON.parse(JSON.stringify(defaultWorkflowStages));saveWorkflow();renderWorkflow();}
function renderWorkflowRules(){if(!window.workflowRules)return;workflowRules.innerHTML=workflowRulesData.map(r=>`<div class="rule-card"><span>${esc(r.tag)}</span><p><b>Se</b> ${esc(r.if)}</p><p><b>Então</b> ${esc(r.then)}</p></div>`).join('')}
function renderWorkflowAnalytics(byStage){if(!window.workflowAnalytics)return;const max=Math.max(1,...Object.values(byStage||{}).map(a=>a.length));workflowAnalytics.innerHTML=workflowStages.map(st=>{const n=(byStage?.[st.id]||[]).length;return `<div class="analytics-row"><span>${esc(st.name)}</span><i><b style="width:${Math.round(n/max*100)}%;background:${esc(st.color)}"></b></i><strong>${n}</strong></div>`}).join('')}


// Sprint 13 - Central de Automações Enterprise
const defaultAutomations=[
 {id:'auto-sla-critico',name:'Escalação de SLA crítico',enabled:true,category:'SLA',trigger:'SLA consumido acima de 80%',condition:'Chamado aberto e prioridade Alta/Crítica',actions:['Notificar responsável','Escalar gestor TI','Mover para Suporte N2 / Infra','Registrar auditoria'],runs:128,success:126,savedHours:18,status:'Ativa'},
 {id:'auto-acesso',name:'Roteamento de acesso e senha',enabled:true,category:'Chamados',trigger:'Categoria = Acesso / Senha',condition:'Solicitação não crítica',actions:['Atribuir Service Desk','Aplicar SLA 4h','Enviar resposta padrão','Adicionar checklist'],runs:92,success:92,savedHours:11,status:'Ativa'},
 {id:'auto-garantia',name:'Garantia de ativo vencendo',enabled:true,category:'CMDB',trigger:'Garantia vence em 30 dias',condition:'Ativo em uso',actions:['Criar chamado preventivo','Notificar compras','Vincular ativo CMDB','Gerar alerta no dashboard'],runs:34,success:33,savedHours:9,status:'Ativa'},
 {id:'auto-parado',name:'Chamado parado sem resposta',enabled:false,category:'SLA',trigger:'Sem atualização por 4 horas',condition:'Status diferente de Fechado',actions:['Enviar lembrete','Notificar solicitante','Escalar responsável','Criar log de atraso'],runs:51,success:48,savedHours:7,status:'Pausada'}
];
let automations=JSON.parse(localStorage.getItem(KEY+'-automations')||'null')||defaultAutomations;
let selectedAutomationId=automations[0]?.id;
const automationBlockData=['Condição','E-mail','Microsoft Teams','WhatsApp','Delay','Criar chamado','Mover workflow','Atualizar SLA','Adicionar comentário','Criar aprovação','Gerar PDF','Webhook/API','Auditoria','CMDB'];
const automationLogData=[
 ['há 2 min','SLA crítico','CH-2026-0250 escalado para Ana Paula','Sucesso'],
 ['há 18 min','Acesso / Senha','CH-2026-0253 recebeu checklist automático','Sucesso'],
 ['há 41 min','Garantia CMDB','AT-0002 gerou alerta preventivo','Sucesso'],
 ['há 1h','Chamado parado','Lembrete enviado ao solicitante','Falha Teams']
];
function saveAutomations(){localStorage.setItem(KEY+'-automations',JSON.stringify(automations))}
function renderAutomations(){
 if(!window.automationKpis) return;
 const active=automations.filter(a=>a.enabled).length, runs=automations.reduce((s,a)=>s+a.runs,0), fails=automations.reduce((s,a)=>s+(a.runs-a.success),0), hours=automations.reduce((s,a)=>s+a.savedHours,0);
 automationKpis.innerHTML=`<div class="automation-kpi blue"><small>Automações</small><strong>${automations.length}</strong><span>${active} ativas</span></div><div class="automation-kpi green"><small>Execuções</small><strong>${runs}</strong><span>histórico demo</span></div><div class="automation-kpi red"><small>Falhas</small><strong>${fails}</strong><span>requer atenção</span></div><div class="automation-kpi orange"><small>Economia estimada</small><strong>${hours}h</strong><span>tempo operacional</span></div>`;
 if(window.automationSelector) automationSelector.innerHTML=automations.map(a=>`<option value="${esc(a.id)}" ${a.id===selectedAutomationId?'selected':''}>${esc(a.name)}</option>`).join('');
 renderAutomationCanvas();renderAutomationSide();renderAutomationBlocks();renderAutomationTemplates();renderAutomationLogs();
}
function currentAutomation(){return automations.find(a=>a.id===selectedAutomationId)||automations[0]}
window.selectAutomation=id=>{selectedAutomationId=id;renderAutomations()}
function renderAutomationCanvas(){
 const a=currentAutomation(); if(!window.automationCanvas||!a)return;
 const nodes=[{kind:'Gatilho',text:a.trigger,icon:'⚡'},{kind:'Condição',text:a.condition,icon:'◇'},...a.actions.map((x,i)=>({kind:`Ação ${i+1}`,text:x,icon:['✉','⇄','🔔','✓','⟲'][i%5]})),{kind:'Resultado',text:`${a.success}/${a.runs} execuções com sucesso`,icon:'▣'}];
 automationCanvas.innerHTML=`<div class="automation-flow">${nodes.map((n,i)=>`<div class="automation-node ${i===0?'trigger':i===nodes.length-1?'result':''}"><span>${n.icon}</span><div><small>${esc(n.kind)}</small><strong>${esc(n.text)}</strong></div></div>${i<nodes.length-1?'<i class="flow-line"></i>':''}`).join('')}</div>`;
}
function renderAutomationSide(){
 const a=currentAutomation(); if(!window.automationSidePanel||!a)return;
 automationSidePanel.innerHTML=`<span class="eyebrow">Configuração</span><h3>${esc(a.name)}</h3><p>Automação voltada para ${esc(a.category)} com rastreabilidade e auditoria.</p><div class="automation-config"><label>Status<select onchange="toggleAutomation('${esc(a.id)}',this.value)"><option ${a.enabled?'selected':''}>Ativa</option><option ${!a.enabled?'selected':''}>Pausada</option></select></label><label>Categoria<input value="${esc(a.category)}" onchange="editAutomation('${esc(a.id)}','category',this.value)"></label><label>Gatilho<input value="${esc(a.trigger)}" onchange="editAutomation('${esc(a.id)}','trigger',this.value)"></label><label>Condição<input value="${esc(a.condition)}" onchange="editAutomation('${esc(a.id)}','condition',this.value)"></label></div><div class="automation-health"><p><span>Taxa de sucesso</span><strong>${Math.round(a.success/Math.max(1,a.runs)*100)}%</strong></p><p><span>Execuções</span><strong>${a.runs}</strong></p><p><span>Horas economizadas</span><strong>${a.savedHours}h</strong></p></div><button class="primary full" onclick="simulateAutomationRun('${esc(a.id)}')">Executar simulação</button>`;
}
window.toggleAutomation=(id,value)=>{const a=automations.find(x=>x.id===id);if(!a)return;a.enabled=value==='Ativa';a.status=value;saveAutomations();renderAutomations()}
window.editAutomation=(id,field,value)=>{const a=automations.find(x=>x.id===id);if(!a)return;a[field]=value;saveAutomations();renderAutomations()}
window.simulateAutomationRun=id=>{const a=automations.find(x=>x.id===id);if(!a)return;a.runs++;a.success++;a.savedHours=Math.round((a.savedHours+0.2)*10)/10;saveAutomations();renderAutomations()}
window.addAutomationRule=()=>{const id='auto-'+Date.now();automations.unshift({id,name:'Nova automação Help Desk',enabled:true,category:'Chamados',trigger:'Novo chamado criado',condition:'Prioridade definida',actions:['Classificar fila','Notificar responsável','Registrar auditoria'],runs:0,success:0,savedHours:0,status:'Ativa'});selectedAutomationId=id;saveAutomations();renderAutomations()}
window.resetAutomationsDemo=()=>{automations=JSON.parse(JSON.stringify(defaultAutomations));selectedAutomationId=automations[0].id;saveAutomations();renderAutomations()}
function renderAutomationBlocks(){if(!window.automationBlocks)return;automationBlocks.innerHTML=automationBlockData.map((b,i)=>`<button class="automation-block"><span>${['◇','✉','💬','☎','⏱','＋','⇄','⌛','☰','✓','PDF','API','◷','▥'][i]}</span>${esc(b)}</button>`).join('')}
function renderAutomationTemplates(){if(!window.automationTemplates)return;automationTemplates.innerHTML=defaultAutomations.map(t=>`<button onclick="selectedAutomationId='${esc(t.id)}';renderAutomations()"><strong>${esc(t.name)}</strong><span>${esc(t.category)} • ${t.actions.length} ações</span></button>`).join('')}
function renderAutomationLogs(){if(!window.automationLogs)return;automationLogs.innerHTML=automationLogData.map(l=>`<div class="automation-log"><small>${esc(l[0])}</small><div><strong>${esc(l[1])}</strong><span>${esc(l[2])}</span></div><b class="${l[3].includes('Falha')?'fail':'ok'}">${esc(l[3])}</b></div>`).join('')}

function renderKb(){if(!kbList)return;const kb=[['Como resetar senha do Windows/ERP','Procedimento de validação do usuário, confirmação de matrícula, redefinição e registro do atendimento.'],['Impressora não imprime','Validar fila, cabo/rede, driver, toner, papel e status no servidor de impressão.'],['Internet ou Wi-Fi sem funcionar','Testar cabo, reiniciar adaptador, validar IP, gateway, DNS e cobertura do access point.'],['Notebook lento','Verificar disco, memória, inicialização, antivírus, atualizações e espaço livre.'],['Phishing ou e-mail suspeito','Não clicar em links, encaminhar ao TI, bloquear remetente e registrar evidências.']];kbList.innerHTML=kb.map(k=>`<details><summary>${esc(k[0])}</summary><p>${esc(k[1])}</p></details>`).join('')}
function renderReports(){if(!reportOps)return;const total=tickets.length,closed=tickets.filter(isClosed).length,late=tickets.filter(isLate).length;reportOps.innerHTML=`<div class="report-metric"><span>Total de chamados</span><strong>${total}</strong></div><div class="report-metric"><span>Resolvidos/fechados</span><strong>${closed}</strong></div><div class="report-metric"><span>Taxa de conclusão</span><strong>${total?Math.round(closed/total*100):0}%</strong></div><div class="report-metric"><span>Backlog operacional</span><strong>${total-closed}</strong></div>`;reportSla.innerHTML=`<div class="report-metric"><span>SLA vencido</span><strong>${late}</strong></div><div class="report-metric"><span>Críticos em aberto</span><strong>${tickets.filter(t=>(t.priority==='Crítica'||t.priority==='Alta')&&!isClosed(t)).length}</strong></div><div class="report-metric"><span>Dentro do prazo</span><strong>${total-late}</strong></div>`;if(reportTable)reportTable.innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th>Indicador</th><th>Valor</th><th>Comentário executivo</th></tr></thead><tbody><tr><td>MTTR médio</td><td>3h20m</td><td>Tempo médio competitivo para suporte interno.</td></tr><tr><td>Chamados críticos</td><td>${tickets.filter(t=>t.priority==='Crítica'||t.priority==='Alta').length}</td><td>Requer acompanhamento do gestor de TI.</td></tr><tr><td>Ativos impactados</td><td>${new Set(tickets.map(t=>t.asset).filter(Boolean)).size}</td><td>Vínculo com CMDB agrega rastreabilidade.</td></tr></tbody></table></div>`}
function renderSettings(){if(!departmentsList)return;departmentsList.innerHTML=departments.map(d=>`<span class="chip">${esc(d)}</span>`).join('');usersList.innerHTML=users.map(u=>`<div class="ticket-item"><div><strong>${esc(u.name)}</strong><br><small>${esc(u.email)} • ${esc(u.sector)}</small></div><span class="badge">${esc(u.role)}</span></div>`).join('')}
function createTicket(e){e.preventDefault();const n=260+tickets.length;const id=`CH-2026-${String(n).padStart(4,'0')}`;const priority=ticketPriority.value;const slaHours=priority==='Crítica'?1:priority==='Alta'?4:priority==='Média'?12:24;const files=[...ticketFiles.files].map(f=>f.name);tickets.unshift({id,title:ticketTitle.value,requester:ticketRequester.value,sector:ticketSector.value,category:ticketCategory.value,priority,status:'Aberto',type:ticketType.value,asset:ticketAsset.value,impact:ticketImpact.value,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),slaDueAt:plus(slaHours),responsible:'Service Desk',attachments:files,description:ticketDescription.value+'\nLocal: '+ticketLocation.value,history:['Chamado aberto via catálogo de TI']});saveAll();ticketForm.reset();ticketRequester.value='Administrador';showPage('tickets');}

function timeLeftText(t){
  if(isClosed(t)) return 'Encerrado';
  const diff=new Date(t.slaDueAt)-new Date();
  const neg=diff<0, abs=Math.abs(diff);
  const h=Math.floor(abs/3600000), m=Math.floor((abs%3600000)/60000);
  return neg?`Vencido há ${h}h ${m}m`:`${h}h ${m}m restantes`;
}
function assetInfo(id){return assets.find(a=>a.id===id)}
function ticketAge(t){
  const diff=Date.now()-new Date(t.createdAt).getTime();
  const h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000);
  return h?`${h}h ${m}m`:`${m}m`;
}
function timelineHtml(t){
  const base=[`Chamado criado por ${t.requester}`,`SLA iniciado automaticamente`,...(t.history||[])];
  return base.map((h,i)=>`<div class="timeline-row ${i===base.length-1?'last':''}"><div class="timeline-dot"></div><div><strong>${esc(i===0?'Abertura':i===1?'SLA':'Evento')}</strong><p>${esc(h)}</p><small>${i<2?fmt(t.createdAt):fmt(t.updatedAt)}</small></div></div>`).join('')
}
function attachmentHtml(t){
  if(!t.attachments || !t.attachments.length) return '<div class="empty-attach">Nenhum anexo enviado neste chamado.</div>';
  return t.attachments.map(a=>`<div class="attach-card"><span>📎</span><div><strong>${esc(a)}</strong><small>Arquivo vinculado ao chamado</small></div><button class="action-btn">Visualizar</button></div>`).join('')
}
function printTicket(id){
  const t=tickets.find(x=>x.id===id); if(!t) return;
  const a=assetInfo(t.asset);
  const w=window.open('','_blank');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(t.id)} - Relatório</title><style>
  body{font-family:Arial,Helvetica,sans-serif;margin:34px;color:#061b3a}header{display:flex;justify-content:space-between;align-items:center;border-bottom:6px solid #004B8D;padding-bottom:18px;margin-bottom:24px}img{width:220px}.meta{text-align:right}h1{color:#004B8D;margin:0}.box{border:1px solid #dbe7f5;border-radius:14px;padding:16px;margin:14px 0;background:#fbfdff}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.item small{display:block;color:#64748b;text-transform:uppercase;font-weight:bold}.item strong{font-size:16px}.badge{display:inline-block;border-radius:999px;padding:7px 12px;background:#e8f2ff;color:#004B8D;font-weight:bold}.red{background:#ffe8e6;color:#d91b2b}.green{background:#e9faef;color:#008c4b}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #dbe7f5;padding:10px;text-align:left}th{background:#004B8D;color:white}footer{margin-top:24px;color:#667085;font-size:12px}</style></head><body>
  <header><img src="./logo-tosi.png"><div class="meta"><h1>Relatório do Chamado</h1><p><strong>${esc(t.id)}</strong></p><p>Gerado em ${fmt(new Date())}</p></div></header>
  <section class="box"><h2>${esc(t.title)}</h2><p>${esc(t.description)}</p><span class="badge ${isLate(t)?'red':'green'}">SLA: ${timeLeftText(t)}</span></section>
  <section class="box"><h3>Dados principais</h3><div class="grid">
  <div class="item"><small>Status</small><strong>${esc(t.status)}</strong></div><div class="item"><small>Prioridade</small><strong>${esc(t.priority)}</strong></div><div class="item"><small>Tipo ITSM</small><strong>${esc(t.type)}</strong></div>
  <div class="item"><small>Solicitante</small><strong>${esc(t.requester)}</strong></div><div class="item"><small>Setor</small><strong>${esc(t.sector)}</strong></div><div class="item"><small>Responsável</small><strong>${esc(t.responsible)}</strong></div>
  <div class="item"><small>Categoria</small><strong>${esc(t.category)}</strong></div><div class="item"><small>Ativo</small><strong>${esc(t.asset||'Não vinculado')}</strong></div><div class="item"><small>Criado em</small><strong>${fmt(t.createdAt)}</strong></div>
  </div></section>
  <section class="box"><h3>Ativo / CMDB</h3><p>${a?`${esc(a.nome)} • ${esc(a.tipo)} • ${esc(a.local)} • Garantia ${esc(a.garantia)}`:'Nenhum ativo relacionado.'}</p></section>
  <section class="box"><h3>Histórico / Auditoria</h3><table><thead><tr><th>Evento</th></tr></thead><tbody>${(t.history||[]).map(h=>`<tr><td>${esc(h)}</td></tr>`).join('')}</tbody></table></section>
  <footer>Documento gerado automaticamente pelo Tosi Support Pro v6. Uso interno Indústrias Tosi.</footer><script>window.print()<\/script></body></html>`);
  w.document.close();
}
window.printTicket=printTicket;
window.openTicket=id=>{
  const t=tickets.find(x=>x.id===id);if(!t)return;
  const a=assetInfo(t.asset);
  const pct=slaPercent(t), late=isLate(t);
  const userTickets=tickets.filter(x=>x.requester===t.requester && x.id!==t.id).slice(0,4);
  const assetTickets=t.asset?tickets.filter(x=>x.asset===t.asset && x.id!==t.id).slice(0,4):[];
  const cost = ticketCost(t);
  ticketDetailContent.innerHTML=`
  <div class="ticket-360 ticket-360-page">
    <div class="t360-command">
      <button class="back-btn" onclick="showPage('tickets')">← Voltar aos chamados</button>
      <div class="t360-title">
        <div class="ticket-kicker"><span>${esc(t.id)}</span><span>${esc(t.type)}</span><span class="badge ${esc(t.priority)}">${esc(t.priority)}</span><span class="badge status">${esc(t.status)}</span></div>
        <h2>${esc(t.title)}</h2>
        <p>${esc(t.description)}</p>
      </div>
      <div class="t360-sla ${late?'late':''}">
        <small>${late?'SLA vencido':'SLA restante'}</small>
        <strong>${timeLeftText(t)}</strong>
        <div class="bar"><i style="width:${pct}%;background:${late?'#f04438':pct>75?'#f79009':'#12b76a'}"></i></div>
        <em>${pct}% consumido</em>
      </div>
    </div>

    <div class="t360-progress">
      <div class="step done"><span>1</span><strong>Novo</strong><small>Entrada</small></div>
      <i></i>
      <div class="step ${['Em atendimento','Aguardando usuário','Resolvido','Fechado'].includes(t.status)?'done':'active'}"><span>2</span><strong>Triagem</strong><small>Classificação</small></div>
      <i></i>
      <div class="step ${['Em atendimento','Aguardando usuário'].includes(t.status)?'active':isClosed(t)?'done':''}"><span>3</span><strong>Atendimento</strong><small>Suporte técnico</small></div>
      <i></i>
      <div class="step ${t.status==='Aguardando usuário'?'active':isClosed(t)?'done':''}"><span>4</span><strong>Validação</strong><small>Usuário</small></div>
      <i></i>
      <div class="step ${isClosed(t)?'done active':''}"><span>5</span><strong>Encerramento</strong><small>Resolvido</small></div>
    </div>

    <div class="t360-mini-kpis">
      <div><small>Tempo aberto</small><strong>${ticketAge(t)}</strong></div>
      <div><small>SLA consumido</small><strong>${pct}%</strong></div>
      <div><small>Responsável</small><strong>${esc(t.responsible||'Service Desk')}</strong></div>
      <div><small>Anexos</small><strong>${(t.attachments||[]).length}</strong></div>
      <div><small>Interações</small><strong>${(t.history||[]).length+2}</strong></div>
    </div>

    <div class="t360-actions enterprise-actions">
      <button class="primary" onclick="updateTicket('${esc(t.id)}')">Salvar resposta</button>
      <button class="ghost" onclick="quickStatus('${esc(t.id)}','Em atendimento')">Assumir</button>
      <button class="ghost" onclick="quickStatus('${esc(t.id)}','Aguardando usuário')">Aguardar usuário</button>
      <button class="ghost" onclick="quickStatus('${esc(t.id)}','Resolvido')">Resolver</button>
      <button class="ghost" onclick="printTicket('${esc(t.id)}')">Gerar PDF</button>
    </div>

    <div class="t360-grid">
      <section class="t360-main">
        <div class="t360-tabs">
          <button class="active" onclick="switchDetailTab('timeline',this)">Timeline</button>
          <button onclick="switchDetailTab('conversation',this)">Conversa</button>
          <button onclick="switchDetailTab('asset',this)">Ativo / CMDB</button>
          <button onclick="switchDetailTab('costs',this)">Custos</button>
          <button onclick="switchDetailTab('history',this)">Histórico</button>
          <button onclick="switchDetailTab('audit',this)">Auditoria</button>
        </div>

        <div class="t360-pane active" data-tab="timeline">
          <div class="detail-card t360-card"><h3>Timeline completa do atendimento</h3><div class="timeline premium-timeline">${timelineHtml(t)}</div></div>
          <div class="detail-card t360-card"><h3>Próximas ações recomendadas</h3><div class="next-actions"><span>Validar evidência</span><span>Atualizar solicitante</span><span>Revisar SLA</span><span>Registrar solução</span></div></div>
        </div>

        <div class="t360-pane" data-tab="conversation">
          <div class="detail-card t360-card"><h3>Conversa com o usuário</h3>${conversationHtml(t)}<textarea id="modalComment" placeholder="Digite uma resposta ao usuário ou comentário interno. Tudo fica registrado na auditoria."></textarea><div class="reply-tools"><button class="action-btn" onclick="insertTemplate('solicitamos mais detalhes')">Solicitar detalhes</button><button class="action-btn" onclick="insertTemplate('orientação enviada')">Orientação enviada</button><button class="action-btn" onclick="insertTemplate('resolvido após atendimento')">Resolvido</button></div></div>
          <div class="detail-card t360-card"><h3>Anexos do chamado</h3><div class="attachments">${attachmentHtml(t)}</div><label class="upload-box">＋ Adicionar novos anexos<input id="modalFiles" type="file" multiple></label></div>
        </div>

        <div class="t360-pane" data-tab="asset">
          <div class="detail-card t360-card"><h3>Ativo relacionado</h3>${asset360Html(a,t)}</div>
          <div class="detail-card t360-card"><h3>Chamados anteriores deste ativo</h3>${relatedTicketHtml(assetTickets,'Nenhum chamado anterior para este ativo.')}</div>
        </div>

        <div class="t360-pane" data-tab="costs">
          <div class="detail-card t360-card"><h3>Custos e impacto operacional</h3>${costHtml(cost)}</div>
          <div class="detail-card t360-card"><h3>Horas e peças</h3><div class="cost-grid"><div><small>Horas técnicas</small><strong>${cost.hours}h</strong></div><div><small>Custo/hora</small><strong>R$ ${cost.hourValue}</strong></div><div><small>Peças</small><strong>R$ ${cost.parts}</strong></div><div><small>Impacto estimado</small><strong>R$ ${cost.impact}</strong></div></div></div>
        </div>

        <div class="t360-pane" data-tab="history">
          <div class="detail-card t360-card"><h3>Histórico do solicitante</h3>${requester360Html(t,userTickets)}</div>
          <div class="detail-card t360-card"><h3>Chamados recentes do solicitante</h3>${relatedTicketHtml(userTickets,'Nenhum outro chamado deste solicitante.')}</div>
        </div>

        <div class="t360-pane" data-tab="audit">
          <div class="detail-card t360-card"><h3>Auditoria completa</h3><div class="audit-list">${auditHtml(t)}</div></div>
        </div>
      </section>

      <aside class="t360-side">
        <div class="detail-card side-status"><h3>Propriedades</h3><label>Status</label><select id="modalStatus">${statusList.map(s=>`<option ${s===t.status?'selected':''}>${esc(s)}</option>`).join('')}</select><label>Responsável</label><input id="modalResp" value="${esc(t.responsible)}"><label>Prioridade</label><select id="modalPriority"><option ${t.priority==='Baixa'?'selected':''}>Baixa</option><option ${t.priority==='Média'?'selected':''}>Média</option><option ${t.priority==='Alta'?'selected':''}>Alta</option><option ${t.priority==='Crítica'?'selected':''}>Crítica</option></select></div>
        <div class="detail-card info-list"><h3>Dados 360°</h3><p><span>Solicitante</span><strong>${esc(t.requester)}</strong></p><p><span>Setor</span><strong>${esc(t.sector)}</strong></p><p><span>Categoria</span><strong>${esc(t.category)}</strong></p><p><span>Tipo</span><strong>${esc(t.type)}</strong></p><p><span>Impacto</span><strong>${esc(t.impact)}</strong></p><p><span>Idade</span><strong>${ticketAge(t)}</strong></p><p><span>Criado</span><strong>${fmt(t.createdAt)}</strong></p><p><span>Atualizado</span><strong>${fmt(t.updatedAt)}</strong></p></div>
        <div class="detail-card asset-box"><h3>CMDB rápido</h3>${a?`<strong>${esc(a.id)} - ${esc(a.nome)}</strong><p>${esc(a.tipo)} • ${esc(a.local)}</p><p>Usuário: ${esc(a.usuario)}</p><p>Status: <span class="badge ${a.status==='Crítico'?'Crítica':''}">${esc(a.status)}</span></p><p>Garantia: ${esc(a.garantia)}</p>`:'<p>Nenhum ativo relacionado.</p>'}</div>
        <div class="detail-card side-money"><h3>Impacto</h3><strong>R$ ${cost.total}</strong><span>Custo/risco estimado</span></div>
      </aside>
    </div>
  </div>`;
  showPage('ticketDetail')
}
function ticketCost(t){const map={Baixa:120,Média:420,Alta:1250,Crítica:4800};const hours={Baixa:1,Média:2,Alta:4,Crítica:8}[t.priority]||2;const parts=t.asset?({Impressoras:180,Hardware:260,'Manutenção TI':600}[t.category]||90):0;const hourValue=95;const impact=map[t.priority]||420;const total=hours*hourValue+parts+impact;return{hours,parts,hourValue,impact,total}}
function conversationHtml(t){const list=[{who:t.requester,side:'user',txt:t.description,time:fmt(t.createdAt)},{who:t.responsible||'Service Desk',side:'agent',txt:(t.history&&t.history[1])?'Recebemos o chamado e iniciamos a análise técnica.':'Chamado recebido para triagem técnica.',time:fmt(t.updatedAt)}];return `<div class="chat-flow">${list.map(m=>`<div class="chat-msg ${m.side}"><div><strong>${esc(m.who)}</strong><p>${esc(m.txt)}</p><small>${esc(m.time)}</small></div></div>`).join('')}</div>`}
function asset360Html(a,t){if(!a)return '<div class="empty-state">Nenhum ativo vinculado. Ao conectar um ativo, o sistema exibirá garantia, histórico, fornecedor, risco, manuais e chamados recorrentes.</div>';return `<div class="asset-hero"><div class="asset-icon">${a.tipo==='Impressora'?'🖨️':a.tipo==='Servidor'?'🖥️':a.tipo==='Rede'?'🌐':'💻'}</div><div><h2>${esc(a.nome)}</h2><p>${esc(a.id)} • ${esc(a.tipo)} • ${esc(a.local)}</p></div></div><div class="asset-metrics"><div><small>Usuário</small><strong>${esc(a.usuario)}</strong></div><div><small>Status</small><strong>${esc(a.status)}</strong></div><div><small>Risco</small><strong>${esc(a.risco)}</strong></div><div><small>Garantia</small><strong>${esc(a.garantia)}</strong></div></div><div class="next-actions"><span>Manual técnico</span><span>Nota fiscal</span><span>Garantia</span><span>Histórico de manutenção</span></div>`}
function requester360Html(t,related){const total=tickets.filter(x=>x.requester===t.requester).length;const resolved=tickets.filter(x=>x.requester===t.requester&&isClosed(x)).length;const late=tickets.filter(x=>x.requester===t.requester&&isLate(x)).length;return `<div class="requester-card"><div class="avatar large">${esc(t.requester.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><h2>${esc(t.requester)}</h2><p>${esc(t.sector)} • usuário solicitante</p></div></div><div class="asset-metrics"><div><small>Chamados</small><strong>${total}</strong></div><div><small>Resolvidos</small><strong>${resolved}</strong></div><div><small>Vencidos</small><strong>${late}</strong></div><div><small>Últimos</small><strong>${related.length}</strong></div></div>`}
function relatedTicketHtml(list,empty){if(!list.length)return `<div class="empty-state">${empty}</div>`;return `<div class="related-list">${list.map(x=>`<button onclick="openTicket('${esc(x.id)}')"><strong>${esc(x.id)}</strong><span>${esc(x.title)}</span><em class="badge ${esc(x.priority)}">${esc(x.priority)}</em></button>`).join('')}</div>`}
function costHtml(c){return `<div class="money-hero"><small>Total estimado</small><strong>R$ ${c.total}</strong><span>Inclui horas técnicas, peças e impacto operacional estimado.</span></div>`}
function auditHtml(t){const rows=[`Chamado ${t.id} criado por ${t.requester}`,`SLA calculado automaticamente`,...(t.history||[]),`Última atualização: ${fmt(t.updatedAt)}`];return rows.map((h,i)=>`<div class="audit-row"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${i<2?'Sistema':'Operação'}</strong><p>${esc(h)}</p><small>${i<2?fmt(t.createdAt):fmt(t.updatedAt)}</small></div></div>`).join('')}
window.switchDetailTab=(tab,btn)=>{document.querySelectorAll('.t360-pane').forEach(p=>p.classList.toggle('active',p.dataset.tab===tab));document.querySelectorAll('.t360-tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}
window.insertTemplate=txt=>{modalComment.value+=(modalComment.value?'\n':'')+({
  'solicitamos mais detalhes':'Olá! Para seguir com o atendimento, poderia enviar mais detalhes, print do erro e informar o equipamento/local afetado?',
  'orientação enviada':'Olá! Enviamos uma orientação inicial para correção. Por favor, teste e nos confirme se o problema foi resolvido.',
  'resolvido após atendimento':'Chamado resolvido após atendimento técnico. Permanecemos à disposição caso o problema retorne.'
}[txt]||txt)}
window.quickStatus=(id,status)=>{const t=tickets.find(x=>x.id===id);if(!t)return;t.status=status;t.updatedAt=new Date().toISOString();if(status==='Em atendimento')t.responsible='Administrador';if(isClosed(t)&&!t.closedAt)t.closedAt=new Date().toISOString();t.history.push(`Ação rápida: status alterado para ${status}`);saveAll();renderAll();openTicket(id)}
window.updateTicket=(id)=>{const t=tickets.find(x=>x.id===id);const old=t.status, oldP=t.priority;t.status=modalStatus.value;t.priority=modalPriority.value;t.responsible=modalResp.value;t.updatedAt=new Date().toISOString();const c=modalComment.value.trim();const newFiles=modalFiles?[...modalFiles.files].map(f=>f.name):[];if(newFiles.length)t.attachments.push(...newFiles);if(old!==t.status)t.history.push(`Status alterado de ${old} para ${t.status}`);if(oldP!==t.priority)t.history.push(`Prioridade alterada de ${oldP} para ${t.priority}`);if(isClosed(t)&&!t.closedAt)t.closedAt=new Date().toISOString();if(c)t.history.push(`Comentário/Resposta: ${c}`);if(newFiles.length)t.history.push(`Anexos adicionados: ${newFiles.join(', ')}`);saveAll();renderAll();openTicket(id)}
function clearTicketFilters(){filterSector.value='';filterCategory.value='';filterPriority.value='';filterStatus.value='';filterSla.value='';renderTicketsTable()}
function openReportCenter(){reportModal.showModal()}
window.openReportCenter=openReportCenter
function csvCell(v){return `"${String(v??'').replaceAll('"','""')}"`}
function downloadBlob(blob, filename){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800)}
function exportExcelHtmlFallback(){
  const data=filteredTickets();
  const c=counts(data);
  const rows=data.map(t=>`<tr><td>${esc(t.id)}</td><td>${esc(t.title)}</td><td>${esc(t.requester)}</td><td>${esc(t.sector)}</td><td>${esc(t.category)}</td><td>${esc(t.type)}</td><td>${esc(t.priority)}</td><td>${esc(t.status)}</td><td>${slaPercent(t)}%</td><td>${isLate(t)?'Sim':'Não'}</td><td>${fmt(t.createdAt)}</td><td>${fmt(t.updatedAt)}</td><td>${esc(t.responsible)}</td></tr>`).join('');
  const html=`<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#061b3a}h1{color:#004B8D}.cover{background:#004B8D;color:white;padding:22px;font-size:22px;font-weight:bold}.subtitle{padding:8px 0 22px;color:#475569}.kpis td{border:1px solid #dbe7f5;padding:14px;font-weight:bold;background:#f8fbff}.kpis b{display:block;font-size:24px;color:#004B8D}table{border-collapse:collapse;width:100%}th{background:#004B8D;color:white;padding:10px;border:1px solid #dbe7f5}td{padding:9px;border:1px solid #dbe7f5}tr:nth-child(even){background:#f6f9fd}</style></head><body><div class="cover">INDÚSTRIAS TOSI - TOSI SUPPORT PRO</div><h1>Relatório Executivo de Chamados de TI</h1><div class="subtitle">Gerado em ${fmt(new Date())}</div><table class="kpis"><tr><td>Total<b>${c.total}</b></td><td>Abertos<b>${c.open}</b></td><td>Em atendimento<b>${c.work}</b></td><td>Resolvidos<b>${c.done}</b></td><td>SLA vencido<b>${c.late}</b></td></tr></table><br><table><thead><tr><th>Protocolo</th><th>Título</th><th>Solicitante</th><th>Setor</th><th>Categoria</th><th>Tipo</th><th>Prioridade</th><th>Status</th><th>SLA</th><th>Vencido</th><th>Criado em</th><th>Atualizado em</th><th>Responsável</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  downloadBlob(new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),`TosiSupportPro_Relatorio_Executivo_TI_${new Date().toISOString().slice(0,10)}.xls`);
}
function exportCsvCompat(){const now=fmt(new Date());const header=[['Indústrias Tosi - Tosi Support Pro'],['Relatório Profissional de Chamados de TI'],[`Gerado em: ${now}`],[],['Protocolo','Título','Solicitante','Setor','Categoria','Tipo','Ativo','Impacto','Prioridade','Status','SLA %','SLA vencido','Criado em','Atualizado em','Responsável']];const rows=filteredTickets().map(t=>[t.id,t.title,t.requester,t.sector,t.category,t.type,t.asset,t.impact,t.priority,t.status,slaPercent(t),isLate(t)?'Sim':'Não',fmt(t.createdAt),fmt(t.updatedAt),t.responsible]);const csv='\ufeff'+[...header,...rows].map(r=>r.map(csvCell).join(';')).join('\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`TosiSupportPro_Relatorio_TI_${new Date().toISOString().slice(0,10)}.csv`)}
async function exportExecutiveExcel(){
  const btn=typeof exportBtn!=='undefined'?exportBtn:null; const old=btn?btn.innerHTML:''; if(btn){btn.disabled=true;btn.innerHTML='⏳ Gerando Excel...'}
  try{
    const payload={tickets:filteredTickets()};
    const r=await fetch('/api/report-excel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!r.ok) throw new Error('Falha na API de relatório');
    const blob=await r.blob();
    downloadBlob(blob,`TosiSupportPro_Relatorio_Executivo_TI_${new Date().toISOString().slice(0,10)}.xlsx`);
  }catch(e){
    console.error(e);
    alert('Não foi possível gerar o .xlsx pela API. Vou gerar uma versão Excel HTML profissional como fallback. Confirme depois se rodou npm install para instalar exceljs.');
    exportExcelHtmlFallback();
  }finally{if(btn){btn.disabled=false;btn.innerHTML=old;}}
}
function generateReportWindow(){const data=filteredTickets();const rows=data.map(t=>`<tr><td>${esc(t.id)}</td><td>${esc(t.title)}</td><td>${esc(t.requester)}</td><td>${esc(t.sector)}</td><td>${esc(t.type)}</td><td>${esc(t.priority)}</td><td>${esc(t.status)}</td><td>${slaPercent(t)}%</td><td>${fmt(t.createdAt)}</td></tr>`).join('');const w=window.open('','_blank');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório Tosi Support Pro</title><style>body{font-family:Arial;margin:32px;color:#061b3a}header{display:flex;justify-content:space-between;align-items:center;border-bottom:5px solid #004B8D;padding-bottom:18px;margin-bottom:24px}img{width:230px}.meta{text-align:right}h1{margin:0;color:#004B8D}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.kpi{border:1px solid #dbe7f5;border-radius:12px;padding:14px;background:#f8fbff}.kpi strong{display:block;font-size:28px;color:#004B8D}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}th{background:#004B8D;color:#fff;text-align:left}th,td{border:1px solid #dbe7f5;padding:9px}tr:nth-child(even){background:#f6f9fd}footer{margin-top:26px;font-size:12px;color:#667085}</style></head><body><header><img src="./logo-tosi.png"><div class="meta"><h1>Relatório Executivo de TI</h1><p>Tosi Support Pro - IT Help Desk / ITSM</p><p>Gerado em ${fmt(new Date())}</p></div></header><section class="kpis"><div class="kpi">Total<strong>${data.length}</strong></div><div class="kpi">Abertos<strong>${data.filter(t=>t.status==='Aberto').length}</strong></div><div class="kpi">Resolvidos<strong>${data.filter(isClosed).length}</strong></div><div class="kpi">SLA Vencido<strong>${data.filter(isLate).length}</strong></div></section><table><thead><tr><th>Protocolo</th><th>Título</th><th>Solicitante</th><th>Setor</th><th>Tipo</th><th>Prioridade</th><th>Status</th><th>SLA</th><th>Criado em</th></tr></thead><tbody>${rows}</tbody></table><footer>Documento gerado automaticamente pelo Tosi Support Pro. Uso interno Indústrias Tosi.</footer><script>window.print()<\/script></body></html>`);w.document.close()}
init();