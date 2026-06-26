import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

function readJsonBody(req){
  return new Promise((resolve,reject)=>{
    if(req.body && typeof req.body === 'object') return resolve(req.body);
    let data='';
    req.on('data',chunk=>{data+=chunk});
    req.on('end',()=>{try{resolve(data?JSON.parse(data):{})}catch(e){reject(e)}});
    req.on('error',reject);
  });
}
function fmtDate(v){
  const d=new Date(v); if(Number.isNaN(d.getTime())) return '';
  return d;
}
function isClosed(t){return ['Resolvido','Fechado'].includes(t.status)}
function isLate(t){return !isClosed(t)&&new Date(t.slaDueAt)<new Date()}
function slaPercent(t){
  if(isClosed(t)) return 100;
  const start=new Date(t.createdAt), due=new Date(t.slaDueAt), now=new Date();
  const total=due-start;
  if(total<=0) return 100;
  return Math.max(0,Math.min(100,Math.round((now-start)/total*100)));
}
function groupCount(items, keyFn){
  const map=new Map();
  for(const item of items){const key=keyFn(item)||'Não informado'; map.set(key,(map.get(key)||0)+1)}
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}
function applySheetDefaults(ws){
  ws.views=[{state:'frozen', ySplit:1}];
  ws.properties.defaultRowHeight=18;
  ws.eachRow(row=>{row.alignment={vertical:'middle', wrapText:true};});
}
function styleTitle(ws,title,subtitle){
  ws.mergeCells('A1:O1');
  ws.getCell('A1').value=title;
  ws.getCell('A1').font={bold:true,size:20,color:{argb:'FFFFFFFF'}};
  ws.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF004B8D'}};
  ws.getCell('A1').alignment={vertical:'middle',horizontal:'center'};
  ws.getRow(1).height=32;
  ws.mergeCells('A2:O2');
  ws.getCell('A2').value=subtitle;
  ws.getCell('A2').font={italic:true,color:{argb:'FF475569'}};
  ws.getCell('A2').alignment={horizontal:'center'};
}
function styleHeader(row){
  row.eachCell(c=>{
    c.font={bold:true,color:{argb:'FFFFFFFF'}};
    c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF004B8D'}};
    c.alignment={vertical:'middle',horizontal:'center',wrapText:true};
    c.border={top:{style:'thin',color:{argb:'FFD9E6F2'}},left:{style:'thin',color:{argb:'FFD9E6F2'}},bottom:{style:'thin',color:{argb:'FFD9E6F2'}},right:{style:'thin',color:{argb:'FFD9E6F2'}}};
  });
}
function colorCell(cell, value){
  const colors={
    'Alta':'FFFFE2E2','Crítica':'FFFFB4B4','Média':'FFFFF3CD','Baixa':'FFE4F8EC',
    'Aberto':'FFE8F2FF','Em atendimento':'FFE8F2FF','Aguardando usuário':'FFFFF3CD','Resolvido':'FFE4F8EC','Fechado':'FFE5E7EB','Sim':'FFFFE2E2','Não':'FFE4F8EC'
  };
  if(colors[value]) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:colors[value]}};
  if(['Alta','Crítica','Sim'].includes(value)) cell.font={bold:true,color:{argb:'FFDC2626'}};
  if(['Baixa','Não','Resolvido','Fechado'].includes(value)) cell.font={bold:true,color:{argb:'FF059669'}};
  if(['Média','Aguardando usuário'].includes(value)) cell.font={bold:true,color:{argb:'FFD97706'}};
}
async function buildExcelReport(tickets=[]){
  const wb=new ExcelJS.Workbook();
  wb.creator='Tosi Support Pro';
  wb.created=new Date();
  wb.modified=new Date();
  wb.properties={title:'Relatório Profissional de Chamados de TI',subject:'Help Desk / ITSM',company:'Indústrias Tosi'};
  const filtered=Array.isArray(tickets)?tickets:[];
  const totals={total:filtered.length,open:filtered.filter(t=>t.status==='Aberto').length,work:filtered.filter(t=>t.status==='Em atendimento').length,wait:filtered.filter(t=>t.status==='Aguardando usuário').length,closed:filtered.filter(isClosed).length,late:filtered.filter(isLate).length};
  const now=new Date();

  const resumo=wb.addWorksheet('Resumo Executivo',{views:[{showGridLines:false}]});
  styleTitle(resumo,'INDÚSTRIAS TOSI - TOSI SUPPORT PRO','Relatório Executivo de Chamados de TI | Gerado em '+now.toLocaleString('pt-BR'));
  resumo.getColumn(1).width=24; resumo.getColumn(2).width=18; resumo.getColumn(3).width=18; resumo.getColumn(4).width=18; resumo.getColumn(5).width=18; resumo.getColumn(6).width=18;
  const kpiRows=[['Indicador','Valor','Descrição'],['Total de chamados',totals.total,'Volume total filtrado'],['Abertos',totals.open,'Chamados aguardando triagem'],['Em atendimento',totals.work,'Chamados em suporte'],['Aguardando usuário',totals.wait,'Pendentes de retorno'],['Resolvidos/Fechados',totals.closed,'Finalizados'],['SLA vencido',totals.late,'Itens críticos']];
  resumo.addRows([[],...kpiRows]);
  styleHeader(resumo.getRow(4));
  for(let r=5;r<=10;r++){resumo.getRow(r).height=24; resumo.getCell(r,2).font={bold:true,size:14,color:{argb:'FF004B8D'}};}
  resumo.getRange?.('A4:C10');
  ['A4:C10'].forEach(()=>{});
  resumo.addTable({name:'ResumoExecutivo',ref:'A4',headerRow:true,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:[{name:'Indicador'},{name:'Valor'},{name:'Descrição'}],rows:kpiRows.slice(1)});
  resumo.getCell('E4').value='SLA'; resumo.getCell('F4').value='Quantidade'; styleHeader(resumo.getRow(4));
  const slaRows=[['Dentro do prazo',filtered.length-totals.late],['Vencidos',totals.late],['Taxa de cumprimento',totals.total?Math.round((filtered.length-totals.late)/totals.total*100)+'%':'0%']];
  resumo.getCell('E5').value='Dentro do prazo'; resumo.getCell('F5').value=filtered.length-totals.late;
  resumo.getCell('E6').value='Vencidos'; resumo.getCell('F6').value=totals.late;
  resumo.getCell('E7').value='Taxa de cumprimento'; resumo.getCell('F7').value=totals.total?Math.round((filtered.length-totals.late)/totals.total*100)/100:0; resumo.getCell('F7').numFmt='0%';
  resumo.getCell('E9').value='Observação executiva'; resumo.getCell('E9').font={bold:true,color:{argb:'FF004B8D'}}; resumo.mergeCells('E10:H13'); resumo.getCell('E10').value='Este arquivo foi gerado em formato Excel profissional, com abas de resumo, tabelas filtráveis e visões tipo tabela dinâmica para análise gerencial da central de TI.'; resumo.getCell('E10').alignment={wrapText:true,vertical:'top'};

  const chamados=wb.addWorksheet('Chamados');
  const columns=[
    {header:'Protocolo',key:'id',width:16},{header:'Título',key:'title',width:36},{header:'Solicitante',key:'requester',width:20},{header:'Setor',key:'sector',width:16},{header:'Categoria',key:'category',width:22},{header:'Tipo',key:'type',width:16},{header:'Ativo',key:'asset',width:14},{header:'Impacto',key:'impact',width:12},{header:'Prioridade',key:'priority',width:12},{header:'Status',key:'status',width:20},{header:'SLA %',key:'sla',width:10},{header:'SLA vencido',key:'late',width:12},{header:'Criado em',key:'created',width:19},{header:'Atualizado em',key:'updated',width:19},{header:'Responsável',key:'responsible',width:22},{header:'Descrição',key:'description',width:45}
  ];
  chamados.columns=columns;
  chamados.getRow(1).values=columns.map(c=>c.header); styleHeader(chamados.getRow(1)); chamados.views=[{state:'frozen',ySplit:1}];
  filtered.forEach(t=>chamados.addRow({id:t.id,title:t.title,requester:t.requester,sector:t.sector,category:t.category,type:t.type,asset:t.asset||'-',impact:t.impact,priority:t.priority,status:t.status,sla:slaPercent(t)/100,late:isLate(t)?'Sim':'Não',created:fmtDate(t.createdAt),updated:fmtDate(t.updatedAt),responsible:t.responsible,description:t.description||''}));
  chamados.getColumn('sla').numFmt='0%'; chamados.getColumn('created').numFmt='dd/mm/yyyy hh:mm'; chamados.getColumn('updated').numFmt='dd/mm/yyyy hh:mm';
  chamados.addTable({name:'TabelaChamadosTI',ref:'A1',headerRow:true,totalsRow:false,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:columns.map(c=>({name:c.header,filterButton:true})),rows:filtered.map(t=>[t.id,t.title,t.requester,t.sector,t.category,t.type,t.asset||'-',t.impact,t.priority,t.status,slaPercent(t)/100,isLate(t)?'Sim':'Não',fmtDate(t.createdAt),fmtDate(t.updatedAt),t.responsible,t.description||''])});
  chamados.eachRow((row,rowNumber)=>{if(rowNumber===1)return; [8,9,10,12].forEach(i=>colorCell(row.getCell(i),row.getCell(i).value)); row.eachCell(c=>{c.border={bottom:{style:'thin',color:{argb:'FFE5EAF2'}}}; c.alignment={vertical:'middle',wrapText:true};});});

  const dinamica=wb.addWorksheet('Tabela Dinâmica');
  styleTitle(dinamica,'VISÕES GERENCIAIS - TABELA DINÂMICA','Resumo automático por status, setor, categoria, prioridade e responsável');
  dinamica.getColumn(1).width=26; dinamica.getColumn(2).width=14; dinamica.getColumn(4).width=26; dinamica.getColumn(5).width=14; dinamica.getColumn(7).width=26; dinamica.getColumn(8).width=14;
  const blocks=[['Status',groupCount(filtered,t=>t.status),1],['Setor',groupCount(filtered,t=>t.sector),4],['Prioridade',groupCount(filtered,t=>t.priority),7],['Categoria',groupCount(filtered,t=>t.category),1,14],['Responsável',groupCount(filtered,t=>t.responsible),4,14],['Tipo ITSM',groupCount(filtered,t=>t.type),7,14]];
  for(const [title,rows,col,start=4] of blocks){dinamica.getCell(start,col).value=title; dinamica.getCell(start,col+1).value='Qtd'; styleHeader(dinamica.getRow(start)); rows.forEach(([k,v],idx)=>{dinamica.getCell(start+1+idx,col).value=k; dinamica.getCell(start+1+idx,col+1).value=v;});}

  const sla=wb.addWorksheet('SLA');
  styleTitle(sla,'ANÁLISE DE SLA','Priorização de risco e controle de vencimentos');
  sla.columns=[{header:'Protocolo',key:'id',width:16},{header:'Título',key:'title',width:36},{header:'Prioridade',key:'priority',width:14},{header:'Status',key:'status',width:20},{header:'SLA %',key:'sla',width:12},{header:'Vencido',key:'late',width:12},{header:'Vencimento SLA',key:'due',width:20},{header:'Responsável',key:'responsible',width:22}];
  sla.getRow(4).values=sla.columns.map(c=>c.header); styleHeader(sla.getRow(4));
  filtered.forEach((t,i)=>{const r=sla.getRow(5+i); r.values=[t.id,t.title,t.priority,t.status,slaPercent(t)/100,isLate(t)?'Sim':'Não',fmtDate(t.slaDueAt),t.responsible]; r.getCell(5).numFmt='0%'; r.getCell(7).numFmt='dd/mm/yyyy hh:mm'; colorCell(r.getCell(3),t.priority); colorCell(r.getCell(4),t.status); colorCell(r.getCell(6),isLate(t)?'Sim':'Não');});
  sla.views=[{state:'frozen',ySplit:4}];

  const tecnico=wb.addWorksheet('Técnicos');
  styleTitle(tecnico,'PRODUTIVIDADE DA EQUIPE','Resumo por responsável técnico');
  tecnico.getRow(4).values=['Responsável','Total','Abertos','Em atendimento','Resolvidos/Fechados','SLA vencido','Taxa SLA']; styleHeader(tecnico.getRow(4));
  const respRows=groupCount(filtered,t=>t.responsible).map(([name])=>{
    const arr=filtered.filter(t=>t.responsible===name); const late=arr.filter(isLate).length;
    return [name,arr.length,arr.filter(t=>t.status==='Aberto').length,arr.filter(t=>t.status==='Em atendimento').length,arr.filter(isClosed).length,late,arr.length?(arr.length-late)/arr.length:0];
  });
  tecnico.addRows(respRows); tecnico.getColumn(7).numFmt='0%'; tecnico.columns.forEach(c=>c.width=20);

  const categorias=wb.addWorksheet('Categorias');
  styleTitle(categorias,'ANÁLISE POR CATEGORIA','Volume de chamados por serviço de TI');
  categorias.getRow(4).values=['Categoria','Quantidade','% do total']; styleHeader(categorias.getRow(4));
  groupCount(filtered,t=>t.category).forEach(([k,v],i)=>{categorias.getRow(5+i).values=[k,v,filtered.length?v/filtered.length:0]; categorias.getCell(5+i,3).numFmt='0%';}); categorias.columns.forEach(c=>c.width=26);

  [resumo,chamados,dinamica,sla,tecnico,categorias].forEach(ws=>{
    ws.eachRow(row=>row.eachCell(cell=>{cell.alignment={vertical:'middle',wrapText:true};}));
    ws.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
  });

  return wb.xlsx.writeBuffer();
}


