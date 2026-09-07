function listPMWorklog_(user){
  return readObjects_(SHEETS.pmWorklog);
}

function createPMWorklog_(payload,user){
  const sh=spreadsheet_().getSheetByName(SHEETS.pmWorklog);
  if(!sh)throw new Error('PM_WORKLOG sheet not found');
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  const now=date_('yyyy-MM-dd HH:mm');
  const obj=normalizePMWorklog_(Object.assign({},payload,{entryId:nextId_(sh,'PML'),createdAt:now,updatedAt:now}));
  sh.appendRow(headers.map(h=>obj[toCamel_(h)]!==undefined?obj[toCamel_(h)] : ''));
  const actor=user.displayName||user.email||'Project Manager';
  logActivity_('PM work logged','PM_WORKLOG',obj.entryId,pmWorklogAuditText_(obj),actor);
  return normalizeObject_(obj);
}

function updatePMWorklog_(id,patch,user){
  if(!id)throw new Error('Missing id');
  const sh=spreadsheet_().getSheetByName(SHEETS.pmWorklog);
  if(!sh)throw new Error('PM_WORKLOG sheet not found');
  const values=sh.getDataRange().getValues();
  if(values.length<2)throw new Error('Work entry not found: '+id);
  const headers=values[0],map=headerMap_(headers);
  const idx=values.findIndex((r,i)=>i>0&&String(r[map.entryId]||r[0])===String(id));
  if(idx<1)throw new Error('Work entry not found: '+id);
  const current=normalizeObject_(objectFromRow_(headers,values[idx]));
  const editable=['workDate','startTime','endTime','hours','workMode','category','projectId','activity','description','stakeholders','status','billingType','rate','amount','invoiceStatus','evidenceRef','notes'];
  const next=Object.assign({},current);
  editable.forEach(key=>{if(patch[key]!==undefined)next[key]=patch[key]});
  next.entryId=id;next.createdAt=current.createdAt||date_('yyyy-MM-dd HH:mm');next.updatedAt=date_('yyyy-MM-dd HH:mm');
  const normalized=normalizePMWorklog_(next);
  sh.getRange(idx+1,1,1,headers.length).setValues([headers.map(h=>normalized[toCamel_(h)]!==undefined?normalized[toCamel_(h)] : '')]);
  const actor=user.displayName||user.email||'Project Manager';
  logActivity_('PM work updated','PM_WORKLOG',id,pmWorklogAuditText_(normalized),actor);
  return normalizeObject_(normalized);
}

function deletePMWorklog_(id,user){
  if(!id)throw new Error('Missing id');
  const sh=spreadsheet_().getSheetByName(SHEETS.pmWorklog);
  if(!sh)throw new Error('PM_WORKLOG sheet not found');
  const values=sh.getDataRange().getValues(),headers=values[0],map=headerMap_(headers);
  const idx=values.findIndex((r,i)=>i>0&&String(r[map.entryId]||r[0])===String(id));
  if(idx<1)return {ok:true};
  const current=normalizeObject_(objectFromRow_(headers,values[idx]));
  sh.deleteRow(idx+1);
  const actor=user.displayName||user.email||'Project Manager';
  logActivity_('PM work removed','PM_WORKLOG',id,pmWorklogAuditText_(current),actor);
  return {ok:true,id:id};
}

function normalizePMWorklog_(obj){
  const out=Object.assign({},obj);
  out.workDate=String(out.workDate||'');
  out.startTime=String(out.startTime||'');
  out.endTime=String(out.endTime||'');
  out.hours=out.hours===''||out.hours===null||out.hours===undefined?'':Math.max(0,Number(out.hours)||0);
  out.workMode=String(out.workMode||'Remote');
  out.category=String(out.category||'Project Coordination');
  out.projectId=String(out.projectId||'');
  out.activity=String(out.activity||'').trim();
  if(!out.activity)throw new Error('Activity is required');
  out.description=String(out.description||'');
  out.stakeholders=String(out.stakeholders||'');
  out.status=String(out.status||'Completed');
  out.billingType=String(out.billingType||'Hourly');
  out.rate=out.rate===''||out.rate===null||out.rate===undefined?'':Math.max(0,Number(String(out.rate).replace(/[^0-9.-]/g,''))||0);
  out.amount=out.amount===''||out.amount===null||out.amount===undefined?0:Math.max(0,Number(String(out.amount).replace(/[^0-9.-]/g,''))||0);
  if(out.billingType==='Hourly'&&out.hours!==''&&out.rate!=='')out.amount=Math.round(Number(out.hours)*Number(out.rate)*100)/100;
  if(out.billingType==='Non-Billable'){out.amount=0;out.invoiceStatus='Not Billable';}
  out.invoiceStatus=String(out.invoiceStatus||'Not Invoiced');
  out.evidenceRef=String(out.evidenceRef||'');
  out.notes=String(out.notes||'');
  out.createdAt=String(out.createdAt||date_('yyyy-MM-dd HH:mm'));
  out.updatedAt=String(out.updatedAt||date_('yyyy-MM-dd HH:mm'));
  return out;
}

function pmWorklogAuditText_(obj){
  const h=obj.hours===''?'':`${obj.hours}h`;
  const a=Number(obj.amount||0)?`$${Number(obj.amount).toFixed(2)}`:'';
  return [obj.entryId,obj.activity,obj.projectId,h,a].filter(Boolean).join(' · ');
}
