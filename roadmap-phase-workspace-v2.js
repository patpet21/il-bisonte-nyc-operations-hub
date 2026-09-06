(function(){
  const KEY='ib_nyc_ops_roadmap_phases_v02';
  const OLD_KEY='ib_nyc_ops_roadmap_phases_v01';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const base=[
    {id:'PH-00',name:'Emergency Stabilization & Continuity',status:'Partially Completed',period:'Aug–Sep 2026',owner:'Pietro / Damiano / vendors',progress:'70',objective:'Restore basic store connectivity and keep operations running while the permanent network path is corrected.',completed:'Temporary connectivity workarounds coordinated; vendor appointments organized; initial firewall/router/VPN issues isolated.',openItems:'Permanent architecture validation and clean closeout still required.',nextAction:'Close remaining stabilization actions into Network Stabilization.',evidence:'Project emails, onsite coordination notes, diagnostics',dependencies:'Permanent network architecture validation',notes:'',links:'',customSections:'[]'},
    {id:'PH-01',name:'Network, Firewall & Wi‑Fi Stabilization',status:'In Progress',period:'Sep 2026',owner:'Pietro / Damiano / network vendors',progress:'55',objective:'Establish a documented WatchGuard-centered network baseline with stable DHCP, segmentation, VPN and upstairs Wi‑Fi coverage.',completed:'Firewall replacement path coordinated; current components identified; Wi‑Fi attenuation and AP need identified; Spectrum confirmed as primary ISP.',openItems:'Final segmentation hardware, upstairs/basement validation, DHCP/reservations, VPN validation, cable cleanup and AP decision.',nextAction:'Validate final firewall/segmentation state and schedule upstairs AP assessment.',evidence:'Sep 2–3 vendor emails and onsite diagnostics',dependencies:'Vendor availability; segmentation hardware; Italy-side VPN validation',notes:'',links:'',customSections:'[]'},
    {id:'PH-02',name:'Retail Pro Prism & Remote Access',status:'In Progress',period:'Sep 2026',owner:'Damiano / Italy IT / Pietro',progress:'45',objective:'Stabilize Retail Pro Prism connectivity and document the DNS/VPN/remote-support path.',completed:'Prism Proxy port 8081 checked; DNS resolution failure reproduced; VPN adapter and server references inspected.',openItems:'Confirm DNS/hosts ownership, validate VPN route, retest Prism from store and Italy, document escalation path.',nextAction:'Italy IT to validate Prism name resolution and VPN dependency.',evidence:'Sep 3 command-line diagnostics and remote-access discussion',dependencies:'Italy IT validation of DNS and VPN',notes:'',links:'',customSections:'[]'},
    {id:'PH-03',name:'Documentation, Assets, Vendors & Credentials',status:'In Progress',period:'Sep–Oct 2026',owner:'Pietro / Damiano / Store Manager',progress:'35',objective:'Create a reliable operational baseline for systems, hardware, vendors, credentials, SOPs and ownership.',completed:'Vendor baseline started; systems register created; private credential vault structured; Pass workspace created.',openItems:'Complete physical asset inventory, owner matrix, credential review, SOP library and support escalation matrix.',nextAction:'Finish asset baseline and confirm credential owners/recovery paths.',evidence:'Operations Hub registers and credential file',dependencies:'Physical inventory; company confirmation of owners',notes:'',links:'',customSections:'[]'},
    {id:'PH-04',name:'NYC Operations Hub & Access Governance',status:'In Progress',period:'Sep 2026',owner:'Pietro',progress:'75',objective:'Provide one private role-based workspace for requests, projects, vendors, procedures, users, Pass and management visibility.',completed:'Responsive prototype, project detail cards, Pass workspace, private credential Sheet, user/role model and Google Sign-In architecture built.',openItems:'Google OAuth client, Apps Script deployment, production Sheet connection, authenticated role enforcement and company handover.',nextAction:'Configure Google Web OAuth client and deploy Apps Script backend.',evidence:'GitHub main + Google Sheets demo database',dependencies:'Google OAuth Web Client and Apps Script deployment',notes:'',links:'',customSections:'[]'},
    {id:'PH-05',name:'Retail & Store Process Mapping',status:'Planned',period:'Sep–Oct 2026',owner:'Pietro / Damiano / Store Manager',progress:'5',objective:'Map inventory, reporting and recurring store/Italy workflows before automating anything.',completed:'Automation opportunities identified at a high level: reports, inventory, vendor requests and weekly status.',openItems:'Detailed interviews, current-state maps, ownership matrix and pain-point validation.',nextAction:'Interview Damiano and Store Manager; document current workflow.',evidence:'PM collaboration discovery notes',dependencies:'Stakeholder interviews and Retail Pro visibility',notes:'',links:'',customSections:'[]'},
    {id:'PH-06',name:'Automation Node, UPS, Monitoring & Reporting',status:'Planned',period:'Oct 2026',owner:'Pietro / Damiano',progress:'5',objective:'Create a resilient local automation node for approved workflows and operational monitoring.',completed:'Concept defined: always-on mini PC protected by UPS; automation backlog identified.',openItems:'Sizing, procurement, secure setup, UPS runtime, backup/restart behavior, monitoring and first automations.',nextAction:'Define mini-PC workload and UPS requirements before purchase.',evidence:'Automation planning discussions',dependencies:'Approved workload; stable network; secure placement',notes:'',links:'',customSections:'[]'},
    {id:'PH-07',name:'Physical Security & Continuous Improvement',status:'Planned',period:'Later / Pilot',owner:'Management / Pietro / security vendor',progress:'0',objective:'Close remaining physical-security items and run the Hub as an ongoing improvement system.',completed:'Physical security was explicitly deferred until firewall/hardware stabilization.',openItems:'Security testing, recurring reviews, KPI reporting, backlog prioritization and pilot closeout.',nextAction:'Schedule physical security review after infrastructure stabilization.',evidence:'Nate/Karen coordination emails',dependencies:'Infrastructure stabilization',notes:'',links:'',customSections:'[]'}
  ];
  let current=null,dirty=false;

  function readSaved(){
    let saved={};
    try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
    if(!Object.keys(saved).length){
      try{saved=JSON.parse(localStorage.getItem(OLD_KEY)||'{}')}catch(e){}
    }
    return saved&&typeof saved==='object'?saved:{};
  }
  function getAll(){const saved=readSaved();return base.map(p=>({...p,...(saved[p.id]||{})}))}
  function get(id){return getAll().find(x=>x.id===id)||null}
  function persist(p){const saved=readSaved();saved[p.id]=p;localStorage.setItem(KEY,JSON.stringify(saved))}
  function canEdit(){const s=window.IBAuth?.current?.();if(s?.permissions&&typeof s.permissions.manageProjects==='boolean')return s.permissions.manageProjects;return ['project_manager','it_admin'].includes(window.App?.role)}
  function parseCustom(v){if(Array.isArray(v))return v;try{const x=JSON.parse(v||'[]');return Array.isArray(x)?x:[]}catch(e){return []}}

  document.addEventListener('DOMContentLoaded',()=>{
    document.addEventListener('click',e=>{
      const card=e.target.closest?.('.phase-card[data-phase-id]');
      if(!card)return;
      e.preventDefault();e.stopPropagation();open(card.dataset.phaseId);
    },true);
    document.addEventListener('keydown',e=>{
      if(!['Enter',' '].includes(e.key))return;
      const card=e.target.closest?.('.phase-card[data-phase-id]');
      if(!card)return;
      e.preventDefault();open(card.dataset.phaseId);
    },true);
  });

  function open(id){
    const p=get(id);if(!p)return;
    current=p;dirty=false;
    const edit=canEdit(),custom=parseCustom(p.customSections),root=q('#modalRoot');if(!root)return;
    root.innerHTML=`<div class="pw-backdrop" id="phaseBackdrop"><div class="pw-shell" role="dialog" aria-modal="true" aria-label="Roadmap phase workspace"><header class="pw-head"><div class="pw-head-main"><div class="pw-project-id">${safe(p.id)} · ROADMAP PHASE</div><h2 class="pw-title">${safe(p.name)}</h2><div class="pw-subline"><span class="pill ${slug(p.status)}">${safe(p.status)}</span>${edit?'':'<span class="pw-view-only">View only</span>'}</div></div><div class="pw-head-actions"><span class="pw-unsaved" id="phaseUnsaved"></span>${edit?'<button class="pw-save" id="phaseSave">Save changes</button>':''}<button class="pw-close" id="phaseClose">×</button></div></header><nav class="pw-tabs"><button class="pw-tab active" data-phase-tab="overview">Overview</button><button class="pw-tab" data-phase-tab="status">Status & Delivery</button><button class="pw-tab" data-phase-tab="notes">Notes & Links</button><button class="pw-tab" data-phase-tab="custom">Custom Sections <span class="muted">${custom.length}</span></button></nav><div class="pw-body"><section class="pw-panel active" data-phase-panel="overview">${overview(p,edit)}</section><section class="pw-panel" data-phase-panel="status">${statusPanel(p,edit)}</section><section class="pw-panel" data-phase-panel="notes">${notesPanel(p,edit)}</section><section class="pw-panel" data-phase-panel="custom">${customPanel(custom,edit)}</section></div></div></div>`;
    wire(edit);
  }
  function overview(p,e){return `<div class="pw-section"><div class="pw-section-head"><div><h3>Phase Overview</h3><p>Edit the roadmap itself, not only the projects underneath it.</p></div></div><div class="pw-grid pw-grid-3">${field('Phase name','name',p.name,e,'full')}${field('Owner','owner',p.owner,e)}${field('Period','period',p.period,e)}${select('Status','status',p.status,['Planned','In Progress','Partially Completed','Completed','Blocked','On Hold'],e)}${field('Progress %','progress',p.progress,e)}${area('Objective','objective',p.objective,e,'full tall')}</div></div>`}
  function statusPanel(p,e){return `<div class="pw-section"><div class="pw-section-head"><div><h3>Delivery Status</h3><p>Keep completed work separate from what is still open.</p></div></div><div class="pw-grid">${area('Completed to date','completed',p.completed,e,'full tall')}${area('Open items','openItems',p.openItems,e,'full tall')}${area('Next action','nextAction',p.nextAction,e,'full')}${area('Dependencies','dependencies',p.dependencies,e,'full')}${area('Evidence / source','evidence',p.evidence,e,'full')}</div></div>`}
  function notesPanel(p,e){return `<div class="pw-section"><div class="pw-section-head"><div><h3>Working Notes</h3><p>Add meeting notes, decisions, reminders or context.</p></div></div>${area('Notes','notes',p.notes,e,'full tall')}</div><div class="pw-section"><div class="pw-section-head"><div><h3>Links & References</h3></div></div>${area('Links','links',p.links,e,'full')}</div>`}
  function customPanel(custom,e){return `<div class="pw-note">Add any section you need: budget, approvals, hardware, meeting notes, vendor details, lessons learned, or anything else.</div><div class="pw-section"><div class="pw-section-head"><div><h3>Custom Sections</h3></div>${e?'<button class="pw-add-task" id="phaseAddSection">+ Add section</button>':''}</div><div id="phaseCustomList">${custom.length?custom.map((s,i)=>customCard(s,i,e)).join(''):'<div class="pw-task-empty" id="phaseCustomEmpty">No custom sections yet.</div>'}</div></div>`}
  function customCard(s,i,e){return `<div class="pw-section pw-custom-section" data-phase-custom="${i}" style="margin-bottom:10px"><div class="pw-section-head"><div style="flex:1">${e?`<input class="pw-input" data-phase-title value="${safe(s.title||'Untitled section')}">`:`<h3>${safe(s.title||'Untitled section')}</h3>`}</div>${e?'<button class="pw-task-delete" data-phase-delete>×</button>':''}</div>${e?`<textarea class="pw-textarea tall" data-phase-body>${safe(s.body||'')}</textarea>`:`<div class="pw-readonly">${safe(s.body||'—').replace(/\n/g,'<br>')}</div>`}</div>`}
  function field(l,n,v,e,x=''){return `<div class="pw-field ${x}"><span>${safe(l)}</span>${e?`<input class="pw-input" name="${n}" value="${safe(v||'')}">`:`<div class="pw-readonly">${safe(v||'—')}</div>`}</div>`}
  function area(l,n,v,e,x=''){return `<div class="pw-field ${x}"><span>${safe(l)}</span>${e?`<textarea class="pw-textarea ${x.includes('tall')?'tall':''}" name="${n}">${safe(v||'')}</textarea>`:`<div class="pw-readonly">${safe(v||'—').replace(/\n/g,'<br>')}</div>`}</div>`}
  function select(l,n,v,vals,e){return `<div class="pw-field"><span>${safe(l)}</span>${e?`<select class="pw-select" name="${n}">${vals.map(x=>`<option ${x===v?'selected':''}>${safe(x)}</option>`).join('')}</select>`:`<div class="pw-readonly">${safe(v||'—')}</div>`}</div>`}
  function wire(edit){
    q('#phaseClose').onclick=attemptClose;
    q('#phaseBackdrop').onclick=e=>{if(e.target===e.currentTarget)attemptClose()};
    qa('[data-phase-tab]').forEach(b=>b.onclick=()=>{qa('[data-phase-tab]').forEach(x=>x.classList.toggle('active',x===b));qa('[data-phase-panel]').forEach(x=>x.classList.toggle('active',x.dataset.phasePanel===b.dataset.phaseTab))});
    if(!edit)return;
    q('#phaseSave').onclick=save;
    qa('.pw-input,.pw-select,.pw-textarea',q('#phaseBackdrop')).forEach(x=>x.addEventListener('input',markDirty));
    q('#phaseAddSection')?.addEventListener('click',()=>{q('#phaseCustomEmpty')?.remove();const w=document.createElement('div');w.innerHTML=customCard({title:'New Section',body:''},Date.now(),true);const node=w.firstElementChild;q('#phaseCustomList').appendChild(node);wireCustom(node);markDirty();q('[data-phase-title]',node)?.select()});
    qa('[data-phase-custom]',q('#phaseBackdrop')).forEach(wireCustom);
  }
  function wireCustom(node){qa('input,textarea',node).forEach(x=>x.addEventListener('input',markDirty));q('[data-phase-delete]',node)?.addEventListener('click',()=>{node.remove();markDirty()})}
  function markDirty(){dirty=true;const x=q('#phaseUnsaved');if(x)x.textContent='Unsaved changes'}
  function save(){
    if(!current)return;
    const btn=q('#phaseSave');btn.disabled=true;btn.textContent='Saving…';
    const patch={};qa('[name]',q('#phaseBackdrop')).forEach(x=>patch[x.name]=x.value);
    patch.progress=String(Math.max(0,Math.min(100,Number(patch.progress)||0)));
    patch.customSections=JSON.stringify(qa('[data-phase-custom]',q('#phaseBackdrop')).map(n=>({title:q('[data-phase-title]',n)?.value||'Untitled section',body:q('[data-phase-body]',n)?.value||''})));
    current={...current,...patch};persist(current);dirty=false;syncVisibleCard(current);
    btn.textContent='Saved';const u=q('#phaseUnsaved');if(u)u.textContent='';
    setTimeout(()=>{if(btn.isConnected){btn.disabled=false;btn.textContent='Save changes'}},650);
    if(typeof window.toast==='function')window.toast('Roadmap phase saved');
  }
  function syncVisibleCard(p){
    const card=q(`.phase-card[data-phase-id="${p.id}"]`);if(!card)return;
    card.className=`phase-card ${slug(p.status)}`;
    const id=q('.phase-id',card);if(id)id.textContent=`${p.id} · ${p.period}`;
    const st=q('.phase-status',card);if(st){st.className=`phase-status ${slug(p.status)}`;st.textContent=p.status}
    const h=q('h4',card);if(h)h.textContent=p.name;
    const d=q('p',card);if(d)d.textContent=p.objective;
    const next=q('.phase-next strong',card);if(next)next.textContent=p.nextAction;
  }
  function attemptClose(){if(dirty&&!confirm('Close without saving your roadmap changes?'))return;q('#phaseBackdrop')?.remove();current=null;dirty=false}

  window.IBRoadmapPhaseStore={getAll,get,persist};
  window.IBRoadmapPhaseWorkspace={open};
})();