function defaultNocSnapshot(){
  return {
    generatedAt:new Date().toISOString(),
    health:96, open:0, late:0, critical:0, total:0,
    serviceTotal:6, online:5, securityBlocks:1284,
    networkStatus:'Atenção', backupStatus:'Atrasado',
    services:[
      {name:'Portal Service Desk',group:'Aplicações',status:'online',uptime:'99,99%',lat:'18ms',load:28},
      {name:'ERP Interno',group:'Sistemas',status:'online',uptime:'99,95%',lat:'32ms',load:41},
      {name:'Banco SQL',group:'Banco de dados',status:'online',uptime:'100%',lat:'12ms',load:36},
      {name:'Backup Cloud',group:'Backup',status:'warning',uptime:'96,20%',lat:'-',load:74},
      {name:'File Server',group:'Arquivos',status:'critical',uptime:'91,40%',lat:'85ms',load:92},
      {name:'Proxy / API',group:'Integrações',status:'online',uptime:'99,98%',lat:'22ms',load:31}
    ],
    timeline:[['Agora','Aguardando sincronização do front-end','warn']]
  };
}
function buildNocSnapshotFromBody(body={}){
  if(body.snapshot && typeof body.snapshot === 'object') {
    return {...body.snapshot, generatedAt:new Date().toISOString()};
  }
  const tickets=Array.isArray(body.tickets)?body.tickets:[];
  const assets=Array.isArray(body.assets)?body.assets:[];
  const closed=t=>['Resolvido','Fechado'].includes(t.status);
  const late=t=>!closed(t)&&new Date(t.slaDueAt)<new Date();
  const lateCount=tickets.filter(late).length;
  const critical=tickets.filter(t=>(t.priority==='Alta'||t.priority==='Crítica')&&!closed(t)).length;
  const open=tickets.filter(t=>!closed(t)).length;
  const health=Math.max(1,Math.min(100,Math.round(100-(lateCount*4)-(critical*3))));
  const snapshot=defaultNocSnapshot();
  return {...snapshot,generatedAt:new Date().toISOString(),health,open,late:lateCount,critical,total:tickets.length,assetsRisk:assets.filter(a=>a.status==='Crítico'||a.risco==='Alto').length};
}
async function supabaseRest(pathname, options={}){
  const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY||'';
  if(!base || !key) return null;
  const url=`${base}/rest/v1/${pathname}`;
  const res=await fetch(url,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...(options.headers||{})}});
  if(!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.status===204?null:await res.json();
}

