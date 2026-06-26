const $=id=>document.getElementById(id);
const KEY='tosi-support-pro-v22-secure';
let departments=[];
let categories=[];
let statusList=[];
let users=[];
let assets=[];
let approvals=[];
let assetExtras={};
let knowledgeArticles=[];
let serviceCatalog=[];
let serviceDetails={};
let workflowStages=[];
let automations=[];
let selectedAutomationId=null;
let selectedApprovalId=null;
let automationBlockData=[];
let automationLogData=[];
let notificationSeed=[];
function nowMinus(h){return new Date(Date.now()-h*3600*1000).toISOString()}function plus(h){return new Date(Date.now()+h*3600*1000).toISOString()}
let tickets=[];
let appUser=null;
let backendReady=false;
const navItems=[['dashboard','⌂','Dashboard'],['tickets','▣','Chamados'],['newTicket','＋','Novo Chamado'],['clientPortal','◉','Portal do Usuário'],['kanban','▦','Kanban'],['workflow','⟲','Workflow'],['automations','⚡','Automações'],['approvals','✓','Aprovações'],['serviceCatalog','◈','Catálogo de Serviços'],['assets','▥','Ativos TI / CMDB'],['knowledge','▤','Base de Conhecimento'],['reports','▧','Relatórios'],['bi','📊','Business Intelligence'],['noc','🖥','Central NOC'],['settings','⚙','Configurações']];
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function saveAll(){ publishNocSnapshot(false); }

async function api(path, options={}){
  const res=await fetch('/api'+path,{...options,credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const type=res.headers.get('content-type')||'';
  const data=type.includes('application/json')?await res.json():await res.text();
  if(res.status===401){ appUser=null; if(window.app&&window.loginScreen){app.classList.add('hidden'); loginScreen.classList.remove('hidden')} throw new Error((data&&data.error)||'Sessão expirada. Faça login novamente.'); }
  if(!res.ok || (data && data.ok===false)) throw new Error((data&&data.error)||'Falha na API');
  return data;
}
async function login(email,password){
  const data=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
  appUser=data.user;
  return data.user;
}
async function logout(){
  try{await api('/auth/logout',{method:'POST',body:'{}'});}catch(e){}
  appUser=null; app.classList.add('hidden'); loginScreen.classList.remove('hidden');
}
async function checkSession(){
  try{const data=await api('/auth/me'); appUser=data.user; return true;}catch(e){return false;}
}

async function loadFrontendConfig(){
  const data=await api('/frontend-config');
  departments=data.departments||[];
  categories=data.categories||[];
  statusList=data.statusList||[];
  users=data.users||[];
  knowledgeArticles=data.knowledgeArticles||[];
  serviceCatalog=data.serviceCatalog||[];
  serviceDetails=data.serviceDetails||{};
  workflowStages=data.workflowStages||[];
  automations=data.automations||[];
  assetExtras=data.assetExtras||{};
  automationBlockData=data.automationBlockData||[];
  automationLogData=data.automationLogData||[];
  notificationSeed=data.notificationSeed||[];
  selectedAutomationId=automations[0]?.id||null;
}
function normalizeTicket(row){
  return {
    id: row.protocol || row.id,
    uuid: row.id,
    title: row.title || '',
    requester: row.requester_name || row.requester?.name || row.requester || 'Não informado',
    requesterEmail: row.requester_email || '',
    sector: row.sector || '',
    category: row.category || '',
    priority: row.priority || 'Média',
    status: row.status || 'Aberto',
    type: row.type || 'Incidente',
    asset: row.asset_code || row.asset || '',
    impact: row.impact || 'Médio',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || row.created_at || new Date().toISOString(),
    slaDueAt: row.sla_due_at || row.slaDueAt || row.created_at || new Date().toISOString(),
    closedAt: row.closed_at || row.closedAt || null,
    responsible: row.responsible_name || row.responsible?.name || row.responsible || 'Service Desk',
    attachments: row.attachments || [],
    description: row.description || '',
    history: row.history || []
  }
}
function normalizeAsset(row){
  return {
    id: row.asset_tag || row.id,
    uuid: row.id,
    nome: row.name || row.nome || '',
    tipo: row.type || row.tipo || 'Ativo',
    usuario: row.owner_name || row.usuario || 'Não atribuído',
    local: row.location || row.local || '',
    status: row.status || 'Em uso',
    risco: row.risk || row.risco || 'Baixo',
    garantia: row.warranty_until ? new Date(row.warranty_until).toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'}) : (row.garantia || '-'),
    metadata: row.metadata || {}
  }
}

function normalizeApproval(row){
  const payload=row.payload || {};
  return {
    id: row.approval_code || payload.approval_code || row.id,
    uuid: row.id,
    title: row.title || payload.title || 'Aprovação sem título',
    type: row.type || payload.type || payload.category || 'Solicitação TI',
    requester: row.requester_name || payload.requester || 'Não informado',
    department: row.department || payload.department || '-',
    approver: row.approver_name || payload.approver || 'Não definido',
    
    impact: row.impact || payload.impact || 'Médio',
    priority: row.priority || payload.priority || 'Média',
    status: row.status || 'Pendente',
    ticket: row.ticket_protocol || payload.ticket || '-',
    asset: row.asset_tag || payload.asset || '-',
    sla: row.sla_label || payload.sla || '-',
    createdAt: row.created_at || new Date().toISOString(),
    reason: row.reason || payload.reason || 'Solicitação registrada no banco de dados.',
    steps: Array.isArray(payload.steps) ? payload.steps : ['Solicitação recebida','Aguardando decisão','Registrar auditoria'],
    risk: row.risk || payload.risk || 'Aguardando análise do aprovador.'
  };
}
async function fetchApprovals(){
  const data=await api('/approvals');
  approvals=(data.approvals||[]).map(normalizeApproval);
  selectedApprovalId=approvals[0]?.id || null;
}
async function sendApprovalDecision(id,status){
  const a=approvals.find(x=>x.id===id || x.uuid===id);
  if(!a) return;
  const data=await api('/approvals',{method:'PATCH',body:JSON.stringify({id:a.uuid||a.id,status})});
  const updated=normalizeApproval(data.approval||{});
  approvals=approvals.map(x=>(x.id===id||x.uuid===id)?updated:x);
  selectedApprovalId=updated.id;
}

async function loadFromBackend(){
  try{
    const data=await api('/bootstrap');
    tickets=(data.tickets||[]).map(normalizeTicket);
    assets=(data.assets||[]).map(normalizeAsset);
    approvals=(data.approvals||[]).map(normalizeApproval);
    selectedApprovalId=approvals[0]?.id || null;
    if(data.user) appUser=data.user;
    if(data.config){
      departments=data.config.departments||departments; categories=data.config.categories||categories; statusList=data.config.statusList||statusList; users=data.config.users||users;
      knowledgeArticles=data.config.knowledgeArticles||knowledgeArticles; serviceCatalog=data.config.serviceCatalog||serviceCatalog; serviceDetails=data.config.serviceDetails||serviceDetails;
      workflowStages=data.config.workflowStages||workflowStages; automations=data.config.automations||automations; selectedAutomationId=automations[0]?.id||selectedAutomationId;
    }
    backendReady=!!data.connected;
    if(!backendReady) showSystemNotice('Supabase ainda não configurado. Dados demo foram removidos; configure as variáveis para carregar dados reais.');
  }catch(e){
    tickets=[]; assets=[]; approvals=[]; selectedApprovalId=null; backendReady=false;
    showSystemNotice('Não foi possível conectar ao back-end/Supabase: '+e.message);
  }
}
function showSystemNotice(msg){
  const old=document.querySelector('.system-db-notice'); if(old) old.remove();
  const el=document.createElement('div'); el.className='system-db-notice'; el.innerHTML='<b>Banco real</b><span>'+esc(msg)+'</span>';
  const main=document.querySelector('.main'); if(main) main.prepend(el);
}
async function refreshData(){await loadFromBackend(); renderAll();}


function fillOptions(){
  const setOptions=(el, values, placeholder='')=>{
    if(!el) return;
    const current=el.value;
    const unique=[...new Set((values||[]).filter(v=>v!==undefined&&v!==null&&String(v).trim()!==''))];
    el.innerHTML=(placeholder?`<option value="">${esc(placeholder)}</option>`:'')+unique.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if(current && [...el.options].some(o=>o.value===current)) el.value=current;
  };
  const priorityList=['Baixa','Média','Alta','Crítica'];
  const typeList=['Incidente','Requisição','Problema','Mudança','Acesso'];
  const impactList=['Baixo','Médio','Alto','Crítico'];
  setOptions(window.filterSector, departments, 'Todos');
  setOptions(window.filterCategory, categories, 'Todas');
  setOptions(window.filterPriority, priorityList, 'Todas');
  setOptions(window.filterStatus, statusList, 'Todos');
  if(window.filterSla){
    const current=filterSla.value;
    filterSla.innerHTML='<option value="">Todos</option><option value="late">Vencidos</option><option value="ok">Dentro do prazo</option>';
    if(current && [...filterSla.options].some(o=>o.value===current)) filterSla.value=current;
  }
  setOptions(window.ticketSector, departments, 'Selecione');
  setOptions(window.ticketCategory, categories, 'Selecione');
  setOptions(window.ticketPriority, priorityList, 'Selecione');
  setOptions(window.ticketType, typeList, 'Selecione');
  setOptions(window.ticketImpact, impactList, 'Selecione');
  if(window.ticketAsset){
    const current=ticketAsset.value;
    ticketAsset.innerHTML='<option value="">Sem ativo vinculado</option>'+assets.map(a=>{
      const tag=a.asset_tag||a.id||'';
      const name=a.name||a.nome||tag;
      return `<option value="${esc(tag)}">${esc(tag)} - ${esc(name)}</option>`;
    }).join('');
    if(current && [...ticketAsset.options].some(o=>o.value===current)) ticketAsset.value=current;
  }
}

function fmtDate(v){return new Date(v).toLocaleDateString('pt-BR')}function fmt(v){return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}
function isClosed(t){return ['Resolvido','Fechado'].includes(t.status)}function isLate(t){return !isClosed(t)&&new Date(t.slaDueAt)<new Date()}
function slaPercent(t){if(isClosed(t))return 100;const start=new Date(t.createdAt),due=new Date(t.slaDueAt),now=new Date();const total=due-start;if(total<=0)return 100;return Math.max(0,Math.min(100,Math.round((now-start)/total*100)))}
async function init(){
  nav.innerHTML=navItems.map(([id,ic,label])=>`<button class="nav-btn" data-page="${id}"><span>${ic}</span>${label}</button>`).join('');
  document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  loginForm.onsubmit=async e=>{
    e.preventDefault();
    const btn=loginForm.querySelector('button'); const oldText=btn.textContent; btn.disabled=true; btn.textContent='Entrando...';
    try{
      await login(loginEmail.value,loginPassword.value);
      await loadFrontendConfig();
      fillOptions();
      loginScreen.classList.add('hidden'); app.classList.remove('hidden');
      showPage('dashboard');
      await loadFromBackend();
      renderAll();
      syncUserPanel();
      startNocLiveLoop();
    }catch(err){alert(err.message||'Falha no login');}
    finally{btn.disabled=false; btn.textContent=oldText;}
  };
  logoutBtn.onclick=logout;
  if(window.userPanelBtn) userPanelBtn.onclick=openUserPanel;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeUserPanel()});
  themeBtn.onclick=()=>document.body.classList.toggle('dark');
  exportBtn.onclick=openReportCenter; printReportBtn.onclick=generateReportWindow; reportBtn.onclick=renderReports;
  ticketForm.onsubmit=createTicket;
  globalSearch.oninput=()=>{if(document.querySelector('#tickets.active-page'))renderTicketsTable()};
  ['filterSector','filterCategory','filterPriority','filterStatus','filterSla'].forEach(id=>$(id).onchange=renderTicketsTable);
  fillOptions(); showPage('dashboard'); renderAll();
  if(await checkSession()){
    try{await loadFrontendConfig(); fillOptions(); loginScreen.classList.add('hidden'); app.classList.remove('hidden'); await loadFromBackend(); renderAll(); syncUserPanel(); startNocLiveLoop();}
    catch(e){showSystemNotice('Sessão encontrada, mas não foi possível carregar dados: '+e.message)}
  }
}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active-page'));$(id).classList.add('active-page');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===id));const titles={dashboard:'Dashboard Executivo',tickets:'Chamados',ticketDetail:'Chamado 360°',newTicket:'Novo Chamado',kanban:'Kanban',serviceCatalog:'Catálogo de Serviços',assets:'CMDB Enterprise',knowledge:'Base de Conhecimento',reports:'Relatórios',settings:'Configurações',assetDetail:'Ativo 360°',workflow:'Workflow Enterprise',automations:'Automações Enterprise',clientPortal:'Portal do Usuário Premium',serviceDetail:'Serviço 360°',approvals:'Aprovações Enterprise',bi:'Business Intelligence',noc:'Central NOC Enterprise'};pageTitle.textContent=titles[id]||'Tosi Support Pro';pageSubtitle.textContent=titles[id]||'';renderAll();}
function currentUser(){return appUser||users[0]||{name:'Usuário',email:'',role:'USUARIO',sector:'TI'}}
function syncUserPanel(){
  const u=currentUser();
  const initials=(u.name||'AD').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'AD';
  document.querySelectorAll('.avatar,.user360-avatar').forEach(a=>a.textContent=initials);
  if(window.topUserName) topUserName.textContent=u.name||'Administrador';
  if(window.topUserRole) topUserRole.textContent=u.role||'ADM';
  if(window.panelUserName) panelUserName.textContent=u.name||'Administrador';
  if(window.panelUserRole) panelUserRole.textContent=(u.role||'ADM')+' • '+(u.sector||'TI');
  if(window.panelUserEmail) panelUserEmail.textContent=u.email||'';
  if(window.panelUserSector) panelUserSector.textContent=u.sector||'TI';
  if(window.panelUserProfile) panelUserProfile.textContent=u.role||'ADM';
}
function openUserPanel(){syncUserPanel(); userPanelOverlay.classList.remove('hidden'); user360Panel.classList.remove('hidden'); setTimeout(()=>user360Panel.classList.add('open'),10)}
function closeUserPanel(){if(!window.user360Panel)return; user360Panel.classList.remove('open'); setTimeout(()=>{user360Panel.classList.add('hidden'); userPanelOverlay.classList.add('hidden')},180)}
function openUserSection(section){
  const content={
    perfil:`<h4>Perfil</h4><div><span>Nome</span><b>${esc(currentUser().name||'Administrador')}</b></div><div><span>E-mail</span><b>${esc(currentUser().email||'')}</b></div><div><span>Departamento</span><b>${esc(currentUser().sector||'TI')}</b></div><div><span>Cargo</span><b>${esc(currentUser().role||'ADM')}</b></div>`,
    conta:`<h4>Conta e segurança</h4><div><span>Status da conta</span><b>Ativa</b></div><div><span>2FA</span><b>Recomendado</b></div><div><span>Sessões ativas</span><b>1 sessão</b></div><div><span>Alterar senha</span><b>Disponível após autenticação real</b></div>`,
    gerenciar:`<h4>Gerenciar conta</h4><div><span>Tema</span><b>Claro/Escuro</b></div><div><span>Notificações</span><b>E-mail e alertas internos</b></div><div><span>Permissões</span><b>${esc(currentUser().role||'ADM')}</b></div><div><span>Preferências</span><b>Idioma PT-BR</b></div>`
  };
  user360Details.innerHTML=content[section]||content.perfil;
}
async function logoutFromPanel(){closeUserPanel(); await logout()}
window.openUserPanel=openUserPanel;window.closeUserPanel=closeUserPanel;window.openUserSection=openUserSection;window.logoutFromPanel=logoutFromPanel;

