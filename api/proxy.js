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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const route = req.url || '/api';
  if (route.includes('/health')) return res.status(200).json({ ok:true, service:'Tosi Support Pro API', version:'6.1.0' });
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
