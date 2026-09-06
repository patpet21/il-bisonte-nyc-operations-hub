(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let currentId=null,dirty=false,deletedTasks=new Set();

  document.addEventListener('DOMContentLoaded',()=>waitForCore().then(init).catch(console.error));
  function waitForCore(){return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.IBData&&typeof App!=='undefined'&&App.data&&q('#pageRoot')){clearInterval(t);resolve()}else if(++n>180){clearInterval(t);reject(new Error('Project workspace could not initialize'))}},50)})}

  function init(){
    const root=q('#pageRoot');
    root.addEventListener('click',captureOpen,true);
    root.addEventListener('keydown',captureKey,true);
    document.addEventListener('click',e=>{const c=e.target.closest('[data-roadmap-project]');if(c){e.preventDefault();e.stopImmediatePropagation();open(c.dataset.roadmapProject)}},true);
    document.addEventListener('keydown',e=>{const c=e.target.closest?.('[data-roadmap-project]');if(c&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();open(c.dataset.roadmapProject)}},true);
    window.IBProjectWorkspace={open};
  }

  function captureOpen(e){
    if(e.target.closest('button,a,input,select,textarea'))return;
    const target=e.target.closest('[data-project-id],.kanban-card[data-project-name]');if(!target)return;
    const p=target.dataset.projectId?App.data.projects.find(x=>x.id===target.dataset.projectId):App.data.projects.find(x=>x.name===target.dataset.projectName);if(!p)return;
    e.preventDefault();e.stopImmediatePropagation();open(p.id);
  }
  function captureKey(e){
    if(!['Enter',' '].includes(e.key))return;
    const target=e.target.closest('[data-project-id],.kanban-card[data-project-name]');if(!target)return;
    const p=target.dataset.projectId?App.data.projects.find(x=>x.id===target.dataset.projectId):App.data.projects.find(x=>x.name===target.dataset.projectName);if(!p)return;
    e.preventDefault();e.stopImmediatePropagation();open(p.id);
  }

  async function open(id){
    const project=App.data.projects.find(x=>x.id===id);if(!project)return;
    currentId=id;dirty=false;deletedTasks=new Set();q('#projectDetailBackdrop')?.remove();
    const root=q('#modalRoot');if(!root)return;
    root.innerHTML=`<div class="pw-backdrop" id="pwBackdrop"><div class="pw-shell" role="dialog" aria-modal="true" aria-label="Project workspace"><div class="pw-loading">Opening project…</div></div></div>`;
    await ensureTasks();render(project);
  }

  async function ensureTasks(){if(Array.isArray(App.data.tasks))return;try{const fresh=await IBData.getAll();App.data={...App.data,...fresh}}catch(e){App.data.tasks=[]}}
  function canEdit(){
    const s=window.IBAuth?.current?.();if(s?.permissions&&typeof s.permissions.manageProjects==='boolean')return s.permissions.manageProjects;
    return ['project_manager','it_admin'].includes(App.role);
  }

  function render(p){
    const shell=q('.pw-shell');if(!shell)return;const editable=canEdit();const tasks=(App.data.tasks||[]).filter(t=>t.projectId===p.id);
    shell.innerHTML=`<header class="pw-head"><div class="pw-head-main"><div class="pw-project-id">${safe(p.id)} · ${safe(p.scope||'Project')}</div><h2 class="pw-title" id="pwTitle">${safe(p.name)}</h2><div class="pw-subline"><span class="pill ${cls(p.priority)}">${safe(p.priority||'Normal')}</span><span class="pill ${cls(p.status)}">${safe(p.status||'Not Started')}</span>${editable?'':'<span class="pw-view-only">View only</span>'}</div></div><div class="pw-head-actions"><span class="pw-unsaved" id="pwUnsaved"></span>${editable?'<button class="pw-save" id="pwSave">Save changes</button>':''}<button class="pw-close" id="pwClose" aria-label="Close">×</button></div></header>
      <nav class="pw-tabs"><button class="pw-tab active" data-pw-tab="overview">Overview</button><button class="pw-tab" data-pw-tab="details">Details</button><button class="pw-tab" data-pw-tab="tasks">Tasks <span class="muted">${tasks.length}</span></button><button class="pw-tab" data-pw-tab="notes">Notes & Links</button><button class="pw-tab" data-pw-tab="activity">Activity</button></nav>
      <div class="pw-body">
        <section class="pw-panel active" data-pw-panel="overview">${overviewPanel(p,editable)}</section>
        <section class="pw-panel" data-pw-panel="details">${detailsPanel(p,editable)}</section>
        <section class="pw-panel" data-pw-panel="tasks">${tasksPanel(tasks,editable)}</section>
        <section class="pw-panel" data-pw-panel="notes">${notesPanel(p,editable)}</section>
        <section class="pw-panel" data-pw-panel="activity">${activityPanel(p)}</section>
      </div>`;
    wire(p,editable);
  }

  function overviewPanel(p,edit){return `<div class="pw-section"><div class="pw-section-head"><div><h3>Project Overview</h3><p>The essential information anyone should understand immediately.</p></div></div><div class="pw-grid pw-grid-3">
    ${field('Project name','name',p.name,'text',edit,'full')}${field('Owner','owner',p.owner,'text',edit)}${field('Scope / Area','scope',p.scope,'text',edit)}${selectField('Priority','priority',p.priority,['Low','Medium','High','Urgent'],edit)}${selectField('Status','status',p.status,['Not Started','In Progress','In Review','Blocked','Completed','On Hold'],edit)}${field('Target date','due',p.due,'date',edit)}
    <div class="pw-field full"><span>Progress</span>${edit?`<div class="pw-progress-row"><input class="pw-range" id="pwProgress" name="progress" type="range" min="0" max="100" value="${num(p.progress)}"><input class="pw-input" id="pwProgressNumber" type="number" min="0" max="100" value="${num(p.progress)}"></div>`:`<div class="pw-readonly">${num(p.progress)}%</div>`}</div>
    ${area('Next action','nextAction',p.nextAction,edit,'full')}
  </div></div>`}

  function detailsPanel(p,edit){return `<div class="pw-section"><div class="pw-section-head"><div><h3>Purpose & Context</h3><p>Why the project exists and what success means.</p></div></div><div class="pw-grid">${area('Description','description',p.description,edit,'full tall')}${area('Objective','objective',p.objective,edit,'full')}</div></div>
    <div class="pw-section"><div class="pw-section-head"><div><h3>People & Delivery</h3><p>Who is involved and what must be produced.</p></div></div><div class="pw-grid">${area('Stakeholders','stakeholders',p.stakeholders,edit,'full')}${area('Deliverables','deliverables',p.deliverables,edit,'full')}</div></div>
    <div class="pw-section"><div class="pw-section-head"><div><h3>Risks & Dependencies</h3><p>Keep blockers and dependencies visible before they become surprises.</p></div></div><div class="pw-grid">${area('Risks','risks',p.risks,edit,'full')}${area('Dependencies','dependencies',p.dependencies,edit,'full')}</div></div>`}

  function tasksPanel(tasks,edit){return `<div class="pw-section"><div class="pw-section-head"><div><h3>Tasks</h3><p>Simple enough for the store, structured enough for project control.</p></div>${edit?'<div class="pw-task-toolbar"><button class="pw-add-task" id="pwAddTask">+ Add task</button></div>':''}</div><div class="pw-task-list" id="pwTaskList">${tasks.length?tasks.map(t=>taskRow(t,edit)).join(''):'<div class="pw-task-empty" id="pwTaskEmpty">No tasks yet. Add the first action for this project.</div>'}</div></div>`}

  function taskRow(t,edit){const id=t.id||`NEW-${Date.now()}`;return `<div class="pw-task" data-task-id="${safe(id)}" data-new="${String(id).startsWith('NEW-')?'1':'0'}"><div><input class="pw-task-check" type="checkbox" ${t.status==='Completed'?'checked':''} ${edit?'':'disabled'}></div><input class="pw-input pw-task-title" data-task-field="title" value="${safe(t.title||'')}" placeholder="Task title" ${edit?'':'disabled'}><input class="pw-input pw-task-owner" data-task-field="owner" value="${safe(t.owner||'')}" placeholder="Owner" ${edit?'':'disabled'}><select class="pw-select pw-task-priority" data-task-field="priority" ${edit?'':'disabled'}>${opts(['Low','Medium','High','Urgent'],t.priority||'Medium')}</select><select class="pw-select pw-task-status" data-task-field="status" ${edit?'':'disabled'}>${opts(['Not Started','In Progress','Pending Vendor','Blocked','Completed'],t.status||'Not Started')}</select><input class="pw-input pw-task-due" data-task-field="due" type="date" value="${safe(t.due||'')}" ${edit?'':'disabled'}>${edit?'<button class="pw-task-delete" title="Remove task">×</button>':''}</div>`}

  function notesPanel(p,edit){return `<div class="pw-note">Use these sections for information that does not belong in the formal project fields. One link or attachment reference per line keeps the project easy to scan.</div><div class="pw-section"><div class="pw-section-head"><div><h3>Working Notes</h3><p>Meeting notes, technical context, decisions to confirm, reminders.</p></div></div>${area('Notes','notes',p.notes,edit,'full tall')}</div><div class="pw-section"><div class="pw-section-head"><div><h3>Links & References</h3><p>Drive folders, vendor portals, documents, tickets or useful references.</p></div></div><div class="pw-grid">${area('Links','links',p.links,edit,'full')}${area('Attachments / file references','attachments',p.attachments,edit,'full')}</div></div>`}

  function activityPanel(p){const rows=(App.data.activity||[]).filter(a=>a.projectId===p.id||String(a.entityId||'')===p.id||String(a.text||'').includes(p.id)||String(a.text||'').toLowerCase().includes(String(p.name||'').toLowerCase())).slice(0,30);return `<div class="pw-section"><div class="pw-section-head"><div><h3>Project Activity</h3><p>Changes recorded by the Hub.</p></div></div>${rows.length?`<div class="pw-activity">${rows.map(a=>`<div class="pw-activity-item"><span class="pw-activity-dot"></span><div class="pw-activity-main"><strong>${safe(a.text||a.action||'Project updated')}</strong><span>${safe(a.by||a.actor||'System')}</span></div><span class="pw-activity-time">${safe(a.at||a.timestamp||'')}</span></div>`).join('')}</div>`:'<div class="pw-task-empty">No project-specific activity recorded yet.</div>'}</div>`}

  function field(label,name,value,type,edit,extra=''){return `<div class="pw-field ${extra}"><span>${safe(label)}</span>${edit?`<input class="pw-input" name="${safe(name)}" type="${type}" value="${safe(value||'')}">`:`<div class="pw-readonly">${safe(value||'—')}</div>`}</div>`}
  function area(label,name,value,edit,extra=''){return `<div class="pw-field ${extra}"><span>${safe(label)}</span>${edit?`<textarea class="pw-textarea ${extra.includes('tall')?'tall':''}" name="${safe(name)}">${safe(value||'')}</textarea>`:`<div class="pw-readonly">${safe(value||'—').replace(/\n/g,'<br>')}</div>`}</div>`}
  function selectField(label,name,value,values,edit){return `<div class="pw-field"><span>${safe(label)}</span>${edit?`<select class="pw-select" name="${safe(name)}">${opts(values,value)}</select>`:`<div class="pw-readonly">${safe(value||'—')}</div>`}</div>`}
  function opts(values,current){return values.map(v=>`<option ${String(v)===String(current)?'selected':''}>${safe(v)}</option>`).join('')}
  function num(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):0}
  function cls(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}

  function wire(p,edit){
    q('#pwClose').onclick=close;
    q('#pwBackdrop').onclick=e=>{if(e.target===e.currentTarget)attemptClose()};
    qa('.pw-tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.pwTab));
    if(!edit)return;
    q('#pwSave').onclick=save;
    qa('.pw-input,.pw-select,.pw-textarea,.pw-range').forEach(el=>el.addEventListener('input',markDirty));
    const range=q('#pwProgress'),number=q('#pwProgressNumber');if(range&&number){range.oninput=()=>{number.value=range.value;markDirty()};number.oninput=()=>{range.value=num(number.value);markDirty()}}
    q('#pwAddTask')?.addEventListener('click',()=>{q('#pwTaskEmpty')?.remove();const row=document.createElement('div');row.innerHTML=taskRow({id:`NEW-${Date.now()}`,title:'',owner:'',priority:'Medium',status:'Not Started',due:''},true);const node=row.firstElementChild;q('#pwTaskList').appendChild(node);wireTask(node);markDirty();node.querySelector('.pw-task-title')?.focus()});
    qa('.pw-task').forEach(wireTask);
  }
  function wireTask(row){
    qa('input,select',row).forEach(el=>el.addEventListener('input',markDirty));
    q('.pw-task-check',row)?.addEventListener('change',e=>{const status=q('[data-task-field="status"]',row);if(status)status.value=e.target.checked?'Completed':'In Progress';markDirty()});
    q('.pw-task-delete',row)?.addEventListener('click',()=>{const id=row.dataset.taskId;if(!row.dataset.new||row.dataset.new==='0')deletedTasks.add(id);row.remove();markDirty();if(!q('.pw-task',q('#pwTaskList')))q('#pwTaskList').innerHTML='<div class="pw-task-empty" id="pwTaskEmpty">No tasks yet. Add the first action for this project.</div>'});
  }
  function switchTab(id){qa('.pw-tab').forEach(x=>x.classList.toggle('active',x.dataset.pwTab===id));qa('.pw-panel').forEach(x=>x.classList.toggle('active',x.dataset.pwPanel===id))}
  function markDirty(){dirty=true;const u=q('#pwUnsaved');if(u)u.textContent='Unsaved changes'}

  async function save(){
    const project=App.data.projects.find(x=>x.id===currentId);if(!project)return;const btn=q('#pwSave');btn.disabled=true;btn.textContent='Saving…';
    try{
      const patch={};qa('[name]',q('.pw-shell')).forEach(el=>patch[el.name]=el.value);patch.progress=q('#pwProgressNumber')?.value||project.progress||'0';
      const updated=await IBData.updateProject(currentId,patch);Object.assign(project,updated);
      for(const id of deletedTasks){await IBData.deleteTask(id)}
      const taskRows=qa('.pw-task',q('#pwTaskList'));for(const row of taskRows){const payload={projectId:currentId};qa('[data-task-field]',row).forEach(el=>payload[el.dataset.taskField]=el.value);payload.status=q('.pw-task-check',row)?.checked?'Completed':payload.status;const id=row.dataset.taskId;if(row.dataset.new==='1')await IBData.createTask(payload);else await IBData.updateTask(id,payload)}
      const fresh=await IBData.getAll();App.data={...App.data,...fresh};dirty=false;deletedTasks.clear();if(typeof render==='function')render();const p=App.data.projects.find(x=>x.id===currentId)||project;render(p);if(typeof toast==='function')toast('Project saved');
    }catch(e){if(typeof toast==='function')toast(e.message||'Unable to save project');btn.disabled=false;btn.textContent='Save changes'}
  }

  function attemptClose(){if(dirty&&!confirm('Close without saving your project changes?'))return;close()}
  function close(){dirty=false;currentId=null;q('#pwBackdrop')?.remove()}
})();