function hasSupabase(){return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY));}
async function dbSelect(table, query='select=*'){
  const rows=await supabaseRest(`${table}?${query}`,{method:'GET'});
  return Array.isArray(rows)?rows:[];
}
async function nextProtocol(){
  const y=new Date().getFullYear();
  const rows=await dbSelect('tickets',`select=protocol&protocol=like.CH-${y}-%&order=created_at.desc&limit=1`);
  const last=rows[0]?.protocol || `CH-${y}-0000`;
  const n=Number(String(last).split('-').pop()||0)+1;
  return `CH-${y}-${String(n).padStart(4,'0')}`;
}
function slaDue(priority){
  const h=priority==='Crítica'?1:priority==='Alta'?4:priority==='Média'?12:24;
  const d=new Date(); d.setHours(d.getHours()+h); return d.toISOString();
}
async function createAudit(entity, entity_id, action, payload={}){
  try{await supabaseRest('audit_logs',{method:'POST',body:JSON.stringify({entity,entity_id,action,payload})});}catch(e){}
}
async function getBootstrap(){
  if(!hasSupabase()) return {connected:false, profiles:[], tickets:[], assets:[], approvals:[], automations:[]};
  const [profiles,tickets,assets,approvals,automations]=await Promise.all([
    dbSelect('profiles','select=*&order=created_at.desc'),
    dbSelect('tickets','select=*&order=created_at.desc'),
    dbSelect('assets','select=*&order=created_at.desc'),
    dbSelect('approvals','select=*&order=created_at.desc'),
    dbSelect('automations','select=*&order=created_at.desc')
  ]);
  return {connected:true, profiles,tickets,assets,approvals,automations};
}
async function createTicket(body){
  const protocol=await nextProtocol();
  const row={
    protocol,
    title:body.title,
    description:body.description||'',
    sector:body.sector||'TI',
    category:body.category||'Suporte Técnico',
    priority:body.priority||'Média',
    status:body.status||'Aberto',
    type:body.type||'Incidente',
    impact:body.impact||'Médio',
    asset_code:body.asset_code||body.asset||null,
    requester_name:body.requester_name||'Não informado',
    requester_email:body.requester_email||null,
    responsible_name:body.responsible_name||'Service Desk',
    sla_due_at:body.sla_due_at||slaDue(body.priority),
    created_at:new Date().toISOString(),
    updated_at:new Date().toISOString()
  };
  const inserted=await supabaseRest('tickets',{method:'POST',body:JSON.stringify(row)});
  const ticket=Array.isArray(inserted)?inserted[0]:inserted;
  await createAudit('ticket', ticket?.id || protocol, 'ticket.created', row);
  const attachments=Array.isArray(body.attachments)?body.attachments:[];
  if(ticket?.id && attachments.length){
    await supabaseRest('ticket_attachments',{method:'POST',body:JSON.stringify(attachments.map(a=>({ticket_id:ticket.id,file_name:a.file_name||a.name||'arquivo',file_path:a.file_path||'',mime_type:a.mime_type||'',size_bytes:a.size_bytes||0})))})
  }
  return ticket;
}
async function updateTicket(protocolOrId, body){
  const patch={...body, updated_at:new Date().toISOString()};
  delete patch.id; delete patch.protocol;
  const key=String(protocolOrId).startsWith('CH-')?`protocol=eq.${encodeURIComponent(protocolOrId)}`:`id=eq.${encodeURIComponent(protocolOrId)}`;
  const rows=await supabaseRest(`tickets?${key}`,{method:'PATCH',body:JSON.stringify(patch)});
  await createAudit('ticket', protocolOrId, 'ticket.updated', patch);
  return Array.isArray(rows)?rows[0]:rows;
}
async function createAsset(body){
  const row={
    asset_tag:body.asset_tag||body.id,
    name:body.name||body.nome,
    type:body.type||body.tipo||'Ativo',
    owner_name:body.owner_name||body.usuario||null,
    location:body.location||body.local||null,
    status:body.status||'Em uso',
    risk:body.risk||body.risco||'Baixo',
    warranty_until:body.warranty_until||null,
    metadata:body.metadata||{}
  };
  const inserted=await supabaseRest('assets',{method:'POST',body:JSON.stringify(row)});
  await createAudit('asset', row.asset_tag, 'asset.created', row);
  return Array.isArray(inserted)?inserted[0]:inserted;
}