function filteredTickets(){const q=globalSearch.value?.toLowerCase().trim()||'';return tickets.filter(t=>(!q||[t.id,t.title,t.requester,t.sector,t.category,t.status,t.asset].join(' ').toLowerCase().includes(q))&&(!filterSector.value||t.sector===filterSector.value)&&(!filterCategory.value||t.category===filterCategory.value)&&(!filterPriority.value||t.priority===filterPriority.value)&&(!filterStatus.value||t.status===filterStatus.value)&&(!filterSla.value||(filterSla.value==='late'?isLate(t):!isLate(t))))}
function counts(data=tickets){return{total:data.length,open:data.filter(t=>t.status==='Aberto').length,work:data.filter(t=>t.status==='Em atendimento').length,wait:data.filter(t=>t.status==='Aguardando usuário').length,done:data.filter(isClosed).length,late:data.filter(isLate).length}}
function setText(id,v){const e=$(id); if(e)e.textContent=v}
function renderAll(){const c=counts();['','Tickets'].forEach(s=>{setText('statTotal'+s,c.total);setText('statOpen'+s,c.open);setText('statWork'+s,c.work);setText('statWaiting'+s,c.wait);setText('statDone'+s,c.done);setText('statLate'+s,c.late)});renderDonut('statusDonut',tickets);renderBars('sectorBars',tickets);renderSlaPanel('slaPanel',tickets);renderCriticalQueue();renderTicketsTable();renderKanban();renderWorkflow();renderAutomations();renderApprovals();renderNotificationBadges();renderClientPortal();renderCatalog();renderAssets();renderKb();renderReports();renderBI();renderNOC();renderSettings();}
function renderDonut(el,data){if(!$(el))return;const total=Math.max(1,data.length),open=data.filter(t=>t.status==='Aberto').length,work=data.filter(t=>t.status==='Em atendimento').length,wait=data.filter(t=>t.status==='Aguardando usuário').length,done=data.filter(isClosed).length;let p1=open/total*100,p2=work/total*100,p3=wait/total*100;$(el).innerHTML=`<div class="donut-layout"><div class="donut" style="background:conic-gradient(#12b76a 0 ${p1}%, #1465ff ${p1}% ${p1+p2}%, #f5b700 ${p1+p2}% ${p1+p2+p3}%, #98a2b3 ${p1+p2+p3}% 100%)"><strong>${data.length}<small>Total</small></strong></div><div class="legend"><span style="--c:#12b76a"><b>Aberto</b><b>${open}</b></span><span style="--c:#1465ff"><b>Em atendimento</b><b>${work}</b></span><span style="--c:#f5b700"><b>Aguardando usuário</b><b>${wait}</b></span><span style="--c:#98a2b3"><b>Resolvido/Fechado</b><b>${done}</b></span></div></div>`}
function renderBars(el,data){if(!$(el))return;const groups={};data.forEach(t=>groups[t.sector]=(groups[t.sector]||0)+1);const max=Math.max(1,...Object.values(groups));$(el).innerHTML=Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar-track"><i style="width:${v/max*100}%"></i></div><b>${v}</b></div>`).join('')}
function renderSlaPanel(el,data){if(!$(el))return;const total=Math.max(1,data.length),late=data.filter(isLate).length,ok=data.length-late,score=Math.round(ok/total*100);$(el).innerHTML=`<div class="sla-score"><div class="circle" style="background:conic-gradient(#12b76a 0 ${score}%,#eef3f8 ${score}%)"><span>${score}%</span></div><div><p><strong>Taxa de Cumprimento</strong></p><div class="report-metric"><span>Dentro do prazo</span><strong>${ok}</strong></div><div class="report-metric"><span>Vencidos</span><strong>${late}</strong></div><div class="report-metric"><span>Total</span><strong>${data.length}</strong></div></div></div>`}
function renderCriticalQueue(){if(!criticalQueue)return;const critical=tickets.filter(t=>t.priority==='Alta'||t.priority==='Crítica'||isLate(t)).slice(0,4);criticalQueue.innerHTML=critical.map(t=>`<div class="critical-item"><div><strong>${esc(t.id)}</strong><br><span>${esc(t.title)}</span></div><span class="badge ${esc(t.priority)}">${isLate(t)?'SLA vencido':esc(t.priority)}</span></div>`).join('')||'<p>Nenhum chamado crítico.</p>'}
function renderTicketsTable(){if(!ticketsTable)return;const data=filteredTickets();const rows=data.map(t=>{const p=slaPercent(t);const stClass=isClosed(t)?'done':t.status==='Aguardando usuário'?'wait':'status';return `<tr><td><input type="checkbox"></td><td><a class="id-link" href="#" onclick="openTicket('${esc(t.id)}');return false;">${esc(t.id)}</a></td><td class="title-cell">${esc(t.title)}</td><td>${esc(t.requester)}</td><td>${esc(t.sector)}</td><td>${esc(t.category)}</td><td><span class="badge ${esc(t.priority)}">${esc(t.priority)}</span></td><td><span class="badge ${stClass}">${esc(t.status)}</span></td><td>${esc(t.type||'Incidente')}</td><td>${esc(t.asset||'-')}</td><td class="sla-cell"><span>${p}%</span><div class="bar"><i style="width:${p}%;background:${isLate(t)?'#f04438':isClosed(t)?'#12b76a':p>75?'#12b76a':p>45?'#f79009':'#f04438'}"></i></div></td><td>${fmt(t.createdAt)}</td><td>${fmt(t.updatedAt)}</td><td><button class="action-btn" onclick="openTicket('${esc(t.id)}')">...</button></td></tr>`}).join('');ticketsTable.innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th></th><th>Protocolo</th><th>Título</th><th>Solicitante</th><th>Setor</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Tipo</th><th>Ativo</th><th>SLA</th><th>Criado em</th><th>Atualizado em</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="14">Nenhum chamado encontrado.</td></tr>'}</tbody></table></div><div class="table-footer"><span>Mostrando 1 a ${data.length} de ${tickets.length} registros</span><div class="pages"><button class="page-btn">‹</button><button class="page-btn active">1</button><button class="page-btn">2</button><button class="page-btn">3</button><span>...</span><button class="page-btn">37</button><button class="page-btn">›</button><button class="page-btn">10 / página⌄</button></div></div>`}
function renderKanban(){if(!kanbanBoard)return;kanbanBoard.innerHTML=statusList.map(s=>`<div class="kanban-col"><h3>${s}</h3>${tickets.filter(t=>t.status===s).map(t=>`<div class="kanban-card" onclick="openTicket('${esc(t.id)}')"><strong>${esc(t.id)}</strong><p>${esc(t.title)}</p><span class="badge ${esc(t.priority)}">${esc(t.priority)}</span><br><small>${esc(t.type)} • ${fmtDate(t.createdAt)}</small></div>`).join('')||'<small>Sem chamados</small>'}</div>`).join('')}
function renderCatalog(){if(!catalogGrid)return;catalogGrid.innerHTML=serviceCatalog.map(s=>{const d=serviceDetails[s.id]||{};return `<div class="card catalog-card service-premium-card"><div class="catalog-icon">${s.icon}</div><div class="service-card-head"><h4>${esc(s.name)}</h4><span class="badge status">${esc(s.type)}</span></div><p>${esc(s.desc)}</p><div class="service-meta-grid"><span><small>SLA</small><b>${esc(s.sla)}</b></span><span><small>Responsável</small><b>${esc(s.owner)}</b></span><span><small>Fluxo</small><b>${esc(d.route||'-')}</b></span><span><small>Aprovação</small><b>${esc(d.approval||'Padrão')}</b></span></div><div class="service-actions"><button class="primary" onclick="openServiceDetail('${esc(s.id)}')">Abrir 360°</button><button class="ghost" onclick="startServiceRequest('${esc(s.id)}')">Solicitar</button></div></div>`}).join('')}

function focusPortalSearch(){showPage('clientPortal');setTimeout(()=>{const el=document.getElementById('portalSearch'); if(el)el.focus()},80)}
function renderClientPortal(){
  if(!document.getElementById('portalKpis'))return;
  const requester='João da Silva';
  const q=String(document.getElementById('portalSearch')?.value||'').toLowerCase();
  const mine=tickets.filter(t=>t.requester===requester || t.asset==='AT-0001' || t.asset==='AT-0002');
  const open=mine.filter(t=>!isClosed(t));
  const waiting=mine.filter(t=>t.status==='Aguardando usuário');
  const late=mine.filter(isLate);
  portalKpis.innerHTML=`<div class="portal-kpi blue"><small>Meus chamados</small><strong>${mine.length}</strong><span>histórico do usuário</span></div><div class="portal-kpi orange"><small>Em andamento</small><strong>${open.length}</strong><span>com suporte</span></div><div class="portal-kpi yellow"><small>Aguardando ação</small><strong>${waiting.length}</strong><span>resposta do usuário</span></div><div class="portal-kpi red"><small>SLA em atenção</small><strong>${late.length}</strong><span>prioridade alta</span></div>`;
  portalProfileStats.innerHTML=`<p><span>Departamento</span><strong>PCP</strong></p><p><span>Equipamentos</span><strong>${assets.filter(a=>a.usuario===requester || a.usuario==='Setor PCP').length}</strong></p><p><span>Chamados abertos</span><strong>${open.length}</strong></p><p><span>Último acesso</span><strong>Agora</strong></p>`;
  const ticketList=mine.filter(t=>!q||[t.id,t.title,t.category,t.status,t.priority].join(' ').toLowerCase().includes(q)).slice(0,5);
  portalTickets.innerHTML=ticketList.map(t=>`<button class="portal-ticket" onclick="openTicket('${esc(t.id)}')"><div><strong>${esc(t.id)}</strong><span>${esc(t.title)}</span></div><em class="badge ${esc(t.priority)}">${esc(t.priority)}</em><small>${esc(t.status)} • ${slaPercent(t)}% SLA</small></button>`).join('')||'<div class="empty-state">Nenhum chamado encontrado.</div>';
  const myAssets=assets.filter(a=>a.usuario===requester || a.usuario==='Setor PCP').filter(a=>!q||[a.id,a.nome,a.tipo,a.local].join(' ').toLowerCase().includes(q));
  portalAssets.innerHTML=myAssets.map(a=>{const s=assetScore(a);return `<button class="portal-asset" onclick="openAssetDetail('${esc(a.id)}')"><span>${assetIcon(a)}</span><div><strong>${esc(a.nome)}</strong><small>${esc(a.id)} • ${esc(a.local)}</small></div><b>${s}%</b></button>`}).join('')||'<div class="empty-state">Nenhum ativo vinculado.</div>';
  const catalog=serviceCatalog.filter(s=>!q||[s.name,s.desc,s.owner].join(' ').toLowerCase().includes(q)).slice(0,6);
  portalCatalog.innerHTML=catalog.map(s=>`<button class="portal-service" onclick="openServiceDetail('${esc(s.id)}')"><span>${s.icon}</span><div><strong>${esc(s.name)}</strong><small>SLA ${esc(s.sla)} • ${esc(s.owner)} • abrir 360°</small></div></button>`).join('')||'<div class="empty-state">Nenhum serviço encontrado.</div>';
  const kb=[['Resetar senha do Windows','Passo a passo para desbloqueio e troca segura de senha.'],['Impressora não imprime','Verificações rápidas de fila, toner, cabo e impressora padrão.'],['Como abrir chamado com print','Anexe evidências para acelerar o atendimento.'],['Boas práticas de segurança','Phishing, links suspeitos e anexos desconhecidos.']].filter(k=>!q||k.join(' ').toLowerCase().includes(q)).slice(0,4);
  portalKb.innerHTML=knowledgeArticles.filter(a=>!q||(`${a.title} ${a.subtitle} ${a.category}`.toLowerCase().includes(q))).map(a=>`<div class="portal-kb-item"><div><strong>${esc(a.title)}</strong><p>${esc(a.subtitle)}</p><small>${esc(a.category)} • PDF: ${esc(a.pdf)}</small></div><button onclick="openKnowledgeArticle('${a.id}')">Ler artigo</button></div>`).join('')||'<div class="empty-state">Nenhum artigo encontrado.</div>';
}
window.focusPortalSearch=focusPortalSearch

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
window.openServiceDetail=(id)=>{const s=serviceCatalog.find(x=>x.id===id); if(!s)return; const d=serviceDetails[id]||{}; showPage('serviceDetail'); const related=tickets.filter(t=>t.category===s.category || t.type===s.type); const slaNum=parseInt(s.sla)||4; const auto=automations.filter(a=>a.category==='SLA'||a.category==='Chamados'||a.category==='CMDB').slice(0,3); serviceDetailContent.innerHTML=`<div class="service360-hero"><button class="back-btn" onclick="showPage('serviceCatalog')">← Voltar</button><div class="service360-icon">${s.icon}</div><div><span class="eyebrow">Catálogo de Serviços 360°</span><h2>${esc(s.name)}</h2><p>${esc(s.desc)}</p><div class="service360-tags"><span>${esc(s.type)}</span><span>${esc(s.category)}</span><span>SLA ${esc(s.sla)}</span><span>${esc(s.owner)}</span></div></div><button class="primary" onclick="startServiceRequest('${esc(s.id)}')">＋ Solicitar este serviço</button></div>
 <div class="service360-kpis"><div><small>SLA contratado</small><strong>${esc(s.sla)}</strong><span>Tempo alvo</span></div><div><small>Chamados relacionados</small><strong>${related.length}</strong><span>Histórico do serviço</span></div><div><small>Prioridade padrão</small><strong>${esc(s.priority)}</strong><span>Classificação automática</span></div><div><small>Aprovação</small><strong>${esc((d.approval||'Padrão').split(' ')[0])}</strong><span>${esc(d.approval||'Padrão')}</span></div></div>
 <div class="service360-grid"><main>
  <section class="asset-panel"><h3>Fluxo de atendimento</h3><div class="service-flow">${(d.route||'Service Desk').split('→').map((x,i)=>`<div><span>${i+1}</span><strong>${esc(x.trim())}</strong></div>`).join('')}</div></section>
  <section class="asset-panel"><h3>Passo a passo do atendimento</h3><div class="kb-steps">${(d.steps||[]).map((x,i)=>`<div class="kb-step"><span>${i+1}</span><p>${esc(x)}</p></div>`).join('')}</div></section>
  <section class="asset-panel"><h3>Informações necessárias para abrir</h3><div class="required-fields">${(d.fields||[]).map(x=>`<label><input type="checkbox"> ${esc(x)}</label>`).join('')}</div></section>
  <section class="asset-panel"><h3>Chamados recentes desse serviço</h3><div class="asset-related-list">${related.length?related.slice(0,5).map(t=>`<button onclick="openTicket('${esc(t.id)}')"><b>${esc(t.id)}</b><span>${esc(t.title)}</span><em class="badge ${esc(t.priority)}">${esc(t.status)}</em><small>${fmt(t.createdAt)}</small></button>`).join(''):'<div class="empty-state">Nenhum chamado relacionado até agora.</div>'}</div></section>
 </main><aside>
  <section class="asset-panel sticky-panel"><h3>Solicitação guiada</h3><p class="muted">Use este serviço para abrir um chamado já classificado com SLA, categoria, tipo e prioridade corretos.</p><div class="info-list"><p><span>Categoria</span><strong>${esc(s.category)}</strong></p><p><span>Tipo ITSM</span><strong>${esc(s.type)}</strong></p><p><span>Impacto</span><strong>${esc(d.impact||'Médio')}</strong></p><p><span>Responsável</span><strong>${esc(s.owner)}</strong></p></div><button class="primary full" onclick="startServiceRequest('${esc(s.id)}')">Abrir chamado guiado</button></section>
  <section class="asset-panel"><h3>Modelo de descrição</h3><textarea class="service-template" readonly>${esc(d.template||'Descreva a solicitação com detalhes.')}</textarea><button class="ghost full" onclick="copyServiceTemplate('${esc(s.id)}')">Copiar modelo</button></section>
  <section class="asset-panel"><h3>Regras automáticas</h3><div class="service-auto-list">${auto.map(a=>`<p><b>${esc(a.name)}</b><span>${esc(a.trigger)}</span></p>`).join('')}</div></section>
  <section class="asset-panel"><h3>Orientações</h3><ul class="service-faq">${(d.faq||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
 </aside></div>`}
window.startServiceRequest=(id)=>{const s=serviceCatalog.find(x=>x.id===id); const d=serviceDetails[id]||{}; if(!s)return; showPage('newTicket'); ticketTitle.value=s.name+' - '; ticketCategory.value=s.category; ticketType.value=s.type; ticketPriority.value=s.priority; ticketImpact.value=d.impact==='Crítico'?'Crítico':d.impact==='Alto'?'Alto':d.impact==='Baixo'?'Baixo':'Médio'; ticketDescription.value=(d.template||'')+'\n\nCampos obrigatórios:\n- '+(d.fields||[]).join('\n- '); ticketDescription.focus();}
window.copyServiceTemplate=(id)=>{const d=serviceDetails[id]||{}; navigator.clipboard?.writeText(d.template||'').then(()=>alert('Modelo copiado.')).catch(()=>alert(d.template||''));}

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
  const a=assets.find(x=>x.id===id); if(!a||!window.cmdbSidePanel)return; const related=tickets.filter(t=>t.asset===a.id); const open=related.filter(t=>!isClosed(t)); const s=assetScore(a), cls=assetStatusClass(a), w=warrantyState(a);
  cmdbSidePanel.innerHTML=`<div class="cmdb-detail-head"><div class="asset-detail-icon">${assetIcon(a)}</div><div><span class="eyebrow">Ativo 360°</span><h3>${esc(a.nome)}</h3><p>${esc(a.id)} • ${esc(a.tipo)} • ${esc(a.local)}</p></div></div><div class="asset-score-ring ${cls}"><div><strong>${s}%</strong><span>Saúde do ativo</span></div></div><div class="info-list cmdb-info"><p><span>Usuário responsável</span><strong>${esc(a.usuario)}</strong></p><p><span>Status</span><strong>${esc(a.status)}</strong></p><p><span>Risco</span><strong>${esc(a.risco)}</strong></p><p><span>Garantia</span><strong>${esc(a.garantia)} • ${w.label}</strong></p><p><span>Chamados abertos</span><strong>${open.length}</strong></p><p><span>Histórico vinculado</span><strong>${related.length} chamados</strong></p></div><div class="cmdb-actions"><button class="primary" onclick="showPage('newTicket');ticketAsset.value='${esc(a.id)}'">＋ Chamado deste ativo</button><button class="ghost" onclick="openAssetDetail('${esc(a.id)}')">Abrir 360° completo</button></div><h4>Histórico vinculado</h4><div class="cmdb-linked">${related.length?related.map(t=>`<button onclick="openTicket('${esc(t.id)}')"><b>${esc(t.id)}</b><span>${esc(t.title)}</span><em class="badge ${esc(t.priority)}">${esc(t.priority)}</em></button>`).join(''):'<div class="empty-state">Nenhum chamado vinculado.</div>'}</div><h4>Checklist Enterprise</h4><div class="cmdb-checks"><label><input type="checkbox" checked> Patrimônio validado</label><label><input type="checkbox" ${w.cls==='ok'?'checked':''}> Garantia vigente</label><label><input type="checkbox" ${related.length?'checked':''}> Histórico de chamados</label><label><input type="checkbox"> Nota fiscal / contrato anexado</label></div>`;
  document.querySelectorAll('.cmdb-asset-card').forEach(b=>b.classList.toggle('selected',b.textContent.includes(a.id)));
  if(scroll)cmdbSidePanel.scrollIntoView({behavior:'smooth',block:'nearest'});
}


function assetExtra(a){return a.metadata||assetExtras[a.id]||{brand:'-',model:a.nome,serial:a.id,os:'-',cpu:'-',ram:'-',disk:'-',ip:'-',mac:'-',vendor:'-',nf:'-',purchase:'-',availability:'-',lastMaint:'-',photo:assetIcon(a),software:[],licenses:[],docs:[]}}
function assetHealthItems(a){const s=assetScore(a), cls=assetStatusClass(a);return [
  ['Disponibilidade', assetExtra(a).availability, s],['CPU / Performance', cls==='danger'?'Alto uso':'Normal', cls==='danger'?45:86],['Memória', cls==='warn'?'Atenção':'OK', cls==='warn'?62:88],['Disco / Storage', cls==='danger'?'Crítico':'OK', cls==='danger'?38:91],['Rede', a.tipo==='Rede'?'Monitorado':'OK', a.tipo==='Rede'?96:82],['Backup', a.tipo==='Servidor'?'Obrigatório':'Padrão', a.tipo==='Servidor'?72:90],['Antivírus', 'Atualizado', 100],['Garantia', warrantyState(a).label, warrantyState(a).cls==='ok'?95:warrantyState(a).cls==='warn'?55:20]
]}
function miniBar(label,value,pct){let color=pct<50?'#f04438':pct<75?'#f79009':'#12b76a';return `<div class="asset-health-row"><div><strong>${esc(label)}</strong><span>${esc(value)}</span></div><i><em style="width:${pct}%;background:${color}"></em></i><b>${pct}%</b></div>`}
function assetTimeline(a,related){const e=assetExtra(a);const rows=[['Compra do ativo',`Registrado com ${e.vendor} • ${e.nf}`,e.purchase],['Entrada no inventário',`Patrimônio ${a.id} validado no CMDB`,'Cadastro'],['Atribuição ao usuário',`${a.usuario} • ${a.local}`,'Responsável'],['Última manutenção',e.lastMaint,'Manutenção'],...related.slice(0,4).map(t=>[`Chamado ${t.id}`,t.title,fmt(t.createdAt)])];return rows.map((r,i)=>`<div class="asset-timeline-row"><span>${i+1}</span><div><strong>${esc(r[0])}</strong><p>${esc(r[1])}</p><small>${esc(r[2])}</small></div></div>`).join('')}
window.openAssetDetail=(id)=>{const a=assets.find(x=>x.id===id); if(!a)return; const e=assetExtra(a), related=tickets.filter(t=>t.asset===a.id), open=related.filter(t=>!isClosed(t)); const s=assetScore(a), w=warrantyState(a); showPage('assetDetail');
 assetDetailContent.innerHTML=`<div class="asset360-command"><button class="back-btn" onclick="showPage('assets')">← Voltar</button><div class="asset360-title"><span class="eyebrow">Digital Twin • CMDB 360°</span><h2>${esc(a.nome)}</h2><p>${esc(a.id)} • ${esc(e.brand)} ${esc(e.model)} • ${esc(a.local)}</p></div><div class="asset360-actions"><button class="primary" onclick="showPage('newTicket');ticketAsset.value='${esc(a.id)}'">＋ Chamado deste ativo</button><button class="ghost" onclick="alert('Documento anexado em modo demonstração.')">Anexar documento</button></div></div>
 <div class="asset360-kpis"><div><small>Saúde</small><strong>${s}%</strong><span class="${assetStatusClass(a)}">${assetStatusClass(a)==='danger'?'Crítico':assetStatusClass(a)==='warn'?'Atenção':'Saudável'}</span></div><div><small>Risco</small><strong>${esc(a.risco)}</strong><span>Impacto operacional</span></div><div><small>Chamados abertos</small><strong>${open.length}</strong><span>Histórico: ${related.length}</span></div><div><small>Garantia</small><strong>${esc(w.label)}</strong><span>${esc(a.garantia)}</span></div><div><small>Disponibilidade</small><strong>${esc(e.availability)}</strong><span>Histórico operacional</span></div></div>
 <div class="asset360-grid"><main class="asset360-main">
  <section class="asset-panel hero-device"><div class="device-photo">${esc(e.photo||assetIcon(a))}</div><div><span class="eyebrow">Ficha técnica</span><h3>${esc(e.brand)} ${esc(e.model)}</h3><div class="device-specs"><span><b>Serial</b>${esc(e.serial)}</span><span><b>Sistema</b>${esc(e.os)}</span><span><b>CPU</b>${esc(e.cpu)}</span><span><b>Memória</b>${esc(e.ram)}</span><span><b>Disco</b>${esc(e.disk)}</span><span><b>IP</b>${esc(e.ip)}</span><span><b>MAC</b>${esc(e.mac)}</span><span><b>Fornecedor</b>${esc(e.vendor)}</span></div></div></section>
  <section class="asset-panel"><h3>Saúde técnica do ativo</h3><div class="asset-health-list">${assetHealthItems(a).map(x=>miniBar(x[0],x[1],x[2])).join('')}</div></section>
  <section class="asset-panel"><h3>Timeline do ativo</h3><div class="asset-timeline">${assetTimeline(a,related)}</div></section>
  <section class="asset-panel"><h3>Chamados vinculados</h3><div class="asset-related-list">${related.length?related.map(t=>`<button onclick="openTicket('${esc(t.id)}')"><b>${esc(t.id)}</b><span>${esc(t.title)}</span><em class="badge ${esc(t.priority)}">${esc(t.priority)}</em><small>${esc(t.status)}</small></button>`).join(''):'<div class="empty-state">Nenhum chamado vinculado.</div>'}</div></section>
 </main><aside class="asset360-side">
  <section class="asset-panel sticky-panel"><div class="asset-score-ring ${assetStatusClass(a)}"><div><strong>${s}%</strong><span>Saúde do ativo</span></div></div><div class="info-list"><p><span>Usuário</span><strong>${esc(a.usuario)}</strong></p><p><span>Local</span><strong>${esc(a.local)}</strong></p><p><span>Status</span><strong>${esc(a.status)}</strong></p><p><span>Nota Fiscal</span><strong>${esc(e.nf)}</strong></p><p><span>Compra</span><strong>${esc(e.purchase)}</strong></p><p><span>Disponibilidade</span><strong>${esc(e.availability)}</strong></p></div></section>
  <section class="asset-panel"><h3>Softwares</h3><div class="chip-list">${(e.software||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></section>
  <section class="asset-panel"><h3>Licenças</h3><div class="license-list">${(e.licenses||[]).map(x=>`<p><b>${esc(x)}</b><span>Válido / controlado</span></p>`).join('')}</div></section>
  <section class="asset-panel"><h3>Documentos</h3><div class="doc-list">${(e.docs||[]).map(x=>`<button>📄 ${esc(x)}</button>`).join('')}<button>＋ Anexar novo documento</button></div></section>
  <section class="asset-panel"><h3>QR Code</h3><div class="fake-qr"><span>${esc(a.id)}</span></div><p class="muted">Escaneie para abrir a ficha 360° do ativo.</p></section>
 </aside></div>`
}


function saveWorkflow(){}
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
window.resetWorkflowDemo=()=>{alert('Modo demo removido. O workflow é carregado pelo proxy.');}
const workflowRulesData = window.workflowRules || [];
function renderWorkflowRules(){if(!window.workflowRules)return;workflowRules.innerHTML=workflowRulesData.map(r=>`<div class="rule-card"><span>${esc(r.tag)}</span><p><b>Se</b> ${esc(r.if)}</p><p><b>Então</b> ${esc(r.then)}</p></div>`).join('')}
function renderWorkflowAnalytics(byStage){if(!window.workflowAnalytics)return;const max=Math.max(1,...Object.values(byStage||{}).map(a=>a.length));workflowAnalytics.innerHTML=workflowStages.map(st=>{const n=(byStage?.[st.id]||[]).length;return `<div class="analytics-row"><span>${esc(st.name)}</span><i><b style="width:${Math.round(n/max*100)}%;background:${esc(st.color)}"></b></i><strong>${n}</strong></div>`}).join('')}




// Sprint 17 - Central de Aprovações + Notificações Enterprise (dados reais/Supabase)
function saveApprovals(){}
function renderApprovals(){
 if(!window.approvalList)return;
 const filter=window.approvalFilter?.value||'';
 const list=approvals.filter(a=>!filter||a.status===filter);
 const pending=approvals.filter(a=>a.status==='Pendente').length, approved=approvals.filter(a=>a.status==='Aprovado').length, rejected=approvals.filter(a=>a.status==='Rejeitado').length;
 approvalKpis.innerHTML=`<div class="approval-kpi blue"><small>Pendentes</small><strong>${pending}</strong><span>aguardando decisão</span></div><div class="approval-kpi green"><small>Aprovadas</small><strong>${approved}</strong><span>liberadas</span></div><div class="approval-kpi red"><small>Rejeitadas</small><strong>${rejected}</strong><span>com justificativa</span></div><div class="approval-kpi orange"><small>Tempo médio</small><strong>2h 40m</strong><span>aprovação operacional</span></div>`;
 if(!approvals.length){
   approvalList.innerHTML='<div class="empty-state"><strong>Nenhuma aprovação encontrada.</strong><p>Quando o Supabase estiver configurado e houver solicitações reais, elas aparecerão nesta fila.</p></div>';
   selectedApprovalId=null;
   renderApprovalDetail();renderApprovalAnalytics();renderApprovalTimeline();renderApprovalPolicies();
   return;
 }
 if(!selectedApprovalId || !approvals.some(a=>a.id===selectedApprovalId)) selectedApprovalId=approvals[0]?.id || null;
 approvalList.innerHTML=list.map(a=>`<button class="approval-card ${a.id===selectedApprovalId?'active':''}" onclick="selectApproval('${esc(a.id)}')"><div><span class="approval-type">${esc(a.type)}</span><h4>${esc(a.title)}</h4><p>${esc(a.reason)}</p><div class="approval-meta"><span>${esc(a.requester)}</span><span>${esc(a.department)}</span><span>${esc(a.ticket)}</span></div></div><aside><b class="badge ${esc(a.priority)}">${esc(a.priority)}</b><strong>${esc(a.impact || 'Médio')}</strong><small>SLA ${esc(a.sla)}</small><em class="approval-status ${esc(a.status)}">${esc(a.status)}</em></aside></button>`).join('')||'<div class="empty-state">Nenhuma aprovação encontrada para este filtro.</div>';
 renderApprovalDetail();renderApprovalAnalytics();renderApprovalTimeline();renderApprovalPolicies();
}
function currentApproval(){return approvals.find(a=>a.id===selectedApprovalId)||approvals[0]}
window.selectApproval=id=>{selectedApprovalId=id;renderApprovals()}
function renderApprovalDetail(){if(!window.approvalDetail)return;const a=currentApproval();if(!a){approvalDetail.innerHTML='<div class="empty-state"><strong>Nenhuma aprovação selecionada.</strong><p>Cadastre aprovações reais no Supabase ou crie solicitações pelo fluxo do sistema.</p></div>';return} approvalDetail.innerHTML=`<span class="eyebrow">Aprovação 360°</span><h3>${esc(a.id)}</h3><h4>${esc(a.title)}</h4><div class="approval-decision"><button class="primary" onclick="decideApproval('${esc(a.id)}','Aprovado')">✓ Aprovar</button><button class="danger-btn" onclick="decideApproval('${esc(a.id)}','Rejeitado')">✕ Rejeitar</button></div><div class="approval-info"><p><span>Solicitante</span><b>${esc(a.requester)}</b></p><p><span>Aprovador</span><b>${esc(a.approver)}</b></p><p><span>Departamento</span><b>${esc(a.department)}</b></p><p><span>Chamado</span><b>${esc(a.ticket)}</b></p><p><span>Ativo</span><b>${esc(a.asset)}</b></p><p><span>Impacto</span><b>${esc(a.impact)}</b></p><p><span>Status</span><b>${esc(a.status)}</b></p></div><div class="approval-risk"><strong>Risco / justificativa</strong><p>${esc(a.risk)}</p></div><h4>Fluxo de aprovação</h4><div class="approval-steps">${a.steps.map((st,i)=>`<div><span>${i+1}</span><p>${esc(st)}</p></div>`).join('')}</div>`}
window.decideApproval=async(id,status)=>{try{await sendApprovalDecision(id,status);await refreshData();showPage('approvals')}catch(e){alert('Não foi possível atualizar aprovação: '+e.message)}}
window.createRealApproval=()=>{alert('Nova aprovação deve ser criada a partir de uma solicitação real ou via Supabase/API. O modo demo foi removido.')}
function renderApprovalAnalytics(){if(!window.approvalAnalytics)return;if(!approvals.length){approvalAnalytics.innerHTML='<div class="empty-state">Sem dados reais para analytics.</div>';return}const by={};approvals.forEach(a=>by[a.approver]=(by[a.approver]||0)+1);const max=Math.max(1,...Object.values(by));approvalAnalytics.innerHTML=Object.entries(by).map(([k,v])=>`<div class="analytics-row"><span>${esc(k)}</span><i><b style="width:${v/max*100}%"></b></i><strong>${v}</strong></div>`).join('')+`<div class="approval-mini-note">Dados calculados a partir do banco real.</div>`}
function renderApprovalTimeline(){if(!window.approvalTimeline)return;approvalTimeline.innerHTML=approvals.length?approvals.slice(0,5).map(a=>`<div class="approval-event"><span>${esc(a.status)}</span><div><strong>${esc(a.id)}</strong><p>${esc(a.title)}</p></div><small>${esc(a.sla)}</small></div>`).join(''):'<div class="empty-state">Nenhum evento de aprovação no banco.</div>'}
function renderApprovalPolicies(){if(!window.approvalPolicies)return;approvalPolicies.innerHTML=['Solicitação crítica exige gestor responsável','Acesso remoto exige MFA e aprovação de TI','Mudança crítica exige janela e plano de rollback','Software não homologado exige análise de segurança'].map(p=>`<div class="policy-item">✓ ${esc(p)}</div>`).join('')}
function renderNotificationBadges(){const pending=approvals?approvals.filter(a=>a.status==='Pendente').length:0; if(window.mailBadge)mailBadge.textContent=Math.max(1,pending); if(window.alertBadge)alertBadge.textContent=tickets.filter(isLate).length+pending;}
window.toggleNotificationCenter=()=>{const el=window.notificationCenter;if(!el)return;el.classList.toggle('hidden');renderNotificationCenter()}
function renderNotificationCenter(){if(!window.notificationCenter)return;const pending=approvals.filter(a=>a.status==='Pendente').slice(0,3).map(a=>['Aprovação',a.title,a.id,'warn']);const late=tickets.filter(isLate).slice(0,2).map(t=>['SLA',t.id+' vencido',t.title,'danger']);const items=[...late,...pending,...notificationSeed];notificationCenter.innerHTML=`<div class="notif-head"><strong>Centro de Notificações</strong><button onclick="toggleNotificationCenter()">×</button></div>${items.slice(0,8).map(n=>`<button class="notif-item ${n[3]}" onclick="showPage('${n[0]==='Aprovação'?'approvals':'tickets'}');toggleNotificationCenter()"><span>${n[0]}</span><b>${esc(n[1])}</b><small>${esc(n[2])}</small></button>`).join('')}<button class="notif-footer" onclick="showPage('approvals');toggleNotificationCenter()">Ver aprovações</button>`}

// Sprint 13 - Central de Automações Enterprise
function saveAutomations(){}
function renderAutomations(){
 if(!window.automationKpis) return;
 const active=automations.filter(a=>a.enabled).length, runs=automations.reduce((s,a)=>s+a.runs,0), fails=automations.reduce((s,a)=>s+(a.runs-a.success),0), hours=automations.reduce((s,a)=>s+a.savedHours,0);
 automationKpis.innerHTML=`<div class="automation-kpi blue"><small>Automações</small><strong>${automations.length}</strong><span>${active} ativas</span></div><div class="automation-kpi green"><small>Execuções</small><strong>${runs}</strong><span>via proxy</span></div><div class="automation-kpi red"><small>Falhas</small><strong>${fails}</strong><span>requer atenção</span></div><div class="automation-kpi orange"><small>Tempo otimizado</small><strong>${hours}h</strong><span>ganho operacional</span></div>`;
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
window.addAutomationRule=()=>{alert('Criação de automações deve ser feita via proxy/API com autenticação administrativa.')}
window.resetAutomationsDemo=()=>{alert('Modo demo removido. As automações são carregadas pelo proxy.')}
function renderAutomationBlocks(){if(!window.automationBlocks)return;automationBlocks.innerHTML=automationBlockData.map((b,i)=>`<button class="automation-block"><span>${['◇','✉','💬','☎','⏱','＋','⇄','⌛','☰','✓','PDF','API','◷','▥'][i]}</span>${esc(b)}</button>`).join('')}
function renderAutomationTemplates(){if(!window.automationTemplates)return;automationTemplates.innerHTML=automations.map(t=>`<button onclick="selectedAutomationId='${esc(t.id)}';renderAutomations()"><strong>${esc(t.name)}</strong><span>${esc(t.category)} • ${t.actions.length} ações</span></button>`).join('')||'<div class="empty-state">Nenhuma automação configurada no proxy.</div>'}
function renderAutomationLogs(){if(!window.automationLogs)return;automationLogs.innerHTML=automationLogData.map(l=>`<div class="automation-log"><small>${esc(l[0])}</small><div><strong>${esc(l[1])}</strong><span>${esc(l[2])}</span></div><b class="${l[3].includes('Falha')?'fail':'ok'}">${esc(l[3])}</b></div>`).join('')}


function openKnowledgeArticle(id){
 const a=knowledgeArticles.find(x=>x.id===id); if(!a)return;
 const steps=a.steps.map((x,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b><span>${esc(x)}</span></li>`).join('');
 const checks=a.checks.map(x=>`<li>✓ ${esc(x)}</li>`).join('');
 articleModalContent.innerHTML=`
  <div class="article360-head">
    <div><span class="eyebrow dark-visible">Base de Conhecimento 360°</span><h2>${esc(a.title)}</h2><p>${esc(a.subtitle)}</p></div>
    <div class="article360-meta"><strong>${esc(a.sla)}</strong><span>SLA recomendado</span></div>
  </div>
  <div class="article360-grid">
    <main class="article360-main card">
      <div class="article360-toolbar"><span>${esc(a.category)}</span><span>${esc(a.audience)}</span><span>PDF: ${esc(a.pdf)}</span></div>
      <h3>Passo a passo</h3><ol class="article-steps">${steps}</ol>
      <h3>Checklist de segurança</h3><ul class="article-checks">${checks}</ul>
      <div class="article-warning"><strong>Quando abrir chamado?</strong><p>${esc(a.whenOpen)}</p></div>
    </main>
    <aside class="article360-side card">
      <h3>Resumo rápido</h3>
      <p><b>Categoria:</b> ${esc(a.category)}</p><p><b>Público:</b> ${esc(a.audience)}</p><p><b>Documento:</b> ${esc(a.pdf)}</p>
      <button class="primary" onclick="showPage('newTicket'); articleModal.close();">+ Abrir chamado com este assunto</button>
      <button class="ghost" onclick="window.print()">Imprimir / Salvar PDF</button>
    </aside>
  </div>`;
 articleModal.showModal();
}

function renderKb(){
 if(!kbList)return;
 kbList.innerHTML=knowledgeArticles.map(a=>`<article class="kb-card-pro">
   <div><span class="kb-pill">${esc(a.category)}</span><h3>${esc(a.title)}</h3><p>${esc(a.subtitle)}</p><small>Arquivo sugerido: ${esc(a.pdf)} • Público: ${esc(a.audience)}</small></div>
   <button class="primary" onclick="openKnowledgeArticle('${a.id}')">Abrir artigo 360°</button>
 </article>`).join('');
}

function biMetrics(){
  const total=tickets.length;
  const closed=tickets.filter(isClosed).length;
  const late=tickets.filter(isLate).length;
  const open=total-closed;
  const sla=Math.round(((total-late)/Math.max(1,total))*100);
  const high=tickets.filter(t=>(t.priority==='Alta'||t.priority==='Crítica')&&!isClosed(t)).length;
  const linkedAssets=new Set(tickets.map(t=>t.asset).filter(Boolean)).size;
  const criticalAssets=assets.filter(a=>a.risco==='Alto'||a.status==='Crítico').length;
  const approvalsPending=typeof approvals!=='undefined'?approvals.filter(a=>a.status==='Pendente').length:0;
  const health=Math.max(1,Math.min(100,Math.round((sla*0.45)+((closed/Math.max(1,total))*100*0.25)+((1-criticalAssets/Math.max(1,assets.length))*100*0.2)+((1-late/Math.max(1,total))*100*0.1))));
  const onTime=Math.max(0,total-late); const backlog=open; const assetAttention=criticalAssets;
  return {total,closed,late,open,sla,high,linkedAssets,criticalAssets,approvalsPending,health,onTime,backlog,assetAttention};
}
function renderBI(){
  if(!window.biPanel)return;
  const m=biMetrics();
  const byCat={}; tickets.forEach(t=>byCat[t.category]=(byCat[t.category]||0)+1);
  const byTech={}; tickets.forEach(t=>byTech[t.responsible||'Service Desk']=(byTech[t.responsible||'Service Desk']||0)+1);
  const maxTech=Math.max(1,...Object.values(byTech));
  const categoriesHtml=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>`<div class="bi-row"><span>${esc(k)}</span><i><b style="width:${v/Math.max(1,m.total)*100}%"></b></i><strong>${v}</strong></div>`).join('');
  const techHtml=Object.entries(byTech).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>`<div class="bi-tech"><span>${i+1}</span><div><b>${esc(k)}</b><small>${Math.max(82,100-(i*3))}% SLA • ${v} chamados</small></div><strong>${v}</strong></div>`).join('');
  const days=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const heat=days.map((d,i)=>`<div class="heat-cell level-${(i%5)+1}"><b>${d}</b><span>${[18,24,31,15,27,6,4][i]}</span></div>`).join('');
  const hours=['07h','08h','09h','10h','11h','13h','14h','15h','16h','17h'];
  const hourly=hours.map((h,i)=>`<div class="hour-row"><span>${h}</span><i><b style="width:${[22,55,92,74,42,35,68,80,49,28][i]}%"></b></i></div>`).join('');
  const assetTypes={}; assets.forEach(a=>assetTypes[a.tipo]=(assetTypes[a.tipo]||0)+1);
  const assetsHtml=Object.entries(assetTypes).map(([k,v])=>`<span class="bi-pill"><b>${v}</b>${esc(k)}</span>`).join('');
  biPanel.innerHTML=`
    <div class="bi-hero card">
      <div><span class="eyebrow">Business Intelligence</span><h3>Central Executiva de Inteligência da TI</h3><p>Visão gerencial com SLA, backlog, risco operacional, produtividade, ativos e tendências da operação de Help Desk.</p></div>
      <div class="bi-health"><div class="bi-gauge" style="background:conic-gradient(#12b76a 0 ${m.health}%,#e8eef6 ${m.health}% 100%)"><span>${m.health}%</span></div><b>Saúde geral da TI</b><small>${m.health>=90?'Operação saudável':'Operação exige atenção'}</small></div>
    </div>
    <div class="bi-kpis">
      <div class="card bi-kpi"><small>Chamados</small><strong data-count="${m.total}">${m.total}</strong><span>Volume total analisado</span></div>
      <div class="card bi-kpi"><small>SLA</small><strong>${m.sla}%</strong><span>${m.late} vencido(s)</span></div>
      <div class="card bi-kpi"><small>Backlog</small><strong>${m.open}</strong><span>Abertos ou em andamento</span></div>
      <div class="card bi-kpi"><small>Críticos</small><strong>${m.high}</strong><span>Alta prioridade</span></div>
      <div class="card bi-kpi"><small>MTTR</small><strong>3h 20m</strong><span>Tempo médio</span></div>
      <div class="card bi-kpi"><small>CSAT</small><strong>96%</strong><span>Satisfação média</span></div>
    </div>
    <div class="bi-grid-main">
      <div class="card bi-card"><h3>Tendência da operação</h3><div class="bi-line"><svg viewBox="0 0 520 150" preserveAspectRatio="none"><polyline points="0,118 60,92 120,98 180,70 240,82 300,45 360,58 420,35 520,28" fill="none" stroke="#0068ff" stroke-width="5" stroke-linecap="round"/><polyline points="0,132 60,118 120,122 180,100 240,108 300,82 360,88 420,76 520,64" fill="none" stroke="#12b76a" stroke-width="4" stroke-linecap="round" opacity=".7"/></svg></div><div class="bi-legend"><span><i class="blue-dot"></i> Chamados</span><span><i class="green-dot"></i> Resolvidos</span></div></div>
      <div class="card bi-card"><h3>Ranking de técnicos</h3>${techHtml}</div>
      <div class="card bi-card"><h3>Heatmap de incidentes</h3><div class="heatmap">${heat}</div><p class="bi-note">Quarta e sexta apresentam maior concentração de chamados.</p></div>
      <div class="card bi-card"><h3>Chamados por horário</h3>${hourly}</div>
    </div>
    <div class="bi-grid-secondary">
      <div class="card bi-card"><h3>Categorias com maior demanda</h3>${categoriesHtml}</div>
      <div class="card bi-card"><h3>Eficiência Operacional</h3><div class="finance-total">${m.sla}%</div><div class="report-metric"><span>Chamados no prazo</span><strong>${m.onTime}</strong></div><div class="report-metric"><span>Backlog operacional</span><strong>${m.backlog}</strong></div><div class="report-metric"><span>Ativos em atenção</span><strong>${m.assetAttention}</strong></div></div>
      <div class="card bi-card"><h3>Mapa de ativos</h3><div class="asset-pills">${assetsHtml}</div><div class="report-metric"><span>Ativos vinculados a chamados</span><strong>${m.linkedAssets}</strong></div><div class="report-metric"><span>Ativos críticos</span><strong>${m.criticalAssets}</strong></div></div>
      <div class="card bi-card"><h3>Exportação executiva</h3><button class="primary" onclick="openReportCenter()">Centro de Relatórios</button><button class="ghost" onclick="exportExecutiveExcel()">Excel BI</button><button class="ghost" onclick="generateReportWindow()">PDF Executivo</button><button class="ghost" onclick="openTvMode()">Modo TV / NOC</button></div>
    </div>`;
}
function openTvMode(){
  const m=biMetrics();
  const w=window.open('','_blank');
  w.document.write(`<!doctype html><html><head><title>TV Mode - Tosi Support Pro</title><style>body{margin:0;background:#061b3a;color:white;font-family:Arial;overflow:hidden}.tv{height:100vh;display:grid;grid-template-columns:1.2fr 1fr;gap:28px;padding:48px;background:radial-gradient(circle at top right,#0068ff55,transparent 35%),linear-gradient(135deg,#03162c,#004b8d)}h1{font-size:58px;margin:0}.big{font-size:150px;font-weight:900}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.card{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:28px;padding:28px}.card b{font-size:54px;display:block}.ok{color:#12b76a}.warn{color:#f5b700}.danger{color:#ff4d5d}</style></head><body><div class="tv"><div><h1>TOSI SUPPORT PRO</h1><p>Business Intelligence • Operação de TI</p><div class="big ok">${m.health}%</div><h2>Saúde geral da TI</h2></div><div class="cards"><div class="card"><span>Chamados</span><b>${m.total}</b></div><div class="card"><span>SLA</span><b class="ok">${m.sla}%</b></div><div class="card"><span>Backlog</span><b class="warn">${m.open}</b></div><div class="card"><span>Críticos</span><b class="danger">${m.high}</b></div><div class="card"><span>Ativos críticos</span><b>${m.criticalAssets}</b></div><div class="card"><span>Aprovações</span><b>${m.approvalsPending}</b></div></div></div></body></html>`);
  w.document.close();
}



const NOC_SNAPSHOT_KEY='tosi-support-pro-noc-snapshot';
let nocBackendTimer=null;
let nocRenderTimer=null;
let lastNocSyncAt=0;

function buildNocSnapshot(){
  const late=tickets.filter(isLate).length;
  const critical=tickets.filter(t=>(t.priority==='Alta'||t.priority==='Crítica')&&!isClosed(t)).length;
  const open=tickets.filter(t=>!isClosed(t)).length;
  const closed=tickets.filter(isClosed).length;
  const services=[
    {name:'Portal Service Desk',group:'Aplicações',status:'online',uptime:'99,99%',lat:'18ms',load:28},
    {name:'ERP Interno',group:'Sistemas',status:'online',uptime:'99,95%',lat:'32ms',load:41},
    {name:'Banco SQL',group:'Banco de dados',status:'online',uptime:'100%',lat:'12ms',load:36},
    {name:'Backup Cloud',group:'Backup',status:late>0?'warning':'online',uptime:late>0?'96,20%':'99,70%',lat:'-',load:late>0?74:39},
    {name:'File Server',group:'Arquivos',status:critical>1?'critical':'warning',uptime:critical>1?'91,40%':'97,80%',lat:critical>1?'85ms':'48ms',load:critical>1?92:68},
    {name:'Proxy / API',group:'Integrações',status:'online',uptime:'99,98%',lat:'22ms',load:31}
  ];
  const online=services.filter(s=>s.status==='online').length;
  const links=[
    ['Internet Matriz','online',100,'Operadora principal'],
    ['Link Backup',late>0?'warning':'online',late>0?62:93,'Failover disponível'],
    ['VPN Usuários','online',94,'Acesso remoto'],
    ['Wi-Fi Administrativo','online',98,'Access points'],
    ['Rede Produção',critical>1?'critical':'warning',critical>1?55:78,'Oscilação detectada']
  ];
  const printers=[
    ['Impressora PCP',open>0?'warning':'online',open>0?'Toner 12%':'Operacional','AT-0002'],
    ['Administração','online','Operacional','AT-0005'],
    ['Expedição',critical>2?'critical':'online',critical>2?'Offline':'Operacional','AT-0006'],
    ['RH','online','Papel OK','AT-0007']
  ];
  const health=Math.max(1,Math.min(100,Math.round(100-(late*4)-(critical*3))));
  const securityBlocks=1284 + (critical*17) + (late*9);
  const timeline=[
    ['Agora', late?`SLA vencido detectado em ${late} chamado(s)`:'Operação dentro do SLA principal', late?'danger':'ok'],
    ['Agora', critical?`${critical} chamado(s) de alta prioridade em aberto`:'Nenhum chamado crítico novo', critical?'warn':'ok'],
    ['08:55','Impressora PCP com toner baixo','warn'],
    ['08:41','Backup cloud concluído com atraso','warn'],
    ['08:10',`Firewall bloqueou ${securityBlocks} tentativas suspeitas`,'ok']
  ];
  return {
    generatedAt:new Date().toISOString(),
    health, late, critical, open, closed,
    total:tickets.length,
    serviceTotal:services.length,
    online,
    securityBlocks,
    networkStatus: links.some(l=>l[1]==='critical')?'Crítico':links.some(l=>l[1]==='warning')?'Atenção':'Normal',
    backupStatus: late>0?'Atrasado':'OK',
    services, links, printers, timeline,
    assetsRisk:assets.filter(a=>a.status==='Crítico'||a.risco==='Alto').length,
    availability:'98,7%'
  };
}
function publishNocSnapshot(syncBackend=true){
  const snapshot=buildNocSnapshot();
  if(syncBackend) syncNocSnapshot(snapshot);
  return snapshot;
}
async function syncNocSnapshot(snapshot=buildNocSnapshot()){
  const now=Date.now();
  if(now-lastNocSyncAt<5000) return;
  lastNocSyncAt=now;
  try{
    await fetch('/api/noc-snapshot',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({snapshot,tickets,assets})});
  }catch(e){}
}
async function loadNocSnapshot(){
  try{
    const res=await fetch('/api/noc-snapshot',{cache:'no-store',credentials:'include'});
    const data=await res.json();
    if(data && data.ok && data.snapshot) return data.snapshot;
  }catch(e){}
  return buildNocSnapshot();
}
function startNocLiveLoop(){
  clearInterval(nocRenderTimer);
  clearInterval(nocBackendTimer);
  nocRenderTimer=setInterval(()=>{
    updateNocClock();
    const isNocActive=document.querySelector('#noc.active-page');
    if(isNocActive) renderNOC(false);
  },10000);
  nocBackendTimer=setInterval(()=>publishNocSnapshot(true),5000);
  publishNocSnapshot(true);
}
function renderNOC(sync=true){
  if(!window.nocPanel)return;
  const snap=publishNocSnapshot(sync);
  const services=snap.services, links=snap.links, printers=snap.printers, timeline=snap.timeline;
  const serviceCards=services.map(s=>`<div class="noc-service ${s.status}"><div><b>${esc(s.name)}</b><span>${esc(s.group)}</span></div><strong>${s.status==='online'?'Online':s.status==='warning'?'Atenção':'Crítico'}</strong><p><span>Uptime</span><b>${s.uptime}</b></p><p><span>Latência</span><b>${s.lat}</b></p><div class="bar"><i style="width:${s.load}%;background:${s.status==='critical'?'#f04438':s.status==='warning'?'#f79009':'#12b76a'}"></i></div></div>`).join('');
  nocPanel.innerHTML=`
    <div class="noc-hero">
      <div><span class="eyebrow">Network Operations Center</span><h3>Central de Monitoramento de TI</h3><p>Painel vivo para acompanhar serviços críticos, infraestrutura, SLA, ativos, links, impressoras e alertas da operação. Os dados são publicados automaticamente e ficam prontos para integração com Supabase/API.</p></div>
      <div class="noc-clock"><small>Atualização automática</small><strong id="nocClock">--:--:--</strong><button class="primary" onclick="openNocTvMode()">Modo TV</button></div>
    </div>
    <div class="noc-kpi-grid">
      <div class="card noc-kpi"><small>Saúde da operação</small><strong>${snap.health}%</strong><span class="${snap.health>=90?'ok':'danger'}">${snap.health>=90?'Estável':'Atenção'}</span></div>
      <div class="card noc-kpi"><small>Serviços monitorados</small><strong>${snap.serviceTotal}</strong><span>Aplicações críticas</span></div>
      <div class="card noc-kpi"><small>Alertas ativos</small><strong>${snap.late+snap.critical}</strong><span class="danger">SLA / Críticos</span></div>
      <div class="card noc-kpi"><small>Backlog de TI</small><strong>${snap.open}</strong><span>Chamados abertos</span></div>
      <div class="card noc-kpi"><small>Ativos em risco</small><strong>${snap.assetsRisk}</strong><span>CMDB</span></div>
      <div class="card noc-kpi"><small>Disponibilidade média</small><strong>${snap.availability}</strong><span class="ok">Últimas 24h</span></div>
    </div>
    <div class="noc-grid-main">
      <div class="card noc-card wide"><div class="panel-title"><h3>Serviços críticos</h3><button onclick="renderNOC()">Atualizar</button></div><div class="noc-services">${serviceCards}</div></div>
      <div class="card noc-card"><h3>SLA ao vivo</h3><div class="noc-gauge" style="background:conic-gradient(#12b76a 0 ${Math.max(0,100-snap.late*10)}%,#f04438 ${Math.max(0,100-snap.late*10)}% 100%)"><span>${Math.max(0,100-snap.late*10)}%</span></div><div class="report-metric"><span>Dentro do prazo</span><strong>${snap.total-snap.late}</strong></div><div class="report-metric"><span>Vencidos</span><strong>${snap.late}</strong></div><div class="report-metric"><span>Críticos</span><strong>${snap.critical}</strong></div></div>
      <div class="card noc-card"><h3>Links e rede</h3>${links.map(l=>`<div class="noc-link ${l[1]}"><div><b>${esc(l[0])}</b><small>${esc(l[3])}</small></div><span>${l[2]}%</span><div class="bar"><i style="width:${l[2]}%;background:${l[1]==='critical'?'#f04438':l[1]==='warning'?'#f79009':'#12b76a'}"></i></div></div>`).join('')}</div>
      <div class="card noc-card"><h3>Microsoft 365 / Cloud</h3>${['Exchange Online','Teams','SharePoint','OneDrive','Entra ID'].map((n,i)=>`<div class="cloud-row"><span class="dot ${i===2?'warning':'online'}"></span><b>${n}</b><small>${i===2?'Degradação leve':'Operacional'}</small></div>`).join('')}</div>
      <div class="card noc-card"><h3>Firewall / Segurança</h3><div class="security-ring"><strong>${snap.securityBlocks.toLocaleString('pt-BR')}</strong><span>bloqueios hoje</span></div><div class="report-metric"><span>CPU</span><strong>23%</strong></div><div class="report-metric"><span>RAM</span><strong>61%</strong></div><div class="report-metric"><span>Sessões</span><strong>12.834</strong></div></div>
      <div class="card noc-card"><h3>Impressoras</h3>${printers.map(p=>`<div class="printer-row ${p[1]}"><span>${p[1]==='online'?'🟢':p[1]==='warning'?'🟡':'🔴'}</span><div><b>${esc(p[0])}</b><small>${esc(p[3])} • ${esc(p[2])}</small></div></div>`).join('')}</div>
      <div class="card noc-card wide"><h3>Mapa da empresa</h3><div class="site-map">${['TI','PCP','Produção','Administração','RH','Recepção','Sala TI','Expedição'].map((s,i)=>`<button class="site-node ${i===5?'critical':i===3?'warning':'online'}"><span>${i===5?'🔴':i===3?'🟡':'🟢'}</span>${s}</button>`).join('')}</div></div>
      <div class="card noc-card"><h3>Linha do tempo</h3>${timeline.map(t=>`<div class="noc-event ${t[2]}"><small>${t[0]}</small><b>${esc(t[1])}</b></div>`).join('')}</div>
      <div class="card noc-card"><h3>Recomendação operacional</h3><div class="noc-ai"><strong>Prioridades agora</strong><p>1. Validar serviços em atenção.</p><p>2. Verificar links de rede oscilando.</p><p>3. Acompanhar chamados com SLA vencido.</p><button class="ghost" onclick="showPage('tickets')">Ver chamados críticos</button></div></div>
    </div>`;
  updateNocClock();
}
function updateNocClock(){
  if(window.nocClock)nocClock.textContent=new Date().toLocaleTimeString('pt-BR');
}
setInterval(updateNocClock,1000);
window.openNocTvMode=()=>{
  publishNocSnapshot(true);
  const w=window.open('','_blank');
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>NOC TV</title>
  <style>
    :root{--ok:#12b76a;--warn:#f79009;--danger:#f04438;--line:#1b64a5;--card:#092b54;--bg:#03172f}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:white;font-family:Arial,Helvetica,sans-serif;padding:34px;overflow:hidden}
    header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:26px}
    h1{font-size:54px;margin:0 0 12px;letter-spacing:.02em}.sub{opacity:.92;font-size:17px}
    .clock{text-align:right}.clock strong{font-size:44px}.clock small{display:block;opacity:.75;margin-top:8px}
    .tv{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}.card{background:var(--card);border:1px solid var(--line);border-radius:24px;padding:30px;min-height:145px;box-shadow:0 18px 40px rgba(0,0,0,.18)}
    .card span{display:block;font-size:16px;margin-bottom:10px}.card strong{font-size:58px;display:block;line-height:1}.card small{font-weight:bold;opacity:.9}
    .ok{color:var(--ok)}.warn{color:var(--warn)}.danger{color:var(--danger)}
    .wide{grid-column:span 2;min-height:240px}.services{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.svc{border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:13px;background:rgba(255,255,255,.04)}.svc b{display:block}.svc small{opacity:.8}
    .timeline{display:grid;gap:10px;margin-top:14px}.event{padding:12px;border-left:5px solid var(--ok);background:rgba(255,255,255,.05);border-radius:10px}.event.warn{border-color:var(--warn)}.event.danger{border-color:var(--danger)}
    .footer{position:fixed;bottom:16px;left:34px;right:34px;display:flex;justify-content:space-between;color:#b9d6f8;font-size:13px}
  </style></head><body>
    <header><div><h1>TOSI SUPPORT PRO • NOC</h1><div class="sub">Central de Monitoramento de TI • Dados vivos do Help Desk / CMDB / SLA</div></div><div class="clock"><strong id="tvClock">--:--:--</strong><small id="tvUpdated">Sincronizando...</small></div></header>
    <main class="tv">
      <div class="card"><span>Saúde TI</span><strong id="tvHealth" class="ok">--%</strong></div>
      <div class="card"><span>Chamados abertos</span><strong id="tvOpen">--</strong></div>
      <div class="card"><span>SLA vencido</span><strong id="tvLate" class="danger">--</strong></div>
      <div class="card"><span>Serviços online</span><strong id="tvServices" class="ok">--/--</strong></div>
      <div class="card"><span>Firewall</span><strong id="tvFirewall">--</strong><small>bloqueios hoje</small></div>
      <div class="card"><span>Rede</span><strong id="tvNetwork" class="warn">--</strong></div>
      <div class="card"><span>Backup</span><strong id="tvBackup" class="warn">--</strong></div>
      <div class="card"><span>Última atualização</span><strong id="tvLast">--:--:--</strong></div>
      <div class="card wide"><span>Serviços críticos</span><div id="tvServiceList" class="services"></div></div>
      <div class="card wide"><span>Linha do tempo</span><div id="tvTimeline" class="timeline"></div></div>
    </main>
    <div class="footer"><span>Atualização automática a cada 1 segundo na tela e a cada 5 segundos na API/Supabase quando configurado.</span><span>Tosi Support Pro v19 • Modo TV</span></div>
    <script>
      const KEY='${NOC_SNAPSHOT_KEY}';
      const fmtTime=v=>{try{return new Date(v).toLocaleTimeString('pt-BR')}catch(e){return '--:--:--'}};
      function fallback(){return {health:0,open:0,late:0,online:0,serviceTotal:0,securityBlocks:0,networkStatus:'--',backupStatus:'--',generatedAt:new Date().toISOString(),services:[],timeline:[]};}
      async function load(){
        let snap=null;
        snap=null
        try{
          const res=await fetch('/api/noc-snapshot',{cache:'no-store',credentials:'include'});
          const data=await res.json();
          if(data&&data.ok&&data.snapshot) snap=data.snapshot;
        }catch(e){}
        return snap||fallback();
      }
      async function paint(){
        const s=await load();
        const clock=new Date().toLocaleTimeString('pt-BR');
        tvClock.textContent=clock;
        tvHealth.textContent=(s.health||0)+'%'; tvHealth.className=(s.health>=90?'ok':s.health>=70?'warn':'danger');
        tvOpen.textContent=s.open||0;
        tvLate.textContent=s.late||0;
        tvServices.textContent=(s.online||0)+'/'+(s.serviceTotal||0); tvServices.className=(s.online===s.serviceTotal?'ok':'warn');
        tvFirewall.textContent=Number(s.securityBlocks||0).toLocaleString('pt-BR');
        tvNetwork.textContent=s.networkStatus||'--'; tvNetwork.className=s.networkStatus==='Normal'?'ok':s.networkStatus==='Atenção'?'warn':'danger';
        tvBackup.textContent=s.backupStatus||'--'; tvBackup.className=s.backupStatus==='OK'?'ok':'warn';
        tvLast.textContent=fmtTime(s.generatedAt);
        tvUpdated.textContent='Última sincronização: '+fmtTime(s.generatedAt);
        tvServiceList.innerHTML=(s.services||[]).slice(0,6).map(x=>'<div class="svc"><b>'+x.name+'</b><small>'+x.group+' • '+(x.status==='online'?'Online':x.status==='warning'?'Atenção':'Crítico')+'</small></div>').join('');
        tvTimeline.innerHTML=(s.timeline||[]).slice(0,5).map(x=>'<div class="event '+(x[2]||'')+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
      }
      setInterval(paint,1000);
      paint();
    </script></body></html>`;
  w.document.write(html);w.document.close();
}

function renderReports(){if(!reportOps)return;const total=tickets.length,closed=tickets.filter(isClosed).length,late=tickets.filter(isLate).length;reportOps.innerHTML=`<div class="report-metric"><span>Total de chamados</span><strong>${total}</strong></div><div class="report-metric"><span>Resolvidos/fechados</span><strong>${closed}</strong></div><div class="report-metric"><span>Taxa de conclusão</span><strong>${total?Math.round(closed/total*100):0}%</strong></div><div class="report-metric"><span>Backlog operacional</span><strong>${total-closed}</strong></div>`;reportSla.innerHTML=`<div class="report-metric"><span>SLA vencido</span><strong>${late}</strong></div><div class="report-metric"><span>Críticos em aberto</span><strong>${tickets.filter(t=>(t.priority==='Crítica'||t.priority==='Alta')&&!isClosed(t)).length}</strong></div><div class="report-metric"><span>Dentro do prazo</span><strong>${total-late}</strong></div>`;if(reportTable)reportTable.innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th>Indicador</th><th>Indicador</th><th>Comentário executivo</th></tr></thead><tbody><tr><td>MTTR médio</td><td>3h20m</td><td>Tempo médio competitivo para suporte interno.</td></tr><tr><td>Chamados críticos</td><td>${tickets.filter(t=>t.priority==='Crítica'||t.priority==='Alta').length}</td><td>Requer acompanhamento do gestor de TI.</td></tr><tr><td>Ativos impactados</td><td>${new Set(tickets.map(t=>t.asset).filter(Boolean)).size}</td><td>Vínculo com CMDB agrega rastreabilidade.</td></tr></tbody></table></div>`}
function renderSettings(){if(!departmentsList)return;departmentsList.innerHTML=departments.map(d=>`<span class="chip">${esc(d)}</span>`).join('');usersList.innerHTML=users.map(u=>`<div class="ticket-item"><div><strong>${esc(u.name)}</strong><br><small>${esc(u.email)} • ${esc(u.sector)}</small></div><span class="badge">${esc(u.role)}</span></div>`).join('')}
async function createTicket(e){
  e.preventDefault();
  const priority=ticketPriority.value;
  const payload={
    title:ticketTitle.value,
    requester_name:ticketRequester.value || (appUser?.name || 'Administrador'),
    sector:ticketSector.value,
    category:ticketCategory.value,
    priority,
    status:'Aberto',
    type:ticketType.value,
    asset_code:ticketAsset.value,
    impact:ticketImpact.value,
    location:ticketLocation.value,
    description:ticketDescription.value,
    attachments:[...ticketFiles.files].map(f=>({file_name:f.name,size_bytes:f.size,mime_type:f.type}))
  };
  const btn=ticketForm.querySelector('button[type="submit"], .primary'); const old=btn?btn.innerHTML:'';
  try{
    if(btn){btn.disabled=true;btn.innerHTML='Salvando no Supabase...'}
    await api('/tickets',{method:'POST',body:JSON.stringify(payload)});
    ticketForm.reset(); ticketRequester.value=appUser?.name || 'Administrador';
    await refreshData(); showPage('tickets');
  }catch(err){
    alert('Não foi possível salvar no banco: '+err.message+'\n\nConfira SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.');
  }finally{if(btn){btn.disabled=false;btn.innerHTML=old}}
}
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
    const r=await fetch('/api/report-excel',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
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

async function bootSecureApp(){
  try{
    const r=await fetch('/api/shell');
    if(!r.ok) throw new Error('Falha ao carregar shell');
    document.body.innerHTML=await r.text();
  }catch(e){
    document.body.innerHTML='<div style="font-family:Arial;padding:32px;color:#061b3a"><h1>Tosi Support Pro</h1><p>Não foi possível carregar a interface segura pelo proxy.</p><pre>'+String(e.message)+'</pre></div>';
    return;
  }
  await init();
}
bootSecureApp();

function toggleLoginPassword(){
  const input=document.getElementById('loginPassword');
  if(!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}
