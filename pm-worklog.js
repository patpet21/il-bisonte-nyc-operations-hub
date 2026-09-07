(function(){
  const STORAGE_KEY='ib_pm_worklog_v1';
  const initialRows=[
    {entryId:'PML-0001',workDate:'2026-09-02',startTime:'10:30',endTime:'',hours:5,workMode:'On-site',category:'Project Coordination',projectId:'PRJ-0001',activity:'Firewall / infrastructure onsite coordination',description:'On-site coordination with store personnel and vendors during firewall and hardware work.',stakeholders:'Damiano / Store / Vendors',status:'Completed',billingType:'Hourly',rate:35,amount:175,invoiceStatus:'Not Invoiced',evidenceRef:'ACT-0001',notes:'Approx. 5 hours based on the confirmed average duration of the recent onsite sessions.',createdAt:'2026-09-07 11:16',updatedAt:'2026-09-07 11:16'},
    {entryId:'PML-0002',workDate:'2026-09-03',startTime:'',endTime:'',hours:5,workMode:'On-site',category:'Troubleshooting & Coordination',projectId:'PRJ-0003',activity:'Network / Retail Pro Prism investigation and coordination',description:'On-site network, VPN, DNS and Retail Pro Prism troubleshooting coordination with follow-up to Damiano and Italy IT.',stakeholders:'Damiano / Italy IT / Vendors',status:'Completed',billingType:'Hourly',rate:35,amount:175,invoiceStatus:'Not Invoiced',evidenceRef:'ACT-0003',notes:'Approx. 5 hours based on the confirmed average duration of the recent onsite sessions.',createdAt:'2026-09-07 11:16',updatedAt:'2026-09-07 11:16'},
    {entryId:'PML-0003',workDate:'',startTime:'',endTime:'',hours:'',workMode:'On-site',category:'Infrastructure Assessment',projectId:'',activity:'Previous site inspection with former technician',description:'Earlier site inspection and infrastructure review performed with the previous technical provider.',stakeholders:'Former technician / Il Bisonte',status:'Completed',billingType:'Flat Fee',rate:'',amount:150,invoiceStatus:'Not Invoiced',evidenceRef:'Service Activity Report',notes:'Historical visit. Exact work date and hours have not been reconstructed.',createdAt:'2026-09-07 11:16',updatedAt:'2026-09-07 11:16'},
    {entryId:'PML-0004',workDate:'',startTime:'',endTime:'',hours:'',workMode:'Remote',category:'Coordination & Documentation',projectId:'',activity:'September remote coordination, documentation & follow-up',description:'Remote project coordination, stakeholder follow-up, documentation, troubleshooting preparation and issue tracking performed across September.',stakeholders:'Damiano / Store / Vendors / Italy IT',status:'Completed',billingType:'Flat Fee',rate:'',amount:200,invoiceStatus:'Not Invoiced',evidenceRef:'Service Activity Report',notes:'Consolidated September flat fee; underlying remote hours have not been reconstructed.',createdAt:'2026-09-07 11:16',updatedAt:'2026-09-07 11:16'}
  ];

  let rows=[];
  let loaded=false;
  let monthFilter='all';

  function escHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
  function number(value){const n=Number(String(value??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function money(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(number(value));}
  function hoursLabel(value){const n=number(value);return n?`${n.toFixed(2)} h`:'—';}
  function isBackend(){return window.IB_CONFIG?.dataMode==='apps_script'&&Boolean(window.IB_CONFIG?.appsScriptUrl);}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function currentRows(){
    if(isBackend()) return rows;
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){try{return JSON.parse(raw)}catch(e){}}
    localStorage.setItem(STORAGE_KEY,JSON.stringify(initialRows));
    return clone(initialRows);
  }
  function saveLocal(next){rows=clone(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(rows));}
  function nextId(){const max=currentRows().reduce((m,r)=>Math.max(m,Number(String(r.entryId||'').split('-')[1])||0),0);return `PML-${String(max+1).padStart(4,'0')}`;}
  async function apiCall(action,payload={}){
    const url=window.IB_CONFIG.appsScriptUrl;
    const idToken=window.IBAuth?.getToken?.()||'';
    const body=new URLSearchParams({action,payload:JSON.stringify(payload),idToken});
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});
    if(!res.ok)throw new Error(`Backend error ${res.status}`);
    const json=await res.json();
    if(json.error)throw new Error(json.error);
    return json.data;
  }
  async function loadRows(force=false){
    if(loaded&&!force)return rows;
    rows=isBackend()?await apiCall('listPMWorklog'):currentRows();
    loaded=true;
    return rows;
  }
  function projectName(id){const p=((typeof App!=='undefined'?App.data?.projects:null)||[]).find(x=>x.id===id);return p?p.name:(id||'General / Multi-project');}
  function availableMonths(){const vals=[...new Set(rows.map(r=>String(r.workDate||'').slice(0,7)).filter(x=>/^\d{4}-\d{2}$/.test(x)))].sort().reverse();return vals;}
  function filteredRows(){return rows.filter(r=>monthFilter==='all'||String(r.workDate||'').startsWith(monthFilter));}
  function totals(list){return list.reduce((a,r)=>{const h=number(r.hours),amt=number(r.amount);a.entries+=1;a.hours+=h;a.amount+=amt;if(String(r.workMode).toLowerCase()==='on-site')a.onsite+=h;if(String(r.workMode).toLowerCase()==='remote')a.remote+=h;if(!['Paid','Not Billable'].includes(String(r.invoiceStatus||'')))a.openAmount+=amt;return a;},{entries:0,hours:0,onsite:0,remote:0,amount:0,openAmount:0});}
  function categoryBreakdown(list){
    const map={};list.forEach(r=>{const k=r.category||'Other';map[k]=(map[k]||0)+number(r.hours)});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }
  function renderSummary(list){const t=totals(list);return `<div class="pmw-kpis">
    <div class="pmw-kpi"><span>Tracked hours</span><strong>${t.hours.toFixed(2)}</strong><small>${t.entries} work records</small></div>
    <div class="pmw-kpi"><span>On-site hours</span><strong>${t.onsite.toFixed(2)}</strong><small>Physical store / vendor work</small></div>
    <div class="pmw-kpi"><span>Remote hours</span><strong>${t.remote.toFixed(2)}</strong><small>Only explicitly tracked hours</small></div>
    <div class="pmw-kpi"><span>Recorded value</span><strong>${money(t.amount)}</strong><small>${money(t.openAmount)} not paid / not closed</small></div>
  </div>`;}
  function renderBreakdown(list){
    const parts=categoryBreakdown(list).filter(([,h])=>h>0);
    if(!parts.length)return '<div class="pmw-empty">No hourly category data for this filter.</div>';
    return parts.map(([name,h])=>`<div class="pmw-break-row"><span>${escHtml(name)}</span><strong>${h.toFixed(2)} h</strong></div>`).join('');
  }
  function renderTable(list){
    if(!list.length)return '<div class="pmw-empty">No work entries match this filter.</div>';
    return `<div class="pmw-table-wrap"><table class="pmw-table"><thead><tr><th>Date</th><th>Activity</th><th>Project</th><th>Mode</th><th>Hours</th><th>Billing</th><th>Amount</th><th>Invoice</th><th></th></tr></thead><tbody>${list.map(r=>`<tr>
      <td>${escHtml(r.workDate||'Historical')}</td>
      <td><strong>${escHtml(r.activity)}</strong><small>${escHtml(r.category||'')}</small></td>
      <td>${escHtml(projectName(r.projectId))}</td>
      <td><span class="pmw-chip">${escHtml(r.workMode||'—')}</span></td>
      <td>${hoursLabel(r.hours)}</td>
      <td>${escHtml(r.billingType||'—')}${r.rate?`<small>${money(r.rate)}/hr</small>`:''}</td>
      <td><strong>${money(r.amount)}</strong></td>
      <td>${escHtml(r.invoiceStatus||'—')}</td>
      <td><div class="pmw-actions"><button class="btn pmw-edit" data-id="${escHtml(r.entryId)}">Edit</button><button class="btn pmw-delete" data-id="${escHtml(r.entryId)}">Delete</button></div></td>
    </tr>`).join('')}</tbody></table></div>`;
  }
  async function renderPMWorklog(root){
    if(!root)return;
    root.innerHTML=(typeof pageHead==='function'?pageHead('My PM Work & Hours','Track what I do, where the time goes, and what has been billed.','PROJECT MANAGER WORKLOG'):'<h1>My PM Work & Hours</h1>')+'<div class="panel"><div class="pmw-loading">Loading worklog…</div></div>';
    try{await loadRows();}catch(err){root.innerHTML+=`<div class="panel pmw-error">${escHtml(err.message)}</div>`;return;}
    const list=filteredRows();
    const monthOptions=['<option value="all">All periods</option>',...availableMonths().map(m=>`<option value="${m}" ${m===monthFilter?'selected':''}>${m}</option>`)].join('');
    root.innerHTML=(typeof pageHead==='function'?pageHead('My PM Work & Hours','Track what I do, where the time goes, and what has been billed.','PROJECT MANAGER WORKLOG'):'')+
      `<div class="pmw-toolbar"><div><label for="pmwMonth">Period</label><select id="pmwMonth">${monthOptions}</select></div><div class="pmw-source"><span class="pmw-dot"></span>${isBackend()?'Google Sheet / Apps Script':'Demo mode · local browser copy'}</div><button class="btn primary" id="pmwAdd">+ Log work</button></div>`+
      renderSummary(list)+
      `<div class="pmw-grid"><div class="panel"><div class="panel-head"><h3>Work register</h3><span class="muted">${list.length} records</span></div>${renderTable(list)}</div><div class="panel pmw-side"><div class="panel-head"><h3>Hours by category</h3></div>${renderBreakdown(list)}<div class="pmw-note"><strong>Tracking rule</strong><p>Unknown historical hours stay blank. Flat-fee work remains visible without converting it into invented hours.</p></div></div></div>`;
    document.querySelector('#pmwMonth')?.addEventListener('change',e=>{monthFilter=e.target.value;renderPMWorklog(root)});
    document.querySelector('#pmwAdd')?.addEventListener('click',()=>openEditor());
    document.querySelectorAll('.pmw-edit').forEach(b=>b.addEventListener('click',()=>openEditor(rows.find(r=>r.entryId===b.dataset.id))));
    document.querySelectorAll('.pmw-delete').forEach(b=>b.addEventListener('click',()=>removeEntry(b.dataset.id)));
  }

  function field(name,label,input,wide=false){return `<label class="pmw-field ${wide?'wide':''}"><span>${label}</span>${input.replace('NAME',`name="${name}"`)}</label>`;}
  function projectOptions(value){return `<option value="">General / Multi-project</option>${((typeof App!=='undefined'?App.data?.projects:null)||[]).map(p=>`<option value="${escHtml(p.id)}" ${p.id===value?'selected':''}>${escHtml(p.id)} · ${escHtml(p.name)}</option>`).join('')}`;}
  function openEditor(row=null){
    const r=row||{workDate:new Date().toISOString().slice(0,10),startTime:'',endTime:'',hours:'',workMode:'Remote',category:'Project Coordination',projectId:'',activity:'',description:'',stakeholders:'',status:'Completed',billingType:'Hourly',rate:35,amount:'',invoiceStatus:'Not Invoiced',evidenceRef:'',notes:''};
    const modal=document.createElement('div');modal.className='pmw-modal';modal.innerHTML=`<div class="pmw-modal-card"><div class="pmw-modal-head"><div><div class="eyebrow">PM WORKLOG</div><h2>${row?'Edit work entry':'Log new work'}</h2></div><button class="pmw-close" aria-label="Close">×</button></div><form id="pmwForm" class="pmw-form">
      ${field('workDate','Work date',`<input NAME type="date" value="${escHtml(r.workDate||'')}">`)}
      ${field('workMode','Work mode',`<select NAME><option ${r.workMode==='On-site'?'selected':''}>On-site</option><option ${r.workMode==='Remote'?'selected':''}>Remote</option><option ${r.workMode==='Hybrid'?'selected':''}>Hybrid</option></select>`)}
      ${field('startTime','Start',`<input NAME type="time" value="${escHtml(r.startTime||'')}">`)}
      ${field('endTime','End',`<input NAME type="time" value="${escHtml(r.endTime||'')}">`)}
      ${field('hours','Hours',`<input NAME type="number" min="0" step="0.25" value="${escHtml(r.hours??'')}">`)}
      ${field('category','Category',`<select NAME>${['Project Coordination','Vendor Coordination','Troubleshooting & Coordination','Infrastructure Assessment','Documentation','Process Improvement','Automation','Administration','Coordination & Documentation'].map(x=>`<option ${x===r.category?'selected':''}>${x}</option>`).join('')}</select>`)}
      ${field('projectId','Project',`<select NAME>${projectOptions(r.projectId)}</select>`,true)}
      ${field('activity','Activity',`<input NAME type="text" required value="${escHtml(r.activity||'')}">`,true)}
      ${field('description','Description',`<textarea NAME rows="3">${escHtml(r.description||'')}</textarea>`,true)}
      ${field('stakeholders','Stakeholders',`<input NAME type="text" value="${escHtml(r.stakeholders||'')}">`,true)}
      ${field('billingType','Billing type',`<select NAME>${['Hourly','Flat Fee','Included in Monthly Retainer','Non-Billable'].map(x=>`<option ${x===r.billingType?'selected':''}>${x}</option>`).join('')}</select>`)}
      ${field('rate','Rate',`<input NAME type="number" min="0" step="0.01" value="${r.rate===''?'':number(r.rate)}">`)}
      ${field('amount','Amount',`<input NAME type="number" min="0" step="0.01" value="${r.amount===''?'':number(r.amount)}">`)}
      ${field('invoiceStatus','Invoice status',`<select NAME>${['Not Invoiced','Draft','Invoiced','Paid','Not Billable'].map(x=>`<option ${x===r.invoiceStatus?'selected':''}>${x}</option>`).join('')}</select>`)}
      ${field('evidenceRef','Evidence / Activity ref',`<input NAME type="text" value="${escHtml(r.evidenceRef||'')}">`)}
      ${field('notes','Notes',`<textarea NAME rows="3">${escHtml(r.notes||'')}</textarea>`,true)}
      <div class="pmw-form-actions"><button type="button" class="btn pmw-cancel">Cancel</button><button type="submit" class="btn primary">${row?'Save changes':'Add work entry'}</button></div>
    </form></div>`;
    document.body.appendChild(modal);
    const form=modal.querySelector('#pmwForm');
    const close=()=>modal.remove();
    modal.querySelector('.pmw-close').onclick=close;modal.querySelector('.pmw-cancel').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
    const recalc=()=>{const fd=new FormData(form),billing=fd.get('billingType'),h=number(fd.get('hours')),rate=number(fd.get('rate'));if(billing==='Hourly'&&h&&rate)form.elements.amount.value=(h*rate).toFixed(2);if(billing==='Non-Billable'){form.elements.amount.value='0';form.elements.invoiceStatus.value='Not Billable';}};
    const fromTimes=()=>{const s=form.elements.startTime.value,e=form.elements.endTime.value;if(!s||!e)return;const [sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);let mins=(eh*60+em)-(sh*60+sm);if(mins>=0){form.elements.hours.value=(mins/60).toFixed(2);recalc();}};
    ['startTime','endTime'].forEach(n=>form.elements[n].addEventListener('change',fromTimes));['hours','rate','billingType'].forEach(n=>form.elements[n].addEventListener('input',recalc));
    form.addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());data.hours=data.hours===''?'':number(data.hours);data.rate=data.rate===''?'':number(data.rate);data.amount=data.amount===''?0:number(data.amount);try{await persistEntry(row?.entryId||'',data);close();loaded=false;await loadRows(true);renderPMWorklog(document.querySelector('#pageRoot'));if(typeof toast==='function')toast(row?'Work entry updated':'Work entry logged');}catch(err){if(typeof toast==='function')toast(err.message);else alert(err.message);}});
  }
  async function persistEntry(id,data){
    if(isBackend())return id?apiCall('updatePMWorklog',{id,patch:data}):apiCall('createPMWorklog',data);
    const next=currentRows();const now=new Date().toLocaleString();
    if(id){const row=next.find(x=>x.entryId===id);if(!row)throw new Error('Work entry not found');Object.assign(row,data,{updatedAt:now});}
    else next.unshift({entryId:nextId(),...data,createdAt:now,updatedAt:now});
    saveLocal(next);return true;
  }
  async function removeEntry(id){
    if(!confirm(`Delete ${id}? The production Activity Log will still preserve the audit event.`))return;
    try{if(isBackend())await apiCall('deletePMWorklog',{id});else saveLocal(currentRows().filter(x=>x.entryId!==id));loaded=false;await loadRows(true);renderPMWorklog(document.querySelector('#pageRoot'));if(typeof toast==='function')toast(`${id} removed`);}catch(err){if(typeof toast==='function')toast(err.message);else alert(err.message);}
  }

  if((typeof App!=='undefined'?App.nav?.project_manager:null)&&!App.nav.project_manager.some(x=>x[0]==='pmworklog'))App.nav.project_manager.splice(1,0,['pmworklog','◷','My PM Work']);
  if(typeof renderPage==='function'){
    const baseRenderPage=renderPage;
    renderPage=function(){if(typeof App!=='undefined'&&App.page==='pmworklog')return renderPMWorklog(document.querySelector('#pageRoot'));return baseRenderPage();};
  }
  window.IBPMWorklog={render:renderPMWorklog,reload:()=>loadRows(true)};
})();