async function saveNocSnapshot(snapshot){
  try{
    const row={id:'default',snapshot,updated_at:new Date().toISOString()};
    return await supabaseRest('noc_snapshots?id=eq.default',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)});
  }catch(e){
    console.warn('NOC snapshot local fallback:', e.message);
    globalThis.__tosiNocSnapshot=snapshot;
    return null;
  }
}
async function getNocSnapshot(){
  try{
    const rows=await supabaseRest('noc_snapshots?id=eq.default&select=snapshot,updated_at&limit=1',{method:'GET'});
    if(Array.isArray(rows)&&rows[0]?.snapshot) return rows[0].snapshot;
  }catch(e){}
  return globalThis.__tosiNocSnapshot || defaultNocSnapshot();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const route = req.url || '/api';
  if (route.includes('/health')) return res.status(200).json({ ok:true, service:'Tosi Support Pro API', version:'6.1.0' });
  if (route.includes('/bootstrap')) {
    try { return res.status(200).json({ok:true,...await getBootstrap()}); }
    catch(e){ return res.status(500).json({ok:false,error:'Falha ao carregar bootstrap',details:e.message}); }
  }
  if (route.includes('/tickets')) {
    try {
      if(!hasSupabase()) return res.status(503).json({ok:false,error:'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'});
      if(req.method==='GET') return res.status(200).json({ok:true,tickets:await dbSelect('tickets','select=*&order=created_at.desc')});
      if(req.method==='POST') return res.status(200).json({ok:true,ticket:await createTicket(await readJsonBody(req))});
      if(req.method==='PATCH') { const body=await readJsonBody(req); return res.status(200).json({ok:true,ticket:await updateTicket(body.id||body.protocol,body)}); }
      return res.status(405).json({ok:false,error:'Método não permitido'});
    } catch(e){ return res.status(500).json({ok:false,error:'Falha nos chamados',details:e.message}); }
  }
  if (route.includes('/assets')) {
    try {
      if(!hasSupabase()) return res.status(503).json({ok:false,error:'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'});
      if(req.method==='GET') return res.status(200).json({ok:true,assets:await dbSelect('assets','select=*&order=created_at.desc')});
      if(req.method==='POST') return res.status(200).json({ok:true,asset:await createAsset(await readJsonBody(req))});
      return res.status(405).json({ok:false,error:'Método não permitido'});
    } catch(e){ return res.status(500).json({ok:false,error:'Falha nos ativos',details:e.message}); }
  }
  if (route.includes('/noc-snapshot')) {
    try {
      if (req.method === 'POST') {
        const body=await readJsonBody(req);
        const snapshot=buildNocSnapshotFromBody(body);
        await saveNocSnapshot(snapshot);
        return res.status(200).json({ok:true,snapshot,persisted:!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY)});
      }
      if (req.method === 'GET') {
        const snapshot=await getNocSnapshot();
        return res.status(200).json({ok:true,snapshot,persisted:!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY)});
      }
      return res.status(405).json({ok:false,error:'Método não permitido'});
    } catch(e) {
      return res.status(500).json({ok:false,error:'Falha no snapshot NOC',details:e.message});
    }
  }
  if (route.includes('/report-excel')) {
    if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Método não permitido'});
    try {
      const body=await readJsonBody(req);
      const buffer=await buildExcelReport(body.tickets||[]);
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition',`attachment; filename="TosiSupportPro_Relatorio_Executivo_TI_${new Date().toISOString().slice(0,10)}.xlsx"`);
      return res.status(200).send(Buffer.from(buffer));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ok:false,error:'Falha ao gerar Excel executivo',details:e.message});
    }
  }
  return res.status(200).json({ ok:true, name:'Tosi Support Pro API', version:'6.1.0', next:'Conectar Supabase Auth, Storage, JWT HttpOnly e relatórios persistentes.' });
}
