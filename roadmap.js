(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const phases=[
    {id:'PH-00',name:'Emergency Stabilization & Continuity',status:'Partially Completed',period:'Aug–Sep 2026',objective:'Restore basic store connectivity and keep operations running while the permanent network path is corrected.',next:'Close remaining stabilization actions into Network Stabilization.'},
    {id:'PH-01',name:'Network, Firewall & Wi‑Fi Stabilization',status:'In Progress',period:'Sep 2026',objective:'Establish a documented WatchGuard-centered network baseline with stable DHCP, segmentation, VPN and upstairs Wi‑Fi coverage.',next:'Validate final firewall/segmentation state and schedule upstairs AP assessment.'},
    {id:'PH-02',name:'Retail Pro Prism & Remote Access',status:'In Progress',period:'Sep 2026',objective:'Stabilize Retail Pro Prism connectivity and document the DNS/VPN/remote-support path.',next:'Italy IT to validate Prism name resolution and VPN dependency.'},
    {id:'PH-03',name:'Documentation, Assets, Vendors & Credentials',status:'In Progress',period:'Sep–Oct 2026',objective:'Create a reliable operational baseline for systems, hardware, vendors, credentials, SOPs and ownership.',next:'Finish asset baseline and confirm credential owners/recovery paths.'},
    {id:'PH-04',name:'NYC Operations Hub & Access Governance',status:'In Progress',period:'Sep 2026',objective:'Provide one private role-based workspace for requests, projects, vendors, procedures, users, Pass and management visibility.',next:'Configure Google Web OAuth client and deploy Apps Script backend.'},
    {id:'PH-05',name:'Retail & Store Process Mapping',status:'Planned',period:'Sep–Oct 2026',objective:'Map inventory, reporting and recurring store/Italy workflows before automating anything.',next:'Interview Damiano and Store Manager; document current workflow.'},
    {id:'PH-06',name:'Automation Node, UPS, Monitoring & Reporting',status:'Planned',period:'Oct 2026',objective:'Create a resilient local automation node for approved workflows and operational monitoring.',next:'Define mini-PC workload and UPS requirements before purchase.'},
    {id:'PH-07',name:'Physical Security & Continuous Improvement',status:'Planned',period:'Later / Pilot',objective:'Close remaining physical-security items and run the Hub as an ongoing improvement system.',next:'Schedule physical security review after infrastructure stabilization.'}
  ];
  const milestones=[
    ['Sep 2','Onsite firewall & hardware coordination','Firewall installation/hardware work coordinated with store and vendors.','done'],
    ['Sep 3','Segmentation hardware escalation','Additional firewall hardware requested for upstairs/basement segmentation; Wi‑Fi instability remained.','open'],
    ['Sep 3','Retail Pro Prism diagnostic','DNS resolution and VPN path investigated; port 8081 dependency reviewed.','open'],
    ['Sep 4','PM operating model defined','Local PM role framed around coordination, vendor management, documentation, process improvement and reporting.','done'],
    ['Sep 5','Operations Hub baseline established','Role-based Store Manager, PM and Management views created.','done'],
    ['Sep 6','Pass, private vault & auth architecture','Credential vault, Pass workspace, role model and Google Sign-In architecture prepared.','done'],
    ['Next','Google Auth + Apps Script production connection','Create Web OAuth client, deploy backend and validate Pending → Approve → role enforcement.','future'],
    ['Next','Automation node & UPS design','Define mini-PC workload, UPS runtime, placement and recovery behavior before procurement.','future']
  ];
  const openItems=[
    ['Final WatchGuard / segmentation validation','Confirm central gateway, upstairs/basement segmentation and final traffic path.','High'],
    ['Prism DNS/VPN validation','Validate hostname resolution, VPN route and retest port 8081 from store and Italy.','High'],
    ['Upstairs Wi‑Fi assessment','Confirm whether an AP is required and where it should be placed.','High'],
    ['DHCP and POS/printer reservations','Validate central DHCP and stable reservations after network changes.','High'],
    ['Asset inventory & network map','Record current devices, locations, serials and current vs target topology.','Medium'],
    ['Credential ownership review','Confirm owners, recovery contacts and incomplete legacy records.','Medium'],
    ['Google production authentication','Create OAuth Client ID and deploy Apps Script backend.','High'],
    ['Vendor ownership matrix','Clarify eMazzanti, ISP, Retail Pro, Italy IT and onsite support boundaries.','Medium']
  ];
  const nextItems=[
    ['Inventory & Retail workflow mapping','Interview Damiano and Store Manager; document current-state process.'],
    ['Automation mini-PC requirements','Define approved services, workload, storage and security needs.'],
    ['UPS sizing & procurement','Determine runtime target, load, outlets, placement and recovery behavior.'],
    ['Weekly PM reporting','Automate a concise summary from projects, issues and vendors after the baseline is stable.'],
    ['Connectivity health monitoring','Design only after network stabilization to avoid automating noise.'],
    ['Physical security review','Schedule after infrastructure stabilization and document closeout.']
  ];

  document.addEventListener('DOMContentLoaded',()=>waitForCore().then(init).catch(console.error));
  function waitForCore(){return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(typeof App!=='undefined'&&App.data&&typeof renderPage==='function'&&typeof renderNav==='function'){clearInterval(t);resolve()}else if(++n>180){clearInterval(t);reject(new Error('Roadmap could not initialize'))}},50)})}
  function init(){['project_manager','management'].forEach(role=>{const list=App.nav[role];if(!list||list.some(x=>x[0]==='roadmap'))return;const i=list.findIndex(x=>x[0]==='dashboard');list.splice(i>=0?i+1:0,0,['roadmap','◆','Roadmap'])});const previous=renderPage;renderPage=function(){if(App.page==='roadmap')return renderRoadmap();previous()};renderNav();if(typeof render==='function')render()}

  function renderRoadmap(){
    const root=q('#pageRoot');const projects=App.data.projects||[],requests=App.data.requests||[];const active=projects.filter(p=>p.status==='In Progress').length,planned=projects.filter(p=>p.status==='Not Started').length,high=requests.filter(r=>r.priority==='High'&&!['Resolved','Closed'].includes(r.status)).length;
    root.innerHTML=`${pageHead('NYC Transformation Roadmap','A reconstructed baseline of what has already happened, what is still open, and what comes next.','PROGRAM BASELINE')}<div class="roadmap-shell">
      <section class="roadmap-banner"><div><div class="eyebrow">RECONSTRUCTED FROM PROJECT HISTORY</div><h2>One operating picture for the entire NYC workstream.</h2><p>This baseline consolidates network, Retail Pro, vendor, access, Operations Hub, process-improvement, UPS/automation and security work into a single program view. Click a project card to open the editable project workspace.</p></div><div class="roadmap-asof"><span>Baseline as of</span><strong>September 6, 2026</strong><small>Live project data can now be edited directly from each project card.</small></div></section>
      <div class="roadmap-kpis"><div class="roadmap-kpi"><strong>${projects.length}</strong><span>Defined projects</span><small>Infrastructure, retail, governance, automation and security.</small></div><div class="roadmap-kpi"><strong>${active}</strong><span>Active workstreams</span><small>Currently being coordinated or validated.</small></div><div class="roadmap-kpi"><strong>${high}</strong><span>High-priority open items</span><small>Network, Prism, Wi‑Fi, VPN and production auth.</small></div><div class="roadmap-kpi"><strong>${planned}</strong><span>Planned projects</span><small>Workflow mapping, UPS/automation, monitoring and security.</small></div></div>
      <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Program Phases</h3><p>From stabilization to continuous improvement.</p></div></div><div class="phase-grid">${phases.map(phaseCard).join('')}</div></section>
      <div class="roadmap-columns"><section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Open Now</h3><p>Items that should be visible in every status review.</p></div></div><div class="status-list">${openItems.map(x=>statusItem(x[0],x[1],x[2],'open')).join('')}</div></section><section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Next 30–60 Days</h3><p>Planned work after the current baseline is stable.</p></div></div><div class="status-list">${nextItems.map(x=>statusItem(x[0],x[1],'Next','next')).join('')}</div></section></div>
      <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Project Portfolio</h3><p>Click a card to open, edit, add tasks, notes, links and project details.</p></div><button class="btn" data-go="projects">Open Projects</button></div><div class="roadmap-projects">${projects.map(projectCard).join('')}</div></section>
      <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Milestones & Evidence Trail</h3><p>A concise chronology of the baseline already established.</p></div></div><div class="milestone-list">${milestones.map(milestone).join('')}</div></section>
      <div class="baseline-note"><strong>Important:</strong> open technical items remain open until validated by the responsible owner/vendor.</div></div>`;
    qa('[data-go]',root).forEach(b=>b.onclick=()=>{App.page=b.dataset.go;render()});qa('[data-roadmap-project]',root).forEach(c=>c.onclick=()=>window.IBProjectWorkspace?.open(c.dataset.roadmapProject));
  }
  function phaseCard(p){const c=slug(p.status);return `<article class="phase-card ${c}"><div class="phase-top"><span class="phase-id">${safe(p.id)} · ${safe(p.period)}</span><span class="phase-status ${c}">${safe(p.status)}</span></div><h4>${safe(p.name)}</h4><p>${safe(p.objective)}</p><div class="phase-next"><span>Next action</span><strong>${safe(p.next)}</strong></div></article>`}
  function statusItem(title,detail,tag,type){return `<div class="status-item"><span class="status-marker ${type}"></span><div class="status-main"><strong>${safe(title)}</strong><span>${safe(detail)}</span></div><span class="status-tag">${safe(tag)}</span></div>`}
  function projectCard(p){return `<article class="roadmap-project" data-roadmap-project="${safe(p.id)}" tabindex="0" role="button"><div class="roadmap-project-top"><span class="phase-id">${safe(p.id)} · ${safe(p.scope)}</span><span class="pill ${slug(p.priority)}">${safe(p.priority)}</span></div><h4>${safe(p.name)}</h4><p>${safe(p.description)}</p><div class="roadmap-next"><b>${safe(p.progress||0)}%</b> · Next: ${safe(p.nextAction)}</div></article>`}
  function milestone(m){return `<div class="milestone ${m[3]==='future'?'future':''}"><div class="milestone-date">${safe(m[0])}</div><div class="milestone-track"><div class="milestone-dot"></div></div><div class="milestone-body"><strong>${safe(m[1])}</strong><p>${safe(m[2])}</p></div></div>`}
  function slug(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
})();
