(function(){
  if(typeof App==='undefined')return;

  const PAGE_ID='emazzanti';
  const MEETING_URL='https://teams.microsoft.com/l/meeting/details?eventId=AQMkAGJhNzhmNWU5LWM4ZDUtNDhlMy04YWUyLWNmNmI3YzIzMmEwMwBGAAADafABoNShC0Wbwfbv1DzPJQcA8ZDZZEHf_kCqrCMZgMQhawAAAgENAAAA43mVX02NqEmku5QKtas99AAHZ8oU_QAAAA%3d%3d&EntityRepresentationId=7e052395-ad73-402b-9d4b-7756dc055991';

  const offer={
    status:'Equipment ordered / Awaiting delivery',
    meetingDate:'September 7, 2026',
    objective:'Evaluate eMazzanti Technologies as a structured local managed IT partner for the Il Bisonte New York store, with proactive support, infrastructure stabilization and a scalable U.S. operating model.',
    contacts:[
      ['Nirvan L. Ramoutar','Commercial coordination / follow-up with Pietro'],
      ['Nadege Konyn','eMazzanti representative / managed services presentation'],
      ["Dylan E. D'Souza",'Prior technical observations / preliminary assessment']
    ],
    needs:[
      ['Reliable local IT partner','Replace the current fragmented support model with a clear technical point of contact and escalation path.'],
      ['Network & cabling review','Assess the existing topology, cabling, layered configurations, documentation gaps and rationalization opportunities.'],
      ['Wi-Fi coverage','Assess weak coverage and determine the correct additional Access Point requirement and placement.'],
      ['WatchGuard audit','Review configuration, security policies, potentially unnecessary open ports, firmware and best-practice alignment.'],
      ['Asset visibility','Inventory PCs and network devices, document usage, function, configuration and update status.'],
      ['Updates & maintenance','Keep supported operating systems and network equipment maintained and current.'],
      ['Proactive monitoring','Detect device or system anomalies before they become store-impacting incidents.'],
      ['After-hours coverage','Cover the New York operating window that extends beyond the normal Italy / RetPro support window.'],
      ['Store staff support','Give sales staff a simple, reliable technical support path so they can stay focused on store operations and sales.']
    ],
    capabilities:[
      ['Local NYC-area presence','eMazzanti stated that it operates from Hoboken, New Jersey, with nearly 50 specialized engineers and onsite capability in the New York area.'],
      ['24/7 support','Support coverage presented as available around the clock, including nights, weekends and holidays.'],
      ['Monitoring agent','Agent-based monitoring was presented for Microsoft updates, system-health monitoring, automated alerts and remote intervention.'],
      ['Hardware provisioning','eMazzanti can provide replacement/new PCs, preconfigure them, install required software and prepare devices before delivery.'],
      ['WatchGuard specialization','eMazzanti stated that it is a Gold WatchGuard partner and can audit, optimize and support the existing firewall.'],
      ['Authorized distribution sourcing','For the current hardware order, eMazzanti is sourcing equipment through Ingram Micro, an authorized U.S. distributor, rather than Amazon because serial-number eligibility can affect WatchGuard support.'],
      ['U.S. store scalability','The proposed model is intended to create a repeatable infrastructure/support baseline for possible future U.S. stores.']
    ],
    assessment:[
      'Full network and cabling review',
      'WatchGuard firewall configuration and security audit',
      'Access Point and Wi-Fi coverage assessment',
      'Inventory of store computers and relevant hardware',
      'Review of operational configurations and maintenance status',
      'Prioritized findings and remediation recommendations',
      'Future managed monitoring / support operating model'
    ],
    businessContext:[
      'New York is currently Il Bisonte’s only directly operated U.S. store.',
      'A second U.S. location is under evaluation, but cost discipline is a major constraint.',
      'Damiano supports the store from Florence, creating a time-zone support gap during the New York business day.',
      'The store team should not be expected to perform advanced technical troubleshooting.',
      'Any managed-service model needs to remain proportionate to the size and operational needs of the NYC store.'
    ],
    procurement:[
      ['Delivery status','Sep 10: Nirvan reported a delay in the equipment delivery and said he is hopeful the hardware will arrive before the weekend.'],
      ['Supplier','Ingram Micro — major authorized U.S. distributor used by eMazzanti for this equipment order.'],
      ['Procurement rationale','eMazzanti prefers not to source this hardware through Amazon because serial numbers can occasionally be blacklisted, which may prevent WatchGuard from providing support.'],
      ['Next action','Confirm the actual delivery date, then coordinate the WatchGuard / Access Point installation schedule.']
    ],
    commercial:[
      ['Quote','eMT-041859 · Version 1 · created Sep 7, 2026 · expires Oct 5, 2026'],
      ['Firewall / Router','1 × Premium Network Management — $150/month'],
      ['Access Points','2 × Premium Network Management — $80/month total'],
      ['Desktops','2 × Premium Network Management — $110/month total'],
      ['Recurring total','$340/month before any applicable taxes, shipping, handling or other fees']
    ],
    pending:[
      ['Final SLA','The final contractual response / resolution-time commitments should be confirmed against the executed service documents.'],
      ['MSA execution','An MSA has been supplied, but the workspace does not currently record whether it has been fully executed by both parties.'],
      ['Detailed operational scope','Confirm exactly which remediation, installation and onsite activities are included versus separately billable work.']
    ]
  };

  function addNav(role){
    const nav=App.nav?.[role];
    if(!Array.isArray(nav)||nav.some(x=>x[0]===PAGE_ID))return;
    const item=[PAGE_ID,'◈','eMazzanti'];
    const vendorIndex=nav.findIndex(x=>x[0]==='vendors');
    if(vendorIndex>=0)nav.splice(vendorIndex+1,0,item);else nav.push(item);
  }
  ['project_manager','management','it_admin'].forEach(addNav);

  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const statusClass=status=>/completed|done|closed/i.test(status)?'done':/progress|active|assessment|ordered|awaiting/i.test(status)?'progress':/pending|vendor|review/i.test(status)?'pending':'planned';

  function head(){
    if(typeof pageHead==='function')return pageHead('eMazzanti Technologies','Managed IT status, equipment procurement, recurring services and open actions.','MANAGED IT PARTNER');
    return '<div class="page-head"><div><div class="eyebrow">MANAGED IT PARTNER</div><h1 class="page-title">eMazzanti Technologies</h1><p class="page-subtitle">Managed IT status, equipment procurement, recurring services and open actions.</p></div></div>';
  }

  function cards(rows){return `<div class="emz-card-grid">${rows.map(([title,text])=>`<article class="emz-card"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p></article>`).join('')}</div>`;}
  function bullets(items){return `<ul class="emz-list">${items.map(x=>`<li><span>✓</span><div>${escapeHtml(x)}</div></li>`).join('')}</ul>`;}

  function actionRows(){
    const live=(App.data?.tasks||[]).filter(t=>String(t.projectId)==='PRJ-0012');
    const fallback=[
      {id:'TSK-0031',title:'Schedule technical deep-dive and onsite assessment',owner:'Pietro / Nirvan',status:'In Progress',due:'2026-09-11'},
      {id:'TSK-0032',title:'Complete network, cabling, Wi-Fi and device assessment',owner:'eMazzanti / Pietro',status:'Not Started',due:'2026-09-18'},
      {id:'TSK-0033',title:'Perform WatchGuard security and configuration audit',owner:'eMazzanti / Damiano',status:'Not Started',due:'2026-09-18'},
      {id:'TSK-0034',title:'Define monitoring, patching, 24/7 support and escalation model',owner:'eMazzanti / Pietro / Damiano',status:'Not Started',due:'2026-09-23'},
      {id:'TSK-0035',title:'Review findings, remediation priorities, SLA and commercial proposal',owner:'Pietro / Damiano',status:'Not Started',due:'2026-09-30'},
      {id:'TSK-0036',title:'Confirm delayed equipment delivery and coordinate WatchGuard / AP installation',owner:'Nirvan / Pietro',status:'In Progress',due:'2026-09-11'}
    ];
    const rows=live.length?live:fallback;
    return `<div class="emz-action-table">${rows.map(t=>`<div class="emz-action-row"><div class="emz-action-main"><strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.id)} · Owner: ${escapeHtml(t.owner||'')}</span></div><div class="emz-action-meta"><span class="emz-status ${statusClass(t.status)}">${escapeHtml(t.status||'Not Started')}</span><small>${escapeHtml(t.due||t.dueDate||'')}</small></div></div>`).join('')}</div>`;
  }

  function contacts(){return `<div class="emz-contact-grid">${offer.contacts.map(([name,role])=>`<div class="emz-contact"><div class="emz-contact-avatar">${escapeHtml(name.split(/\s+/).map(x=>x[0]).slice(0,2).join(''))}</div><div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(role)}</span></div></div>`).join('')}</div>`;}

  function renderEmazzanti(root){
    if(!root)return;
    const vendor=(App.data?.vendors||[]).find(v=>String(v.id)==='VEN-0001');
    const project=(App.data?.projects||[]).find(p=>String(p.id)==='PRJ-0012');
    root.innerHTML=head()+`
      <section class="emz-hero"><div><div class="emz-kicker">CURRENT STATUS</div><h2>${escapeHtml(offer.status)}</h2><p>${escapeHtml(offer.objective)}</p><div class="emz-hero-actions"><a class="btn" href="${MEETING_URL}" target="_blank" rel="noopener noreferrer">Open meeting reference ↗</a><button class="btn" id="emzOpenProject">Open linked project</button></div></div><div class="emz-summary"><div><span>Meeting</span><strong>${escapeHtml(offer.meetingDate)}</strong></div><div><span>Project</span><strong>PRJ-0012</strong></div><div><span>Vendor status</span><strong>${escapeHtml(vendor?.status||offer.status)}</strong></div><div><span>Supplier</span><strong>${escapeHtml(vendor?.supplier||'Ingram Micro')}</strong></div></div></section>
      <section class="panel emz-section"><div class="panel-head"><div><div class="emz-kicker">PROCUREMENT UPDATE · SEP 10</div><h3>Equipment delivery & sourcing</h3></div><span class="emz-warning">Delivery delayed</span></div>${cards(offer.procurement)}</section>
      <section class="panel emz-section"><div class="panel-head"><div><div class="emz-kicker">WHY THIS IS BEING EVALUATED</div><h3>Current NYC IT needs</h3></div><span class="emz-source">Confirmed from meeting recap</span></div>${cards(offer.needs)}</section>
      <section class="panel emz-section"><div class="panel-head"><div><div class="emz-kicker">PROPOSED SERVICE MODEL</div><h3>What eMazzanti says it can provide</h3></div><span class="emz-source">Meeting + procurement follow-up</span></div>${cards(offer.capabilities)}</section>
      <div class="emz-two-col"><section class="panel emz-section"><div class="emz-kicker">TECHNICAL ASSESSMENT</div><h3>Scope to be reviewed</h3>${bullets(offer.assessment)}</section><section class="panel emz-section"><div class="emz-kicker">BUSINESS CONTEXT</div><h3>Constraints the proposal must respect</h3>${bullets(offer.businessContext)}</section></div>
      <section class="panel emz-section"><div class="panel-head"><div><div class="emz-kicker">OPEN ACTIONS</div><h3>Assessment, delivery & implementation workstream</h3></div><span class="emz-source">Linked to PRJ-0012</span></div>${actionRows()}${project?`<div class="emz-next"><strong>Current project next action</strong><span>${escapeHtml(project.nextAction||'')}</span></div>`:''}</section>
      <section class="panel emz-section emz-commercial"><div class="panel-head"><div><div class="emz-kicker">COMMERCIAL</div><h3>Recurring managed-services quote</h3></div><span class="emz-source">Quote eMT-041859</span></div>${cards(offer.commercial)}<div class="emz-callout"><strong>Quoted recurring total</strong><span>$340/month. The quote notes that taxes, shipping, handling and other fees may apply.</span></div></section>
      <section class="panel emz-section emz-commercial"><div class="panel-head"><div><div class="emz-kicker">CONTRACT / SCOPE CHECK</div><h3>Items still to confirm operationally</h3></div><span class="emz-warning">Review required</span></div>${cards(offer.pending)}</section>
      <section class="panel emz-section"><div class="panel-head"><div><div class="emz-kicker">KEY CONTACTS</div><h3>eMazzanti coordination</h3></div></div>${contacts()}<div class="emz-note">Nirvan remains the commercial and procurement coordination point. Pietro is the local operational contact for follow-up, with Damiano representing Italy-side IT requirements and decisions.</div></section>
      <div class="footer-note">eMazzanti workspace — updated from the September 7 meeting recap, quote eMT-041859 and Nirvan’s September 10 equipment-delivery email. Procurement statements are recorded as vendor-provided information.</div>`;
    const open=document.querySelector('#emzOpenProject');if(open)open.onclick=()=>{App.page='projects';if(typeof render==='function')render();};
  }

  if(typeof renderPage==='function'){
    const baseRenderPage=renderPage;
    renderPage=function(){if(App.page===PAGE_ID)return renderEmazzanti(document.querySelector('#pageRoot'));return baseRenderPage();};
  }

  try{if(typeof renderNav==='function')renderNav();if(App.page===PAGE_ID&&typeof renderPage==='function')renderPage();}catch(e){}
})();