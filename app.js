const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const App={role:'project_manager',page:'dashboard',data:null,
  nav:{
    store_manager:[['dashboard','⌂','Overview'],['work','✓','Work'],['requests','☷','Requests'],['vendors','◉','Vendors'],['sops','▤','Procedures']],
    project_manager:[['dashboard','⌂','Overview'],['work','✓','Work'],['projects','□','Projects'],['requests','△','Issues & Requests'],['vendors','◉','Vendors'],['systems','⌘','Systems'],['sops','▤','SOP Library'],['improvements','✦','Process Improvement'],['activity','≋','Activity Log']],
    management:[['dashboard','⌂','Overview'],['work','✓','Work'],['projects','□','Projects'],['requests','△','Critical Issues'],['decisions','!','Decisions'],['activity','≋','Recent Activity']]
  }
};

document.addEventListener('DOMContentLoaded',init);
document.addEventListener('click',e=>{const target=e.target.closest?.('[data-global-page]');if(!target)return;const page=target.dataset.globalPage;if(!page)return;App.page=page;render();});
async function init(){
  $('#environmentBadge').textContent=window.IB_CONFIG.environment;
  $('#roleSelect').value=App.role;
  $('#roleSelect').addEventListener('change',e=>{App.role=e.target.value;App.page='dashboard';render();});
  $('#globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter')toast(`Search ready for: ${e.target.value||'all records'}`)});
  const brand=$('.brand');if(brand){brand.style.cursor='pointer';brand.title='Back to Overview';brand.onclick=()=>{App.page='dashboard';render();};}
  App.data=await window.IBData.getAll();render();
}
function render(){renderNav();renderPage();}
function renderNav(){const nav=$('#sidebarNav');nav.innerHTML=App.nav[App.role].map(([id,icon,label])=>`<button class="nav-btn ${App.page===id?'active':''}" data-page="${id}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('');$$('.nav-btn',nav).forEach(b=>b.onclick=()=>{App.page=b.dataset.page;render();});}
function renderPage(){const root=$('#pageRoot');const page=App.page;if(page==='dashboard')return App.role==='store_manager'?renderStoreDashboard(root):App.role==='management'?renderManagementDashboard(root):renderPMDashboard(root);const map={work:renderWork,requests:renderRequests,projects:renderProjects,vendors:renderVendors,systems:renderSystems,sops:renderSops,improvements:renderImprovements,activity:renderActivity,decisions:renderDecisions};(map[page]||renderPMDashboard)(root);}
function pageHead(title,sub,eyebrow='IL BISONTE NEW YORK'){const back=App.page!=='dashboard'?`<button class="page-back" data-global-page="dashboard">← Overview</button>`:'';return `<div class="page-head"><div>${back}<div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${sub}</p></div><div class="date-card"><strong>${new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</strong><br><span class="muted">${window.IB_CONFIG.storeName}</span></div></div>`}
function stats(){const open=App.data.requests.filter(x=>!['Resolved','Closed'].includes(x.status)).length,active=App.data.projects.filter(x=>!['Completed','Closed'].includes(x.status)).length,pending=App.data.vendors.filter(x=>x.nextAction).length,improve=App.data.improvements.filter(x=>x.status!=='Completed').length;return {open,active,pending,improve};}
function statCard(v,label,trend='Current operational view'){return `<div class="stat-card"><div class="stat-top"><div><div class="stat-value">${v}</div><div class="stat-label">${label}</div></div><span>›</span></div><div class="trend">${trend}</div></div>`}
function renderStoreDashboard(root){const s=stats();root.innerHTML=pageHead('Store Manager Workspace','One simple place to report, track, and close store needs.')+`<div class="hero-actions"><button class="action-card cognac" id="reportIssue"><div class="action-title">Report an Issue</div><div class="action-sub">Something is not working? Capture it once and we coordinate the rest.</div></button><button class="action-card green" id="newRequest"><div class="action-title">New Request</div><div class="action-sub">Need something for the store? Submit a structured request.</div></button></div><div class="split"><div class="panel"><div class="panel-head"><h3>Open Issues</h3><button class="btn" data-go="requests">View all</button></div>${requestRows(App.data.requests.filter(x=>!['Resolved','Closed'].includes(x.status)).slice(0,5),false)}</div><div class="panel"><div class="panel-head"><h3>Upcoming / Next Actions</h3></div><ul class="simple-list">${App.data.projects.filter(x=>x.status!=='Completed').slice(0,5).map(p=>`<li class="simple-row"><span class="dot"></span><div class="row-main"><div class="row-title">${esc(p.name)}</div><div class="row-sub">${esc(p.nextAction)}</div></div><div class="row-meta">${fmtDate(p.due)}</div></li>`).join('')}</ul></div></div><div class="grid grid-2" style="margin-top:16px"><div class="panel"><div class="panel-head"><h3>Quick Procedures</h3><button class="btn" data-go="sops">View library</button></div>${sopRows(App.data.sops.slice(0,4))}</div><div class="panel"><div class="panel-head"><h3>Vendor Contacts</h3><button class="btn" data-go="vendors">View all</button></div>${vendorRows(App.data.vendors.slice(0,4))}</div></div><div class="footer-note">Store Manager view — intentionally simplified</div>`;$('#reportIssue').onclick=()=>openRequestModal('issue');$('#newRequest').onclick=()=>openRequestModal('request');wireGo();}
function renderPMDashboard(root){const s=stats();root.innerHTML=pageHead('PM Control Center','Coordinate projects. Resolve issues. Align vendors. Improve continuously.')+`<div class="grid grid-4">${statCard(s.active,'Active Projects')}${statCard(s.open,'Open Issues & Requests')}${statCard(s.pending,'Vendor Actions')}${statCard(s.improve,'Improvement Candidates')}</div><div class="split" style="margin-top:16px"><div class="panel"><div class="panel-head"><h3>Projects Kanban</h3><button class="btn" data-go="projects">View all</button></div>${kanban(App.data.projects)}</div><div class="panel"><div class="panel-head"><h3>Risk / Issue View</h3><button class="btn primary" id="pmNewIssue">+ New issue</button></div>${requestRows(App.data.requests.slice(0,6),true)}</div></div><div class="grid grid-2" style="margin-top:16px"><div class="panel"><div class="panel-head"><h3>Vendor Coordination</h3><button class="btn" data-go="vendors">Open register</button></div>${vendorRows(App.data.vendors)}</div><div class="panel"><div class="panel-head"><h3>Operating Workflow</h3></div>${workflow()}</div></div><div class="panel" style="margin-top:16px"><div class="panel-head"><h3>Automation & AI Improvement Backlog</h3><button class="btn" data-go="improvements">View backlog</button></div><div class="grid grid-3">${App.data.improvements.map(i=>`<div class="metric-box"><span class="pill ${cls(i.priority)}">${esc(i.priority)}</span><h4>${esc(i.title)}</h4><div class="muted">${esc(i.type)} · ${esc(i.status)}</div></div>`).join('')}</div></div><div class="footer-note">Project Manager view — governance, coordination, improvement and closeout</div>`;$('#pmNewIssue').onclick=()=>openRequestModal('issue');wireGo();}
function renderManagementDashboard(root){const s=stats();const critical=App.data.requests.filter(x=>['High','Urgent'].includes(x.priority)&&!['Resolved','Closed'].includes(x.status));root.innerHTML=pageHead('Executive Dashboard','NYC operations at a glance: what is moving, what is blocked, and what needs a decision.')+`<div class="grid grid-4">${statCard(s.open,'Open Issues')}${statCard(s.active,'Active Projects')}${statCard(App.data.decisions.filter(x=>x.status==='Required').length,'Decisions Required')}${statCard('92%','Weekly Status','Prototype readiness indicator')}</div><div class="split" style="margin-top:16px"><div class="panel"><div class="panel-head"><h3>Requires Attention</h3><button class="btn" data-go="requests">View issues</button></div>${critical.length?critical.map(r=>`<div class="decision-banner"><strong>${esc(r.id)} — ${esc(r.title)}</strong><span>${esc(r.nextAction)} · Owner: ${esc(r.owner)}</span></div>`).join(''):'<div class="empty">No critical issues.</div>'}</div><div class="panel"><div class="panel-head"><h3>Decision Queue</h3><button class="btn" data-go="decisions">View all</button></div>${App.data.decisions.map(d=>`<div class="simple-row"><span class="dot"></span><div class="row-main"><div class="row-title">${esc(d.title)}</div><div class="row-sub">Owner: ${esc(d.owner)}</div></div><span class="pill ${d.status==='Required'?'high':'pending'}">${esc(d.status)}</span></div>`).join('')}</div></div><div class="grid grid-2" style="margin-top:16px"><div class="panel"><div class="panel-head"><h3>Project Portfolio</h3><button class="btn" data-go="projects">View all</button></div>${projectTable(App.data.projects.slice(0,6))}</div><div class="panel"><div class="panel-head"><h3>Recent Activity</h3><button class="btn" data-go="activity">View log</button></div>${activityRows(App.data.activity.slice(0,7))}</div></div><div class="footer-note">Management view — decisions, portfolio status and exceptions only</div>`;wireGo();}
function taskProjectName(projectId){
  const p=(App.data.projects||[]).find(x=>x.id===projectId);
  return p?p.name:(projectId||'General');
}
function taskDayKey(offset=0){
  const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+offset);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function taskClosed(t){return ['Completed','Closed','Resolved','Cancelled','Canceled'].includes(String(t.status||''));}
function workCard(t){
  return `<article class="work-card" data-work-task="${esc(t.id)}">
    <div class="work-card-top"><div><span class="work-id">${esc(t.id)}</span><h3>${esc(t.title)}</h3><small>${esc(taskProjectName(t.projectId))}</small></div><span class="pill ${cls(t.priority)}">${esc(t.priority||'Medium')}</span></div>
    <div class="work-card-meta"><span>${esc(t.owner||'Unassigned')}</span><span class="pill ${cls(t.status)}">${esc(t.status||'Not Started')}</span></div>
    ${t.notes?`<p>${esc(t.notes)}</p>`:''}
    <div class="work-card-actions"><button class="btn work-edit" data-id="${esc(t.id)}">Edit</button>${taskClosed(t)?'':`<button class="btn primary work-done" data-id="${esc(t.id)}">Mark done</button>`}</div>
  </article>`;
}
function renderWork(root){
  const tasks=App.data.tasks||[],today=taskDayKey(0),yesterday=taskDayKey(-1);
  const todayRows=tasks.filter(t=>String(t.due||'').slice(0,10)===today);
  const nextRows=tasks.filter(t=>!taskClosed(t)&&String(t.due||'').slice(0,10)>today).sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,8);
  const waiting=tasks.filter(t=>!taskClosed(t)&&/pending|waiting|vendor|blocked/i.test(String(t.status||''))).slice(0,8);
  const recentDone=tasks.filter(t=>String(t.due||'').slice(0,10)===yesterday).slice(0,8);
  root.innerHTML=pageHead('Work','The simple daily operating board: what we do today, what comes next, what is waiting, and what was just completed.')+`
    <div class="work-page">
      <div class="work-page-actions"><button class="btn primary" id="addWorkItem">+ New Work Item</button></div>
      <div class="work-board">
        <section class="work-column today"><div class="work-col-head"><div><span>TODAY</span><h2>Today’s work</h2></div><b>${todayRows.length}</b></div><div class="work-col-body">${todayRows.map(workCard).join('')||'<div class="work-empty">No work scheduled for today.</div>'}</div></section>
        <section class="work-column next"><div class="work-col-head"><div><span>NEXT</span><h2>Coming up</h2></div><b>${nextRows.length}</b></div><div class="work-col-body">${nextRows.map(workCard).join('')||'<div class="work-empty">Nothing queued next.</div>'}</div></section>
        <section class="work-column waiting"><div class="work-col-head"><div><span>WAITING</span><h2>Waiting on others</h2></div><b>${waiting.length}</b></div><div class="work-col-body">${waiting.map(workCard).join('')||'<div class="work-empty">Nothing blocked or waiting.</div>'}</div></section>
        <section class="work-column done"><div class="work-col-head"><div><span>YESTERDAY</span><h2>Yesterday’s work</h2></div><b>${recentDone.length}</b></div><div class="work-col-body">${recentDone.map(workCard).join('')||'<div class="work-empty">No work recorded for yesterday.</div>'}</div></section>
      </div>
    </div>`;
  $('#addWorkItem').onclick=()=>openWorkEditor();
  $$('.work-edit').forEach(b=>b.onclick=e=>{e.stopPropagation();openWorkEditor((App.data.tasks||[]).find(t=>t.id===b.dataset.id));});
  $$('.work-done').forEach(b=>b.onclick=async e=>{e.stopPropagation();await IBData.updateTask(b.dataset.id,{status:'Completed'});App.data=await IBData.getAll();render();toast(`${b.dataset.id} completed`);});
}
function openWorkEditor(row=null){
  const root=$('#modalRoot'),projects=App.data.projects||[];
  const r=row||{projectId:'',title:'',owner:'Pietro',status:'Not Started',priority:'Medium',due:taskDayKey(0),notes:''};
  const option=(v,current)=>`<option value="${esc(v)}" ${String(v)===String(current)?'selected':''}>${esc(v||'General / no project')}</option>`;
  root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">DAILY WORK</div><h2>${row?'Edit Work Item':'New Work Item'}</h2></div><button class="icon-btn" id="closeWorkEdit">×</button></div>
    <form id="workEditForm"><div class="form-grid">
      <div class="field full"><label>What needs to be done?</label><input name="title" required value="${esc(r.title||'')}" placeholder="Short action title"></div>
      <div class="field"><label>Project</label><select name="projectId">${option('',r.projectId)}${projects.map(p=>`<option value="${esc(p.id)}" ${p.id===r.projectId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Owner</label><input name="owner" value="${esc(r.owner||'')}"></div>
      <div class="field"><label>Status</label><select name="status">${['Not Started','In Progress','Pending Vendor','Waiting','Blocked','Completed'].map(v=>option(v,r.status)).join('')}</select></div>
      <div class="field"><label>Priority</label><select name="priority">${['Low','Medium','High','Urgent'].map(v=>option(v,r.priority)).join('')}</select></div>
      <div class="field"><label>When</label><input name="due" type="date" value="${esc(r.due||taskDayKey(0))}"></div>
      <div class="field full"><label>Notes / next step</label><textarea name="notes">${esc(r.notes||'')}</textarea></div>
    </div><div class="modal-actions">${row?'<button type="button" class="btn" id="deleteWorkItem">Delete</button>':''}<button type="button" class="btn" id="cancelWorkEdit">Cancel</button><button class="btn primary" type="submit">Save</button></div></form>
  </div></div>`;
  const close=()=>root.innerHTML='';
  $('#closeWorkEdit').onclick=$('#cancelWorkEdit').onclick=close;
  if(row)$('#deleteWorkItem').onclick=async()=>{if(!confirm(`Delete ${row.id}?`))return;await IBData.deleteTask(row.id);App.data=await IBData.getAll();close();render();toast(`${row.id} deleted`);};
  $('#workEditForm').onsubmit=async e=>{e.preventDefault();const payload=Object.fromEntries(new FormData(e.target).entries());if(row)await IBData.updateTask(row.id,payload);else await IBData.createTask(payload);App.data=await IBData.getAll();close();render();toast(row?'Work item updated':'Work item created');};
}
window.IBWorkBoard={open:()=>{App.page='work';render();},newItem:()=>openWorkEditor(),editById:(id)=>{const row=(App.data.tasks||[]).find(t=>t.id===id);if(row)openWorkEditor(row);}};

function renderRequests(root){
  const all=App.data.requests||[];
  const open=all.filter(x=>!['Resolved','Closed'].includes(x.status));
  const high=open.filter(x=>['High','Urgent','Critical'].includes(x.priority));
  const waiting=open.filter(x=>/pending|waiting|vendor/i.test(String(x.status||'')));
  const progress=open.filter(x=>String(x.status||'').toLowerCase()==='in progress');
  root.innerHTML=pageHead('Issues & Requests','See what needs action, who owns it, and what happens next.')+`
    <div class="request-page">
      <div class="request-summary">
        <button class="request-summary-card active" data-request-filter="all"><span>Open</span><strong>${open.length}</strong><small>All active items</small></button>
        <button class="request-summary-card" data-request-filter="high"><span>High priority</span><strong>${high.length}</strong><small>Needs attention</small></button>
        <button class="request-summary-card" data-request-filter="waiting"><span>Waiting</span><strong>${waiting.length}</strong><small>Vendor / external</small></button>
        <button class="request-summary-card" data-request-filter="progress"><span>In progress</span><strong>${progress.length}</strong><small>Currently moving</small></button>
      </div>

      <div class="request-toolbar panel">
        <div>
          <div class="eyebrow">REQUEST REGISTER</div>
          <h3>What needs attention?</h3>
          <p class="muted">Use the filters, then open only the item you need.</p>
        </div>
        <div class="toolbar"><button class="btn primary" id="newRequestBtn">+ New Request</button></div>
      </div>

      <div id="requestCards" class="request-card-grid"></div>
    </div>`;
  $('#newRequestBtn').onclick=()=>openRequestModal('issue');
  let filter='all';
  const renderCards=()=>{
    const rows=open.filter(r=>{
      if(filter==='high')return ['High','Urgent','Critical'].includes(r.priority);
      if(filter==='waiting')return /pending|waiting|vendor/i.test(String(r.status||''));
      if(filter==='progress')return String(r.status||'').toLowerCase()==='in progress';
      return true;
    });
    $('#requestCards').innerHTML=requestCards(rows);
    $('.request-action').forEach(b=>b.onclick=async()=>{await IBData.updateRequest(b.dataset.id,{status:b.dataset.status,nextAction:b.dataset.status==='Resolved'?'Store confirmed resolution':'PM follow-up in progress'});App.data=await IBData.getAll();render();toast(`${b.dataset.id} updated`);});
  };
  $('.request-summary-card').forEach(b=>b.onclick=()=>{filter=b.dataset.requestFilter;$('.request-summary-card').forEach(x=>x.classList.toggle('active',x===b));renderCards();});
  renderCards();
}
function requestCards(rows){
  if(!rows.length)return '<div class="request-empty panel">No requests match this filter.</div>';
  return rows.map(r=>{
    const nextStatus=r.status==='New'?'In Progress':r.status==='In Progress'?'Resolved':'In Progress';
    const actionLabel=r.status==='Resolved'?'Reopen':r.status==='In Progress'?'Resolve':'Start';
    return `<article class="request-card">
      <div class="request-card-top">
        <div><span class="request-id">${esc(r.id)}</span><h3>${esc(r.title)}</h3><div class="request-category">${esc(r.category)}</div></div>
        <div class="request-badges"><span class="pill ${cls(r.priority)}">${esc(r.priority)}</span><span class="pill ${cls(r.status)}">${esc(r.status)}</span></div>
      </div>
      <div class="request-card-meta"><div><span>Owner</span><strong>${esc(r.owner||'Unassigned')}</strong></div><div><span>Requester</span><strong>${esc(r.requester||'—')}</strong></div></div>
      <div class="request-next"><span>Next action</span><strong>${esc(r.nextAction||'No next action recorded')}</strong></div>
      <div class="request-card-actions"><button class="btn request-edit" data-id="${esc(r.id)}">Edit details</button><button class="btn request-action" data-id="${esc(r.id)}" data-status="${esc(nextStatus)}">${actionLabel}</button></div>
    </article>`;
  }).join('');
}
function requestRows(rows,actions){if(!rows.length)return '<div class="empty">No records.</div>';return `<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Request</th><th>Priority</th><th>Owner</th><th>Status</th><th>Next Action</th>${actions?'<th></th>':''}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.id)}</td><td><strong>${esc(r.title)}</strong><div class="row-sub">${esc(r.category)}</div></td><td><span class="pill ${cls(r.priority)}">${esc(r.priority)}</span></td><td>${esc(r.owner)}</td><td><span class="pill ${cls(r.status)}">${esc(r.status)}</span></td><td>${esc(r.nextAction||'')}</td>${actions?`<td><button class="btn mini-action" data-id="${r.id}" data-status="${r.status==='New'?'In Progress':r.status==='In Progress'?'Resolved':'In Progress'}">${r.status==='Resolved'?'Reopen':r.status==='In Progress'?'Resolve':'Start'}</button></td>`:''}</tr>`).join('')}</tbody></table></div>`}
function renderProjects(root){root.innerHTML=pageHead('Projects','Turn operational changes into visible, owned and measurable projects.')+`<div class="panel"><div class="panel-head"><h3>Project Portfolio</h3><span class="muted">${App.data.projects.length} projects</span></div>${kanban(App.data.projects)}</div><div class="panel" style="margin-top:16px">${projectTable(App.data.projects)}</div>`;}
function projectTable(rows){return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Project</th><th>Scope</th><th>Owner</th><th>Status</th><th>Priority</th><th>Target</th><th>Next Action</th></tr></thead><tbody>${rows.map(p=>`<tr><td><strong>${esc(p.name)}</strong><div class="row-sub">${esc(p.id)}</div></td><td>${esc(p.scope)}</td><td>${esc(p.owner)}</td><td><span class="pill ${cls(p.status)}">${esc(p.status)}</span></td><td><span class="pill ${cls(p.priority)}">${esc(p.priority)}</span></td><td>${fmtDate(p.due)}</td><td>${esc(p.nextAction)}</td></tr>`).join('')}</tbody></table></div>`}
function kanban(rows){const cols=['Not Started','In Progress','In Review','Completed'];return `<div class="kanban">${cols.map(c=>`<div class="kanban-col"><h4>${c} <span class="muted">${rows.filter(x=>x.status===c).length}</span></h4>${rows.filter(x=>x.status===c).map(p=>`<div class="kanban-card"><div class="kanban-title">${esc(p.name)}</div><div class="kanban-sub">${esc(p.scope)}</div><span class="pill ${cls(p.priority)}">${esc(p.priority)}</span><div class="row-sub" style="margin-top:8px">${esc(p.nextAction)}</div></div>`).join('')||'<div class="empty">—</div>'}</div>`).join('')}</div>`}
function renderVendors(root){root.innerHTML=pageHead('Vendor Register','Know who owns what, what is pending, and how each external partner fits the operating model.')+`<div class="panel">${vendorRows(App.data.vendors,true)}</div>`;}
function vendorRows(rows,full=false){return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Vendor</th><th>Service</th><th>Status</th>${full?'<th>Contact</th>':''}<th>Next Action</th></tr></thead><tbody>${rows.map(v=>`<tr><td><strong>${esc(v.name)}</strong><div class="row-sub">${esc(v.id)}</div></td><td>${esc(v.service)}</td><td><span class="pill ${cls(v.status)}">${esc(v.status)}</span></td>${full?`<td>${esc(v.contact)}</td>`:''}<td>${esc(v.nextAction)}</td></tr>`).join('')}</tbody></table></div>`}
function renderSystems(root){root.innerHTML=pageHead('Systems & Assets','Business ownership and support visibility without storing credentials inside the PM tool.')+`<div class="panel"><div class="panel-head"><h3>System Register</h3><span class="muted">Passwords are not stored here</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>System</th><th>Owner</th><th>Vendor</th><th>Status</th><th>Credential Location</th></tr></thead><tbody>${App.data.systems.map(s=>`<tr><td><strong>${esc(s.name)}</strong><div class="row-sub">${esc(s.id)}</div></td><td>${esc(s.owner)}</td><td>${esc(s.vendor)}</td><td><span class="pill ${cls(s.status)}">${esc(s.status)}</span></td><td>${esc(s.credentialLocation)}</td></tr>`).join('')}</tbody></table></div></div>`;}
function renderSops(root){root.innerHTML=pageHead('Procedure Library','Short, usable procedures for the store — not six-page manuals.')+`<div class="panel">${sopRows(App.data.sops,true)}</div>`;}
function sopRows(rows,full=false){return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Procedure</th><th>Category</th><th>Version</th><th>Status</th>${full?'<th>Purpose</th>':''}</tr></thead><tbody>${rows.map(s=>`<tr><td><strong>${esc(s.title)}</strong><div class="row-sub">${esc(s.id)}</div></td><td>${esc(s.category)}</td><td>${esc(s.version)}</td><td><span class="pill ${cls(s.status)}">${esc(s.status)}</span></td>${full?'<td>Give the store a repeatable first response and escalation path.</td>':''}</tr>`).join('')}</tbody></table></div>`}
function renderImprovements(root){root.innerHTML=pageHead('Process Improvement','Capture recurring friction first; automate only where the data proves value.')+`<div class="grid grid-3">${App.data.improvements.map(i=>`<div class="panel"><div class="panel-head"><span class="pill ${cls(i.priority)}">${esc(i.priority)}</span><span class="muted">${esc(i.id)}</span></div><h3>${esc(i.title)}</h3><p class="muted">${esc(i.type)}</p><div class="store-card">Status: <strong>${esc(i.status)}</strong></div></div>`).join('')}</div>`;}
function renderActivity(root){root.innerHTML=pageHead('Activity Log','A traceable history of what happened, who acted, and when.')+`<div class="panel">${activityRows(App.data.activity)}</div>`;}
function activityRows(rows){return `<ul class="activity-list">${rows.map(a=>`<li class="activity-item"><span class="dot"></span><div class="row-main"><div class="row-title">${esc(a.text)}</div><div class="row-sub">${esc(a.by)}</div></div><div class="row-meta">${esc(a.at)}</div></li>`).join('')}</ul>`}
function renderDecisions(root){root.innerHTML=pageHead('Decision Queue','Separate decisions from discussion so blockers are visible.')+`<div class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Decision</th><th>Owner</th><th>Status</th><th>Due</th></tr></thead><tbody>${App.data.decisions.map(d=>`<tr><td>${esc(d.id)}</td><td><strong>${esc(d.title)}</strong></td><td>${esc(d.owner)}</td><td><span class="pill ${d.status==='Required'?'high':'pending'}">${esc(d.status)}</span></td><td>${fmtDate(d.due)}</td></tr>`).join('')}</tbody></table></div></div>`;}
function workflow(){const steps=[['1','Request','Capture once'],['2','Assess','Impact & priority'],['3','Assign','Owner & vendor'],['4','Follow-up','Track & unblock'],['5','Verify','Store confirms'],['6','Close','Document outcome']];return `<div class="workflow">${steps.map((s,i)=>`${i?'<div class="workflow-arrow">→</div>':''}<div class="workflow-step"><div class="workflow-circle">${s[0]}</div><span>${s[1]}</span><small>${s[2]}</small></div>`).join('')}</div>`}
function openRequestEditor(id){
  const row=(App.data.requests||[]).find(r=>r.id===id);if(!row)return;
  const root=$('#modalRoot');
  const opts=(values,current)=>values.map(v=>`<option ${String(v)===String(current)?'selected':''}>${esc(v)}</option>`).join('');
  root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">ISSUE / REQUEST</div><h2>Edit ${esc(row.id)}</h2></div><button class="icon-btn" id="closeRequestEdit">×</button></div>
    <form id="requestEditForm"><div class="form-grid">
      <div class="field full"><label>Title</label><input name="title" required value="${esc(row.title||'')}"></div>
      <div class="field"><label>Category</label><input name="category" value="${esc(row.category||'')}"></div>
      <div class="field"><label>Priority</label><select name="priority">${opts(['Low','Normal','Medium','High','Urgent'],row.priority)}</select></div>
      <div class="field"><label>Status</label><select name="status">${opts(['New','Not Started','Planned','Scheduled','In Progress','Pending Vendor','Blocked','Resolved','Closed'],row.status)}</select></div>
      <div class="field"><label>Owner</label><input name="owner" value="${esc(row.owner||'')}"></div>
      <div class="field"><label>Requester</label><input name="requester" value="${esc(row.requester||'')}"></div>
      <div class="field full"><label>Next action</label><textarea name="nextAction">${esc(row.nextAction||'')}</textarea></div>
      <div class="field full"><label>Description</label><textarea name="description">${esc(row.description||'')}</textarea></div>
      <div class="field full"><label>Attachment / reference</label><input name="attachmentRef" value="${esc(row.attachmentRef||'')}"></div>
    </div><div class="modal-actions"><button type="button" class="btn" id="cancelRequestEdit">Cancel</button><button class="btn primary" type="submit">Save changes</button></div></form>
  </div></div>`;
  const close=()=>root.innerHTML='';
  $('#closeRequestEdit').onclick=$('#cancelRequestEdit').onclick=close;
  $('#requestEditForm').onsubmit=async e=>{
    e.preventDefault();const fd=new FormData(e.target);const patch=Object.fromEntries(fd.entries());
    try{await IBData.updateRequest(id,patch);App.data=await IBData.getAll();close();render();toast(`${id} updated`);}catch(err){toast(err.message||String(err));}
  };
}
window.IBRequestEditor={open:openRequestEditor};

function openRequestModal(kind){const root=$('#modalRoot');root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">STORE OPERATIONS</div><h2>${kind==='issue'?'Report an Issue':'New Request'}</h2></div><button class="icon-btn" id="closeModal">×</button></div><form id="requestForm"><div class="form-grid"><div class="field"><label>Category</label><select name="category"><option>Store Operations</option><option>Retail / POS</option><option>Network / Connectivity</option><option>Hardware</option><option>Account / Access</option><option>Vendor</option><option>Maintenance</option><option>Other</option></select></div><div class="field"><label>Priority</label><select name="priority"><option>Normal</option><option>High</option><option>Urgent</option></select></div><div class="field full"><label>Title</label><input name="title" required placeholder="Short description of the need" /></div><div class="field full"><label>Description</label><textarea name="description" placeholder="What happened? What is the impact on the store?"></textarea></div><div class="field"><label>Requested by</label><input name="requester" value="Lisa / Store" /></div><div class="field"><label>Attachment reference</label><input name="attachment" placeholder="Drive link or file reference (later automated)" /></div></div><div class="modal-actions"><button type="button" class="btn" id="cancelModal">Cancel</button><button class="btn primary" type="submit">Submit</button></div></form></div></div>`;$('#closeModal').onclick=$('#cancelModal').onclick=()=>root.innerHTML='';$('#requestForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const payload={title:f.get('title'),category:f.get('category'),priority:f.get('priority'),requester:f.get('requester'),description:f.get('description'),attachment:f.get('attachment')};await IBData.createRequest(payload);App.data=await IBData.getAll();root.innerHTML='';render();toast('Request created and logged');};}
function wireGo(){$$('[data-go]').forEach(b=>b.onclick=()=>{App.page=b.dataset.go;render();});$$('.mini-action').forEach(b=>b.onclick=async()=>{await IBData.updateRequest(b.dataset.id,{status:b.dataset.status,nextAction:b.dataset.status==='Resolved'?'Store confirmed resolution':'PM follow-up in progress'});App.data=await IBData.getAll();render();toast(`${b.dataset.id} updated`);});}
function cls(v=''){return String(v).toLowerCase().replaceAll(' ','-').replaceAll('/','-')}
function fmtDate(v){if(!v)return '—';const d=new Date(v+'T12:00:00');return isNaN(d)?esc(v):d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function toast(msg){const r=$('#toastRoot'),el=document.createElement('div');el.className='toast';el.textContent=msg;r.appendChild(el);setTimeout(()=>el.remove(),2600);}
