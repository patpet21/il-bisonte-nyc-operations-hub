/* Primary PM dashboard renderer.
   Installed synchronously so the legacy dashboard can never flash before the new UI layer initializes. */
(function(){
  if(typeof App==='undefined'||typeof renderPMDashboard!=='function')return;
  if(window.__IB_PRIMARY_DASHBOARD_INSTALLED)return;
  window.__IB_PRIMARY_DASHBOARD_INSTALLED=true;

  const safe=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const CLOSED=new Set(['completed','closed','resolved','cancelled','canceled']);

  function quickLink(title,sub,page){return `<button class="hub-quick-link" data-hub-go="${safe(page)}"><span><strong>${safe(title)}</strong><small>${safe(sub)}</small></span><b aria-hidden="true">→</b></button>`}
  function summary(value,label,detail){return `<div class="hub-summary-item"><span>${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(detail)}</small></div>`}
  function sectionHead(title,sub='',action='',page=''){return `<div class="hub-section-head"><div><h2>${safe(title)}</h2>${sub?`<p>${safe(sub)}</p>`:''}</div>${action&&page?`<button class="hub-section-action" data-hub-go="${safe(page)}">${safe(action)} →</button>`:''}</div>`}
  function hubRow(x){const tone=String(x.tone||'').toLowerCase().replace(/\s+/g,'-');return `<li class="hub-row" data-hub-go="${safe(x.page||'')}" ${x.projectId?`data-project-id="${safe(x.projectId)}"`:''}><div class="hub-row-main"><div class="hub-row-title">${safe(x.title)}</div><div class="hub-row-sub">${safe(x.sub||'')}</div></div><div class="hub-row-meta"><span class="hub-priority"><i class="hub-priority-dot ${safe(tone)}"></i>${safe(x.meta||'')}</span></div></li>`}
  function hubLink(title,sub,page){return `<button class="hub-link" data-hub-go="${safe(page)}"><strong>${safe(title)}</strong><span>${safe(sub)}</span></button>`}
  function bindOverview(root){
    [...root.querySelectorAll('[data-hub-go]')].forEach(el=>el.addEventListener('click',e=>{
      if(e.target.closest?.('[data-project-id]')&&e.currentTarget.dataset.projectId)return;
      const page=e.currentTarget.dataset.hubGo;if(!page)return;App.page=page;render();
    }));
  }

  function dateOnly(v){
    const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m)return null;
    return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  }
  function todayOnly(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function daysFromToday(v){const d=dateOnly(v);if(!d)return Number.POSITIVE_INFINITY;return Math.round((d-todayOnly())/86400000)}
  function dueLabel(v){
    const d=dateOnly(v);if(!d)return 'Date not set';
    const diff=daysFromToday(v);
    if(diff===0)return 'Today';
    if(diff===1)return 'Tomorrow';
    return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  }
  function timeFromText(v){const m=String(v||'').match(/\b(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)\b/i);return m?`${m[1]}:${m[2]} ${m[3].toUpperCase()}`:''}
  function activityDate(a){
    const raw=a.timestamp||a.date||a.when||a.at||'';
    if(!raw)return 0;
    const normalized=String(raw).match(/^\d{4}-\d{2}-\d{2} /)?String(raw).replace(' ','T'):String(raw);
    const t=new Date(normalized).getTime();
    return Number.isFinite(t)?t:0;
  }
  function activityLabel(a){
    const t=activityDate(a);if(!t)return a.date||a.timestamp||a.when||a.at||'';
    const d=new Date(t),now=new Date();
    const same=d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
    if(same)return `Today · ${d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}`;
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }

  function buildUpcoming(tasks){
    const open=tasks.filter(t=>!CLOSED.has(String(t.status||'').toLowerCase())&&daysFromToday(t.due)>=0&&daysFromToday(t.due)<=7).sort((a,b)=>daysFromToday(a.due)-daysFromToday(b.due));
    const rows=[];
    const consumed=new Set();
    const onsiteByDate=new Map();

    open.forEach(t=>{
      const text=`${t.status||''} ${t.notes||''} ${t.owner||''}`.toLowerCase();
      if(!text.includes('onsite'))return;
      const key=t.due||'';
      if(!onsiteByDate.has(key))onsiteByDate.set(key,[]);
      onsiteByDate.get(key).push(t);
    });

    [...onsiteByDate.entries()].sort((a,b)=>daysFromToday(a[0])-daysFromToday(b[0])).forEach(([due,group])=>{
      if(group.length<2)return;
      group.forEach(t=>consumed.add(t.id));
      const joined=group.map(t=>t.notes||'').join(' ');
      const time=timeFromText(joined);
      const vendor=group.some(t=>/emazzanti/i.test(`${t.owner||''} ${t.notes||''}`))?'eMazzanti onsite':'Onsite work';
      rows.push({
        title:vendor,
        sub:group.map(t=>t.title).join(' · '),
        meta:`${dueLabel(due)}${time?` · ${time}`:''}`,
        tone:'High',
        page:'projects'
      });
    });

    open.filter(t=>!consumed.has(t.id)).forEach(t=>{
      rows.push({
        title:t.title,
        sub:t.notes||t.owner||'Scheduled work',
        meta:dueLabel(t.due),
        tone:t.priority||t.status,
        page:'projects'
      });
    });

    return rows.slice(0,5);
  }

  const legacyPMDashboard=renderPMDashboard;
  renderPMDashboard=function(root){
    if(!['project_manager','it_admin'].includes(App.role))return legacyPMDashboard(root);

    const data=App.data||{};
    const projects=data.projects||[],requests=data.requests||[],tasks=data.tasks||[],vendors=data.vendors||[],systems=data.systems||[],activity=data.activity||[],improvements=data.improvements||[],decisions=data.decisions||[];
    const activeProjects=projects.filter(x=>!CLOSED.has(String(x.status||'').toLowerCase()));
    const openRequests=requests.filter(x=>!CLOSED.has(String(x.status||'').toLowerCase()));
    const vendorActions=vendors.filter(x=>String(x.nextAction||'').trim());
    const requiredDecisions=decisions.filter(x=>String(x.status||'').toLowerCase().includes('required'));
    const openImprovements=improvements.filter(x=>String(x.status||'').toLowerCase()!=='completed');
    const role=App.role==='it_admin'?'IT & Operations Overview':'Operations Overview';
    const subtitle='What is coming up, what needs action, and what changed recently.';

    const upcoming=buildUpcoming(tasks);
    const recentActivity=[...activity].sort((a,b)=>activityDate(b)-activityDate(a));

    const priorities=[
      ...openRequests.filter(x=>['Urgent','High'].includes(x.priority)).map(x=>({title:x.title,sub:x.nextAction||x.category,meta:`${x.priority} · ${x.owner||'Unassigned'}`,tone:x.priority,page:'requests'})),
      ...tasks.filter(t=>!CLOSED.has(String(t.status||'').toLowerCase())&&daysFromToday(t.due)<0&&['Urgent','High'].includes(t.priority)).map(t=>({title:t.title,sub:t.notes||t.owner,meta:`Overdue · ${t.owner||'Unassigned'}`,tone:'Urgent',page:'projects'})),
      ...activeProjects.filter(x=>['Urgent','High'].includes(x.priority)).map(x=>({title:x.name,sub:x.nextAction||x.scope,meta:`${x.status} · ${x.owner||'Unassigned'}`,tone:x.priority,page:'projects'}))
    ];
    const dedupPriorities=[];
    const seen=new Set();
    priorities.forEach(p=>{const k=`${p.title}|${p.sub}`;if(seen.has(k))return;seen.add(k);dedupPriorities.push(p)});
    if(!dedupPriorities.length){
      openRequests.slice(0,3).forEach(x=>dedupPriorities.push({title:x.title,sub:x.nextAction||x.category,meta:`${x.status} · ${x.owner||'Unassigned'}`,tone:x.priority,page:'requests'}));
    }

    root.innerHTML=pageHead(role,subtitle,'IL BISONTE NEW YORK')+`<div class="hub-overview hub-now-first">
      <section class="hub-section hub-upcoming">
        ${sectionHead('Upcoming','The next scheduled work and appointments.','Open projects','projects')}
        <div class="hub-section-body">${upcoming.length?`<ul class="hub-list">${upcoming.map(hubRow).join('')}</ul>`:'<div class="hub-empty">No scheduled work in the next 7 days.</div>'}</div>
      </section>

      <section class="hub-section hub-attention">
        ${sectionHead('Needs attention','Decisions, follow-ups and overdue high-priority work.','View all issues','requests')}
        <div class="hub-section-body">${dedupPriorities.length?`<ul class="hub-list">${dedupPriorities.slice(0,5).map(hubRow).join('')}</ul>`:'<div class="hub-empty">Nothing currently needs special attention.</div>'}</div>
      </section>

      <section class="hub-section hub-latest">
        ${sectionHead('Latest updates','The most recent operational changes and confirmations.','Open activity','activity')}
        <div class="hub-section-body">${recentActivity.length?`<ul class="hub-list">${recentActivity.slice(0,5).map(a=>hubRow({title:a.action||a.title||a.description||a.text||'Activity',sub:a.details||a.detail||a.description||a.notes||a.text||'',meta:activityLabel(a),tone:'',page:'activity'})).join('')}</ul>`:'<div class="hub-empty">No recent activity.</div>'}</div>
      </section>

      <nav class="hub-quickbar" aria-label="Quick routes">
        ${quickLink('Store status','Health & service status','store_health')}
        ${quickLink('Issues','Open requests & problems','requests')}
        ${quickLink('Projects','Current work & next steps','projects')}
        ${quickLink('Peter work','Hours, activity & billing','pmworklog')}
      </nav>

      <div class="hub-summary-strip">
        ${summary(activeProjects.length,'Active projects','Project work currently moving')}
        ${summary(openRequests.length,'Open issues & requests','Items still needing action')}
        ${summary(vendorActions.length,'Vendor follow-ups','External actions still open')}
        ${summary(activity.length,'Activity records','Operational history available')}
      </div>

      <div class="hub-two-col">
        <section class="hub-section">
          ${sectionHead('Projects','Current work, status and next step without opening the full project workspace.','Open projects','projects')}
          <div class="hub-section-body">${activeProjects.length?`<ul class="hub-list">${activeProjects.slice(0,6).map(p=>hubRow({title:p.name,sub:p.nextAction||p.scope,meta:`${p.status} · ${p.owner||'Unassigned'}`,tone:p.priority,page:'projects',projectId:p.id})).join('')}</ul>`:'<div class="hub-empty">No active projects.</div>'}</div>
        </section>

        <section class="hub-section">
          ${sectionHead('Issues & Requests','What is open, who owns it and what happens next.','Open register','requests')}
          <div class="hub-section-body">${openRequests.length?`<ul class="hub-list">${openRequests.slice(0,6).map(r=>hubRow({title:r.title,sub:r.nextAction||r.category,meta:`${r.status} · ${r.owner||'Unassigned'}`,tone:r.priority,page:'requests'})).join('')}</ul>`:'<div class="hub-empty">No open issues or requests.</div>'}</div>
        </section>
      </div>

      <section class="hub-section">
        ${sectionHead('Store, IT & vendors','A compact operating picture. Details remain in their dedicated workspaces.')}
        <div class="hub-section-body">
          <div class="hub-three-col">
            <div>
              <div class="eyebrow" style="margin-top:16px">SYSTEMS</div>
              <ul class="hub-list">${systems.slice(0,4).map(s=>hubRow({title:s.name,sub:`${s.vendor||'Internal'} · ${s.owner||'Owner not set'}`,meta:s.status||'—',tone:s.status,page:'systems'})).join('')||'<li class="hub-empty">No systems recorded.</li>'}</ul>
            </div>
            <div>
              <div class="eyebrow" style="margin-top:16px">VENDOR COORDINATION</div>
              <ul class="hub-list">${vendorActions.slice(0,4).map(v=>hubRow({title:v.name,sub:v.nextAction||v.service,meta:v.status||'—',tone:v.status,page:'vendors'})).join('')||'<li class="hub-empty">No vendor follow-up currently open.</li>'}</ul>
            </div>
            <div>
              <div class="eyebrow" style="margin-top:16px">RECENT ACTIVITY</div>
              <ul class="hub-list">${recentActivity.slice(0,4).map(a=>hubRow({title:a.action||a.title||a.description||a.text||'Activity',sub:a.details||a.detail||a.description||a.notes||a.text||'',meta:activityLabel(a),tone:'',page:'activity'})).join('')||'<li class="hub-empty">No recent activity.</li>'}</ul>
            </div>
          </div>
        </div>
      </section>

      <section class="hub-section">
        ${sectionHead('All tools','Every capability remains available here.')}
        <div class="hub-links">
          ${hubLink('Store Health','Current store service status','store_health')}
          ${hubLink('Purchases & Visits','Hardware, invoices and onsite work','purchases_visits')}
          ${hubLink('Systems','Infrastructure and application register','systems')}
          ${hubLink('Pass & Access','Credentials and access workspace','pass')}
          ${hubLink('Peter Work Tracking','Time, activities, billing and records','pmworklog')}
          ${hubLink('Roadmap','Phases, dependencies and next steps','roadmap')}
          ${hubLink('SOP Library','Store procedures and repeatable actions','sops')}
          ${hubLink('Process Improvement',`${openImprovements.length} open improvement items`,'improvements')}
          ${hubLink('Decisions',`${requiredDecisions.length} currently require a decision`,'decisions')}
          ${hubLink('Vendors',`${vendorActions.length} follow-ups currently open`,'vendors')}
          ${hubLink('Activity Log','Full history and audit trail','activity')}
          ${hubLink('Projects','Open complete project portfolio','projects')}
        </div>
      </section>
    </div>`;

    bindOverview(root);
  };
})();
