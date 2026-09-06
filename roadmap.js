(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const phases=[
    {id:'PH-00',name:'Emergency Stabilization & Continuity',status:'Partially Completed',period:'Aug–Sep 2026',objective:'Restore basic store connectivity and keep operations running while the permanent network path is corrected.',done:'Temporary connectivity workarounds coordinated; vendor appointments organized; initial firewall/router/VPN issues isolated.',open:'Permanent architecture validation and clean closeout still required.',next:'Close remaining stabilization actions into Network Stabilization.'},
    {id:'PH-01',name:'Network, Firewall & Wi‑Fi Stabilization',status:'In Progress',period:'Sep 2026',objective:'Establish a documented WatchGuard-centered network baseline with stable DHCP, segmentation, VPN and upstairs Wi‑Fi coverage.',done:'Firewall replacement path coordinated; current components identified; Wi‑Fi attenuation and AP need identified; Spectrum confirmed as primary ISP.',open:'Final segmentation hardware, DHCP/reservations, VPN validation, cable cleanup and AP decision.',next:'Validate final firewall/segmentation state and schedule upstairs AP assessment.'},
    {id:'PH-02',name:'Retail Pro Prism & Remote Access',status:'In Progress',period:'Sep 2026',objective:'Stabilize Retail Pro Prism connectivity and document the DNS/VPN/remote-support path.',done:'Prism Proxy port 8081 checked; DNS resolution failure reproduced; VPN adapter and server references inspected.',open:'Confirm DNS/hosts ownership, validate VPN route, retest Prism from store and Italy, document escalation path.',next:'Italy IT to validate Prism name resolution and VPN dependency.'},
    {id:'PH-03',name:'Documentation, Assets, Vendors & Credentials',status:'In Progress',period:'Sep–Oct 2026',objective:'Create a reliable operational baseline for systems, hardware, vendors, credentials, SOPs and ownership.',done:'Vendor baseline started; systems register created; private credential vault structured; Pass workspace created.',open:'Complete physical asset inventory, owner matrix, credential review, SOP library and support escalation matrix.',next:'Finish asset baseline and confirm credential owners/recovery paths.'},
    {id:'PH-04',name:'NYC Operations Hub & Access Governance',status:'In Progress',period:'Sep 2026',objective:'Provide one private role-based workspace for requests, projects, vendors, procedures, users, Pass and management visibility.',done:'Responsive prototype, project detail cards, Pass workspace, private credential Sheet, user/role model and Google Sign-In architecture built.',open:'Google OAuth client, Apps Script deployment, production Sheet connection, authenticated role enforcement and company handover.',next:'Configure Google Web OAuth client and deploy Apps Script backend.'},
    {id:'PH-05',name:'Retail & Store Process Mapping',status:'Planned',period:'Sep–Oct 2026',objective:'Map inventory, reporting and recurring store/Italy workflows before automating anything.',done:'Automation opportunities identified at a high level: reports, inventory, vendor requests and weekly status.',open:'Detailed interviews, current-state maps, ownership matrix and pain-point validation.',next:'Interview Damiano and Store Manager; document current workflow.'},
    {id:'PH-06',name:'Automation Node, UPS, Monitoring & Reporting',status:'Planned',period:'Oct 2026',objective:'Create a resilient local automation node for approved workflows and operational monitoring.',done:'Concept defined: always-on mini PC protected by UPS; automation backlog identified.',open:'Sizing, procurement, secure setup, UPS runtime, restart behavior, monitoring and first automations.',next:'Define mini-PC workload and UPS requirements before purchase.'},
    {id:'PH-07',name:'Physical Security & Continuous Improvement',status:'Planned',period:'Later / Pilot',objective:'Close remaining physical-security items and run the Hub as an ongoing improvement system.',done:'Physical security was intentionally deferred until firewall/hardware stabilization.',open:'Security testing, recurring reviews, KPI reporting, backlog prioritization and pilot closeout.',next:'Schedule physical security review after infrastructure stabilization.'}
  ];

  const projects=[
    {id:'PRJ-0001',name:'NYC Network Stabilization',scope:'Infrastructure',owner:'Pietro / Damiano',priority:'High',status:'In Progress',due:'2026-09-15',nextAction:'Validate final WatchGuard, segmentation, DHCP and VPN baseline',description:'Coordinate the permanent stabilization of the New York store network after firewall, routing, Wi-Fi and remote-access changes.',objective:'Reach a documented, supportable and stable network baseline.',stakeholders:'Store Manager, Pietro, Damiano, Karen, Nate, eMazzanti, onsite specialists',deliverables:'Validated topology; segmentation; DHCP/reservations; VPN validation; closeout notes',risks:'Vendor dependency; incomplete handover; unresolved segmentation or VPN/DNS dependencies'},
    {id:'PRJ-0002',name:'Upstairs Wi‑Fi Improvement',scope:'Infrastructure',owner:'Pietro / Network Vendor',priority:'High',status:'In Progress',due:'2026-09-20',nextAction:'Confirm AP requirement and installation path',description:'Assess and improve wireless coverage upstairs where structure, metal stairwork and stock may attenuate signal.',objective:'Provide reliable upstairs coverage without unnecessary hardware.',stakeholders:'Store Manager, Pietro, Damiano, eMazzanti / onsite network vendor',deliverables:'Coverage assessment; AP decision; placement; post-install validation',risks:'Signal attenuation; cabling limits; segmentation hardware dependency'},
    {id:'PRJ-0003',name:'Retail Pro Prism Connectivity & Remote Access',scope:'Retail / POS',owner:'Damiano / Italy IT / Pietro',priority:'High',status:'In Progress',due:'2026-09-12',nextAction:'Validate Prism DNS/VPN path and retest port 8081',description:'Resolve intermittent/unavailable Retail Pro Prism access and document its dependency on DNS, VPN and remote support.',objective:'Restore consistent store/Italy access and establish a clear escalation path.',stakeholders:'Damiano, Italy IT, Pietro, Store Manager, Retail Pro Support',deliverables:'DNS/hosts validation; VPN route check; PrismProxy validation; escalation SOP',risks:'Name resolution changes; VPN changes; undocumented server references'},
    {id:'PRJ-0004',name:'Network Documentation & Asset Baseline',scope:'Governance',owner:'Pietro',priority:'Medium',status:'In Progress',due:'2026-09-25',nextAction:'Complete physical inventory and network map',description:'Create an authoritative record of store network equipment, PCs, ownership, location and support path.',objective:'Remove uncertainty during incidents and vendor visits.',stakeholders:'Pietro, Damiano, Store Manager',deliverables:'Asset register; network map; support matrix; photo/document references',risks:'Legacy/unused hardware; unknown serials; configuration drift'},
    {id:'PRJ-0005',name:'Credential Governance & Pass',scope:'Access Governance',owner:'Pietro / Damiano',priority:'High',status:'In Progress',due:'2026-09-30',nextAction:'Confirm credential owners and production access rules',description:'Move scattered credential information into a controlled private vault and role-based access process.',objective:'Know who owns each account, where the secret is stored and who can reveal it.',stakeholders:'Pietro, Damiano, Management, IT',deliverables:'Private Sheet vault; Pass workspace; owner/recovery matrix; reveal audit design',risks:'Legacy shared credentials; excessive access; secret exposure'},
    {id:'PRJ-0006',name:'NYC Operations Hub',scope:'Process & Governance',owner:'Pietro',priority:'High',status:'In Progress',due:'2026-09-18',nextAction:'Complete Google auth and Apps Script production connection',description:'Build a private role-based operations system for requests, projects, vendors, Pass, SOPs, users and reporting.',objective:'Replace fragmented follow-up with one simple operational workflow.',stakeholders:'Store Manager, Pietro, Damiano, Management',deliverables:'Responsive dashboards; project details; notifications; Pass; auth; role permissions; Google Sheets backend',risks:'Overcomplication; incomplete auth; unclear production ownership'},
    {id:'PRJ-0007',name:'Inventory & Retail Workflow Mapping',scope:'Process Improvement',owner:'Pietro',priority:'Medium',status:'Not Started',due:'2026-10-05',nextAction:'Interview Damiano and Store Manager',description:'Map inventory, reports and recurring Retail Pro/store/Italy handoffs before designing automation.',objective:'Identify manual steps, duplicated work and feasible automation candidates.',stakeholders:'Pietro, Damiano, Store Manager',deliverables:'Current-state map; pain points; ownership matrix; automation backlog',risks:'Undocumented manual work; process variation; incomplete report access'},
    {id:'PRJ-0008',name:'Automation Node & UPS',scope:'Infrastructure / Automation',owner:'Pietro / Damiano',priority:'Medium',status:'Not Started',due:'2026-10-15',nextAction:'Define mini-PC workload, UPS sizing and secure placement',description:'Design an always-on local mini PC protected by UPS for approved automations and monitoring.',objective:'Create resilient local execution without depending on a staff workstation.',stakeholders:'Pietro, Damiano, Store Manager',deliverables:'Load profile; UPS specification; install plan; restart/recovery test',risks:'Wrong UPS sizing; insecure placement; unmanaged local service'},
    {id:'PRJ-0009',name:'Monitoring, Ticketing & Weekly Reporting',scope:'Automation',owner:'Pietro',priority:'Medium',status:'Not Started',due:'2026-10-31',nextAction:'Prioritize first monitoring/reporting automation after process mapping',description:'Automate useful operational visibility such as issue tracking, vendor follow-ups, connectivity status and weekly PM summaries.',objective:'Reduce manual follow-up and provide concise management visibility.',stakeholders:'Pietro, Damiano, Store Manager, Management',deliverables:'Weekly status; alerts; ticket register; monitoring baseline',risks:'Automating unstable processes; notification noise; data quality'},
    {id:'PRJ-0010',name:'Physical Security Review',scope:'Security',owner:'Management / Assigned Vendor',priority:'Low',status:'Not Started',due:'2026-11-15',nextAction:'Schedule after network/hardware stabilization',description:'Complete the physical-security testing that was intentionally deferred while infrastructure work was prioritized.',objective:'Close remaining physical-security requirements with documented ownership.',stakeholders:'Management, Pietro, Store Manager, security vendor',deliverables:'Assessment; findings; remediation list; closeout',risks:'Competing priorities; unclear vendor ownership'},
    {id:'PRJ-0011',name:'Vendor & Support Governance',scope:'Vendor Management',owner:'Pietro',priority:'Medium',status:'In Progress',due:'2026-09-30',nextAction:'Complete support ownership and escalation matrix',description:'Centralize vendor responsibilities, contacts, appointments, limitations and escalation paths.',objective:'Make vendor coordination predictable and visible.',stakeholders:'Pietro, Damiano, Karen, Nate, Store Manager',deliverables:'Vendor register; contact path; support scope; appointment log',risks:'Overlapping responsibilities; vendor technology limitations; stale contacts'}
  ];

  const requests=[
    {id:'REQ-0001',title:'Retail Pro Prism connectivity intermittent',category:'Retail / POS',priority:'High',status:'In Progress',owner:'Damiano / Italy IT',requester:'Store / Pietro',createdAt:'2026-09-03',updatedAt:'2026-09-06',nextAction:'Validate DNS/VPN path and retest Prism on port 8081',description:'Prism hostname resolution failed during diagnostics; VPN/DNS changes are the primary area to validate.'},
    {id:'REQ-0002',title:'Upstairs Wi‑Fi coverage and instability',category:'Network / Connectivity',priority:'High',status:'Pending Vendor',owner:'eMazzanti / Network Vendor',requester:'Store Manager',createdAt:'2026-09-03',updatedAt:'2026-09-06',nextAction:'Confirm segmentation hardware and schedule AP coverage assessment',description:'Wi‑Fi upstairs remains unreliable; structure/stock may attenuate signal and additional segmentation/AP hardware may be required.'},
    {id:'REQ-0003',title:'Final firewall segmentation validation',category:'Network / Firewall',priority:'High',status:'In Progress',owner:'Damiano / Network Vendor',requester:'Karen / Pietro',createdAt:'2026-09-02',updatedAt:'2026-09-06',nextAction:'Verify final WatchGuard topology, upstairs/basement segmentation and all traffic path',description:'Firewall work was coordinated, but additional hardware/segmentation follow-up remained open.'},
    {id:'REQ-0004',title:'VPN remote access validation from Italy',category:'Remote Access',priority:'High',status:'In Progress',owner:'Damiano / Italy IT',requester:'Pietro',createdAt:'2026-09-03',updatedAt:'2026-09-06',nextAction:'Retest VPN after network changes and document DNS/server dependencies',description:'Remote access is required for Italy-side support and may be linked to Prism name resolution.'},
    {id:'REQ-0005',title:'Credential ownership and legacy password cleanup',category:'Access Governance',priority:'Medium',status:'In Progress',owner:'Pietro / Damiano',requester:'Operations Hub',createdAt:'2026-09-06',updatedAt:'2026-09-06',nextAction:'Confirm owners, recovery contacts and review incomplete credential records',description:'Private credential vault now exists; ownership and recovery data still need company validation.'},
    {id:'REQ-0006',title:'Operations Hub production authentication',category:'Application / Access',priority:'High',status:'Not Started',owner:'Pietro',requester:'Operations Hub',createdAt:'2026-09-06',updatedAt:'2026-09-06',nextAction:'Create Google OAuth Web Client and deploy Apps Script',description:'Code is prepared for Google Sign-In, Pending approval and Sheet-based role enforcement; external Google setup is still required.'},
    {id:'REQ-0007',title:'Automation mini-PC and UPS requirements',category:'Infrastructure / Automation',priority:'Medium',status:'Planned',owner:'Pietro / Damiano',requester:'Operations Improvement',createdAt:'2026-09-06',updatedAt:'2026-09-06',nextAction:'Define workload, UPS runtime, placement and recovery behavior',description:'Concept is at planning level only; hardware should follow actual load and operational requirements.'}
  ];

  const vendors=[
    {id:'VEN-0001',name:'eMazzanti',service:'Network / IT vendor',contact:'US Support / Dillon',status:'Active',nextAction:'Close segmentation/hardware/Wi‑Fi follow-up and confirm final network baseline'},
    {id:'VEN-0002',name:'Spectrum',service:'Primary ISP',contact:'Business Support',status:'Active',nextAction:'Document support/escalation path and confirm service ownership'},
    {id:'VEN-0003',name:'Verizon',service:'Secondary / portable connectivity',contact:'Business Support',status:'Review',nextAction:'Document that current direction does not require automatic ISP failover'},
    {id:'VEN-0004',name:'Retail Pro Support',service:'Retail Pro Prism application support',contact:'Application Support',status:'Active',nextAction:'Document escalation process after DNS/VPN ownership is validated'},
    {id:'VEN-0005',name:'Deda Group / Italy IT support',service:'Italy-side systems / remote support coordination',contact:'Damiano / assigned technical contacts',status:'Active',nextAction:'Clarify ownership boundaries for VPN, Prism and remote support'},
    {id:'VEN-0006',name:'Onsite Hardware Support',service:'Store hardware replacement / onsite coordination',contact:'Harvey / assigned onsite tech',status:'Active',nextAction:'Use for approved hardware scope; record technology limitations before scheduling'}
  ];

  const systems=[
    {id:'SYS-0001',name:'Retail Pro Prism',owner:'Damiano / Italy IT',vendor:'Retail Pro Support',status:'Needs Validation',credentialLocation:'Private credential vault / IT-controlled storage'},
    {id:'SYS-0002',name:'WatchGuard Firewall',owner:'Italy IT',vendor:'eMazzanti / assigned network specialist',status:'Implementation / Validation',credentialLocation:'Private credential vault / IT-controlled storage'},
    {id:'SYS-0003',name:'Spectrum Internet',owner:'Store / Corporate',vendor:'Spectrum',status:'Operational',credentialLocation:'Private credential vault / corporate account'},
    {id:'SYS-0004',name:'Verizon Connectivity',owner:'Store / Corporate',vendor:'Verizon',status:'Operational / Non-failover',credentialLocation:'Private credential vault / corporate account'},
    {id:'SYS-0005',name:'Store Wi‑Fi (IBUSA / Guest)',owner:'Italy IT',vendor:'Network vendor',status:'Needs Coverage Validation',credentialLocation:'Private credential vault'},
    {id:'SYS-0006',name:'VPN / Remote Access',owner:'Damiano / Italy IT',vendor:'Italy IT / network vendor',status:'Needs Validation',credentialLocation:'Private credential vault'},
    {id:'SYS-0007',name:'Remote Support Tools (TeamViewer / AnyDesk)',owner:'Store / IT',vendor:'Internal / application vendors',status:'Operational / Review',credentialLocation:'Private credential vault'},
    {id:'SYS-0008',name:'NYC Operations Hub',owner:'Pietro / future company owner',vendor:'Internal',status:'Prototype / Production Auth Pending',credentialLocation:'Google identity + Sheet-based roles'}
  ];

  const decisions=[
    {id:'DEC-0001',title:'Confirm final network segmentation approach',owner:'Damiano / Network Vendor',status:'Required',due:'2026-09-09'},
    {id:'DEC-0002',title:'Approve upstairs AP requirement and placement',owner:'Damiano / Pietro',status:'Required after assessment',due:'2026-09-16'},
    {id:'DEC-0003',title:'Spectrum primary / Verizon backup policy',owner:'Damiano',status:'Decided — no automatic failover required currently',due:'2026-09-04'},
    {id:'DEC-0004',title:'Credential storage standard / password manager policy',owner:'Damiano / Management',status:'Required',due:'2026-09-30'},
    {id:'DEC-0005',title:'Operations Hub production owner and Google Workspace location',owner:'Management / Pietro',status:'Planned',due:'2026-09-30'},
    {id:'DEC-0006',title:'Automation mini-PC and UPS sizing / procurement',owner:'Pietro / Damiano',status:'Planned',due:'2026-10-05'},
    {id:'DEC-0007',title:'Physical security testing schedule',owner:'Management',status:'Deferred / Planned',due:'2026-11-01'}
  ];

  const improvements=[
    {id:'IMP-0001',title:'Centralize vendor requests and appointments',type:'Process',priority:'High',status:'In Progress — Hub'},
    {id:'IMP-0002',title:'Automated weekly PM summary',type:'Automation',priority:'Medium',status:'Candidate'},
    {id:'IMP-0003',title:'Inventory workflow automation',type:'AI / Automation',priority:'Medium',status:'Discovery'},
    {id:'IMP-0004',title:'Wi‑Fi / connectivity health monitoring',type:'Monitoring',priority:'Medium',status:'Backlog — after stabilization'},
    {id:'IMP-0005',title:'Issue and ticket workflow with notifications',type:'Process / Automation',priority:'High',status:'In Progress — Hub'},
    {id:'IMP-0006',title:'Credential review and access audit',type:'Governance',priority:'High',status:'In Progress'},
    {id:'IMP-0007',title:'Asset lifecycle and support ownership register',type:'Governance',priority:'Medium',status:'In Progress'}
  ];

  const milestones=[
    {date:'Sep 2',title:'Onsite firewall & hardware coordination',detail:'Firewall installation/hardware work coordinated with store and vendors.',status:'done'},
    {date:'Sep 3',title:'Segmentation hardware escalation',detail:'Additional firewall hardware requested for upstairs/basement segmentation; Wi‑Fi instability remained.',status:'open'},
    {date:'Sep 3',title:'Retail Pro Prism diagnostic',detail:'DNS resolution and VPN path investigated; port 8081 dependency reviewed.',status:'open'},
    {date:'Sep 4',title:'PM operating model defined',detail:'Local PM role framed around coordination, vendor management, documentation, process improvement and reporting.',status:'done'},
    {date:'Sep 5',title:'Operations Hub baseline established',detail:'Role-based Store Manager, PM and Management views created.',status:'done'},
    {date:'Sep 6',title:'Pass, private vault & auth architecture',detail:'Credential vault, Pass workspace, role model and Google Sign-In architecture prepared.',status:'done'},
    {date:'Next',title:'Google Auth + Apps Script production connection',detail:'Create Web OAuth client, deploy backend and validate Pending → Approve → role enforcement.',status:'future'},
    {date:'Next',title:'Automation node & UPS design',detail:'Define mini-PC workload, UPS runtime, placement and recovery behavior before procurement.',status:'future'}
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

  document.addEventListener('DOMContentLoaded',()=>waitForCore().then(initRoadmap).catch(console.error));

  function waitForCore(){return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{n++;try{if(typeof App!=='undefined'&&App.data&&typeof renderPage==='function'&&typeof renderNav==='function'){clearInterval(t);resolve();return}}catch(e){}if(n>180){clearInterval(t);reject(new Error('Roadmap could not initialize'))}},50)})}

  function initRoadmap(){
    applyDemoBaseline();
    addRoadmapNavigation();
    patchRouting();
    renderNav();
    if(typeof render==='function')render();
  }

  function applyDemoBaseline(){
    if(window.IB_CONFIG?.dataMode!=='demo')return;
    const baseline={projects,requests,vendors,systems,decisions,improvements};
    Object.entries(baseline).forEach(([key,rows])=>{App.data[key]=mergeBaseline(rows,App.data[key]||[])});
    try{
      const key='ib_nyc_ops_demo_v03';
      const stored=JSON.parse(localStorage.getItem(key)||'{}');
      Object.entries(baseline).forEach(([k,rows])=>stored[k]=mergeBaseline(rows,stored[k]||[]));
      localStorage.setItem(key,JSON.stringify(stored));
    }catch(e){}
  }

  function mergeBaseline(base,current){
    const ids=new Set(base.map(x=>x.id));
    return [...base,...current.filter(x=>x?.id&&!ids.has(x.id))];
  }

  function addRoadmapNavigation(){
    ['project_manager','management'].forEach(role=>{
      const list=App.nav[role];if(!list||list.some(x=>x[0]==='roadmap'))return;
      const anchor=list.findIndex(x=>x[0]==='dashboard');
      list.splice(anchor>=0?anchor+1:0,0,['roadmap','◆','Roadmap']);
    });
  }

  function patchRouting(){
    const previous=renderPage;
    renderPage=function(){
      if(window.IB_CONFIG?.dataMode==='demo')applyDemoBaseline();
      if(App.page==='roadmap'){renderRoadmap();return;}
      previous();
    };
  }

  function renderRoadmap(){
    const root=q('#pageRoot');if(!root)return;
    const active=projects.filter(p=>p.status==='In Progress').length;
    const planned=projects.filter(p=>p.status==='Not Started').length;
    const highOpen=requests.filter(r=>r.priority==='High'&&!['Resolved','Closed'].includes(r.status)).length;
    root.innerHTML=`${pageHead('NYC Transformation Roadmap','A reconstructed baseline of what has already happened, what is still open, and what comes next.','PROGRAM BASELINE')}
      <div class="roadmap-shell">
        <section class="roadmap-banner">
          <div><div class="eyebrow">RECONSTRUCTED FROM PROJECT HISTORY</div><h2>One operating picture for the entire NYC workstream.</h2><p>This baseline consolidates the known network, Retail Pro, vendor, access, Operations Hub, process-improvement, UPS/automation and security work into a single program view. Items that have not been technically validated are deliberately marked as open, planned or needs validation rather than completed.</p></div>
          <div class="roadmap-asof"><span>Baseline as of</span><strong>September 6, 2026</strong><small>Built from current project coordination history and the Operations Hub database.</small></div>
        </section>
        <div class="roadmap-kpis">
          <div class="roadmap-kpi"><strong>${projects.length}</strong><span>Defined projects</span><small>Infrastructure, retail, governance, automation and security.</small></div>
          <div class="roadmap-kpi"><strong>${active}</strong><span>Active workstreams</span><small>Currently being coordinated or validated.</small></div>
          <div class="roadmap-kpi"><strong>${highOpen}</strong><span>High-priority open items</span><small>Network, Prism, Wi‑Fi, VPN and production auth.</small></div>
          <div class="roadmap-kpi"><strong>${planned}</strong><span>Planned projects</span><small>Workflow mapping, UPS/automation, monitoring and physical security.</small></div>
        </div>
        <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Program Phases</h3><p>From emergency stabilization to continuous improvement.</p></div><span class="pill in-progress">3 active phases</span></div><div class="phase-grid">${phases.map(phaseCard).join('')}</div></section>
        <div class="roadmap-columns">
          <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Open Now</h3><p>Items that should be visible in every status review.</p></div></div><div class="status-list">${openItems.map(x=>statusItem(x[0],x[1],x[2],'open')).join('')}</div></section>
          <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Next 30–60 Days</h3><p>Planned work after the current baseline is stable.</p></div></div><div class="status-list">${nextItems.map(x=>statusItem(x[0],x[1],'Next','next')).join('')}</div></section>
        </div>
        <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Project Portfolio</h3><p>Click any project to open the detailed project card.</p></div><button class="btn" data-go="projects">Open Projects</button></div><div class="roadmap-projects">${projects.map(projectCard).join('')}</div></section>
        <section class="roadmap-section"><div class="roadmap-section-head"><div><h3>Milestones & Evidence Trail</h3><p>A concise chronology of the baseline already established.</p></div></div><div class="milestone-list">${milestones.map(milestone).join('')}</div></section>
        <div class="baseline-note"><strong>Important:</strong> this is a management baseline, not a claim that every technical item is resolved. Network segmentation, VPN/DNS, Prism connectivity, upstairs Wi‑Fi, production authentication, UPS sizing and physical-security testing remain explicitly open until validated by the responsible owner/vendor.</div>
      </div>`;
    wireRoadmap();
  }

  function phaseCard(p){const c=slug(p.status);return `<article class="phase-card ${c}"><div class="phase-top"><span class="phase-id">${safe(p.id)} · ${safe(p.period)}</span><span class="phase-status ${c}">${safe(p.status)}</span></div><h4>${safe(p.name)}</h4><p>${safe(p.objective)}</p><div class="phase-next"><span>Next action</span><strong>${safe(p.next)}</strong></div></article>`}
  function statusItem(title,detail,tag,type){return `<div class="status-item"><span class="status-marker ${type}"></span><div class="status-main"><strong>${safe(title)}</strong><span>${safe(detail)}</span></div><span class="status-tag">${safe(tag)}</span></div>`}
  function projectCard(p){return `<article class="roadmap-project" data-roadmap-project="${safe(p.id)}" tabindex="0" role="button"><div class="roadmap-project-top"><span class="phase-id">${safe(p.id)} · ${safe(p.scope)}</span><span class="pill ${slug(p.priority)}">${safe(p.priority)}</span></div><h4>${safe(p.name)}</h4><p>${safe(p.description)}</p><div class="roadmap-next"><b>Next:</b> ${safe(p.nextAction)}</div></article>`}
  function milestone(m){return `<div class="milestone ${m.status==='future'?'future':''}"><div class="milestone-date">${safe(m.date)}</div><div class="milestone-track"><div class="milestone-dot"></div></div><div class="milestone-body"><strong>${safe(m.title)}</strong><p>${safe(m.detail)}</p></div></div>`}
  function slug(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

  function wireRoadmap(){
    qa('[data-go]').forEach(b=>b.onclick=()=>{App.page=b.dataset.go;render()});
    qa('[data-roadmap-project]').forEach(el=>{
      const open=()=>{
        const id=el.dataset.roadmapProject;
        App.page='projects';render();
        setTimeout(()=>{const row=q(`[data-project-id="${id}"]`);if(row)row.click();else{const card=qa('.kanban-card').find(x=>x.dataset.projectId===id);card?.click()}},50);
      };
      el.onclick=open;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}};
    });
  }
})();
