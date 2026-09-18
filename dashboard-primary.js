/* Primary scan-first PM / IT overview. */
(function(){
  if(typeof App==='undefined'||typeof renderPMDashboard!=='function')return;
  if(window.__IB_PRIMARY_DASHBOARD_V2_INSTALLED)return;
  window.__IB_PRIMARY_DASHBOARD_V2_INSTALLED=true;

  const safe=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const CLOSED=new Set(['completed','closed','resolved','cancelled','canceled']);

  const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const closed=x=>CLOSED.has(String(x?.status||'').toLowerCase());
  const num=v=>{const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};

  function dateOnly(v){
    const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m)return null;
    return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  }
  function todayOnly(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function daysFromToday(v){const d=dateOnly(v);if(!d)return Number.POSITIVE_INFINITY;return Math.round((d-todayOnly())/86400000)}
  function dueLabel(v){
    const d=dateOnly(v);if(!d)return 'No date';
    const n=daysFromToday(v);if(n===0)return'Today';if(n===1)return'Tomorrow';if(n<0)return`${Math.abs(n)}d overdue`;
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }
  function activityDate(a){
    const raw=a.timestamp||a.date||a.when||a.at||a.createdAt||'';
    if(!raw)return 0;
    const normalized=String(raw).match(/^\d{4}-\d{2}-\d{2} /)?String(raw).replace(' ','T'):String(raw);
    const t=new Date(normalized).getTime();return Number.isFinite(t)?t:0;
  }
  function activityLabel(a){
    const t=activityDate(a);if(!t)return a.date||a.timestamp||a.when||a.at||'';
    const d=new Date(t),n=new Date();
    const same=d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();
    if(same)return d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }

  function kpi(icon,label,value,detail,page){
    return `<button class="hub-v2-kpi" data-page="${safe(page)}"><span class="hub-v2-kpi-icon">${icon}</span><span><span class="hub-v2-kpi-label">${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(detail)}</small></span><span class="hub-v2-kpi-arrow">›</span></button>`;
  }
  function pill(text,tone){return `<span class="hub-v2-pill ${safe(slug(tone||text))}">${safe(text)}</span>`}
  function miniRow(item){
    return `<div class="hub-v2-minirow" data-page="${safe(item.page||'')}"><div><strong>${safe(item.title)}</strong><small>${safe(item.sub||'')}</small></div>${pill(item.badge||item.meta||'Open',item.tone||item.badge||item.meta)}</div>`;
  }
  function sideRow(item){
    return `<li class="hub-v2-side-row" data-page="${safe(item.page||'')}"><div><strong>${safe(item.title)}</strong><small>${safe(item.sub||'')}</small></div><span class="hub-v2-side-meta">${safe(item.meta||'')}</span></li>`;
  }
  function quick(icon,title,sub,action,page){
    const attrs=action?`data-action="${safe(action)}"`:`data-page="${safe(page||'')}"`;
    return `<button ${attrs}><span class="hub-v2-quick-icon">${icon}</span><span><strong>${safe(title)}</strong><small>${safe(sub)}</small></span></button>`;
  }
  function tool(title,sub,page){return `<button class="hub-v2-tool" data-page="${safe(page)}"><strong>${safe(title)}</strong><small>${safe(sub)}</small></button>`}

  function projectTable(rows){
    if(!rows.length)return'<div class="hub-v2-empty">No active projects.</div>';
    return `<div class="table-wrap"><table class="hub-v2-table"><thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Owner</th><th>Target</th></tr></thead><tbody>${rows.map(p=>{
      const progress=Math.max(0,Math.min(100,num(p.progress)));
      return `<tr data-page="projects"><td><strong>${safe(p.name)}</strong><small>${safe(p.nextAction||p.scope||p.id)}</small></td><td>${pill(p.status||'Open',p.status)}</td><td><div class="hub-v2-progress"><span><i style="width:${progress}%"></i></span><b>${progress}%</b></div></td><td>${safe(p.owner||'—')}</td><td>${safe(dueLabel(p.due))}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function requestTable(rows){
    if(!rows.length)return'<div class="hub-v2-empty">No open requests.</div>';
    return `<div class="table-wrap"><table class="hub-v2-table"><thead><tr><th>Request</th><th>Priority</th><th>Status</th><th>Owner</th></tr></thead><tbody>${rows.map(r=>`<tr data-page="requests"><td><strong>${safe(r.title)}</strong><small>${safe(r.id||r.category||'')}</small></td><td>${pill(r.priority||'Normal',r.priority)}</td><td>${pill(r.status||'Open',r.status)}</td><td>${safe(r.owner||'—')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function bind(root){
    root.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>{
      const page=el.dataset.page;if(!page)return;App.page=page;render();
    }));
    root.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{
      const a=el.dataset.action;
      if(a==='new-request'&&typeof openRequestModal==='function')return openRequestModal('request');
      if(a==='log-work'){App.page='pmworklog';return render();}
      if(a==='retail'){App.page='retail_systems';return render();}
      if(a==='pass'){App.page='pass';return render();}
    }));
  }

  const legacyPMDashboard=renderPMDashboard;
  renderPMDashboard=function(root){
    if(!['project_manager','it_admin'].includes(App.role))return legacyPMDashboard(root);

    const d=App.data||{};
    const projects=d.projects||[],requests=d.requests||[],tasks=d.tasks||[],vendors=d.vendors||[],activity=d.activity||[];
    const activeProjects=projects.filter(x=>!closed(x));
    const openRequests=requests.filter(x=>!closed(x));
    const urgentRequests=openRequests.filter(x=>['urgent','high','critical'].includes(String(x.priority||'').toLowerCase()));
    const overdueHighTasks=tasks.filter(t=>!closed(t)&&daysFromToday(t.due)<0&&['urgent','high','critical'].includes(String(t.priority||'').toLowerCase()));
    const urgentItems=[
      ...urgentRequests.map(x=>({title:x.title,sub:x.nextAction||x.category||x.owner,badge:x.priority||'High',tone:x.priority,page:'requests'})),
      ...overdueHighTasks.map(x=>({title:x.title,sub:x.notes||x.owner,badge:'Overdue',tone:'overdue',page:'projects'}))
    ];

    const todayTasks=tasks.filter(t=>!closed(t)&&daysFromToday(t.due)===0);
    const upcomingTasks=tasks.filter(t=>!closed(t)&&daysFromToday(t.due)>0&&daysFromToday(t.due)<=7).sort((a,b)=>daysFromToday(a.due)-daysFromToday(b.due));
    const todayItems=(todayTasks.length?todayTasks:upcomingTasks).slice(0,4).map(t=>({
      title:t.title,sub:t.notes||t.owner||'Scheduled work',badge:todayTasks.length?'Today':dueLabel(t.due),tone:'today',page:'projects'
    }));

    const waitingRequests=openRequests.filter(r=>/pending|waiting|vendor/i.test(String(r.status||'')));
    const vendorActions=vendors.filter(v=>String(v.nextAction||'').trim());
    const waitingItems=[
      ...waitingRequests.map(r=>({title:r.title,sub:r.nextAction||r.owner||r.category,badge:'Waiting',tone:'waiting',page:'requests'})),
      ...vendorActions.map(v=>({title:v.name,sub:v.nextAction||v.service,badge:v.status||'Waiting',tone:'waiting',page:'vendors'}))
    ];
    const dedup=[];const seen=new Set();
    waitingItems.forEach(x=>{const k=x.title+'|'+x.sub;if(seen.has(k))return;seen.add(k);dedup.push(x)});

    const recent=[...activity].sort((a,b)=>activityDate(b)-activityDate(a)).slice(0,5).map(a=>({
      title:a.action||a.title||a.text||a.description||'Activity',
      sub:a.details||a.detail||a.description||a.notes||a.text||a.by||'',
      meta:activityLabel(a),page:'activity'
    }));

    const greeting=new Date().getHours()<12?'Good morning':new Date().getHours()<18?'Good afternoon':'Good evening';
    const todayText=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    const title=App.role==='it_admin'?'IT & Operations Overview':'Operations Overview';

    root.innerHTML=pageHead(title,'A clear control center for what needs action now, what is moving, and what is waiting.','IL BISONTE NEW YORK')+
    `<div class="hub-v2">
      <div class="hub-v2-top">
        <div class="hub-v2-greeting"><strong>${safe(todayText)}</strong><br>${safe(greeting)}.</div>
        <div class="hub-v2-actions">
          <button class="hub-v2-action primary" data-action="new-request">＋ New Request</button>
          <button class="hub-v2-action" data-action="log-work">◷ Log Work</button>
          <button class="hub-v2-action" data-action="retail">▣ Retail Systems</button>
        </div>
      </div>

      <div class="hub-v2-kpis">
        ${kpi('▤','Open Requests',openRequests.length,'Items still needing action','requests')}
        ${kpi('□','Active Projects',activeProjects.length,'Projects currently moving','projects')}
        ${kpi('!','Urgent Items',urgentItems.length,'High priority or overdue','requests')}
        ${kpi('◉','Vendor Follow-ups',vendorActions.length,'External actions still open','vendors')}
      </div>

      <nav class="hub-v2-tabs" aria-label="Overview sections">
        <button class="hub-v2-tab active">Overview</button>
        <button class="hub-v2-tab" data-page="projects">Projects</button>
        <button class="hub-v2-tab" data-page="requests">Requests</button>
        <button class="hub-v2-tab" data-page="vendors">Vendors</button>
        <button class="hub-v2-tab" data-page="systems">Tools & Systems</button>
      </nav>

      <div class="hub-v2-grid">
        <div class="hub-v2-left">
          <section class="hub-v2-panel">
            <div class="hub-v2-panel-head"><div><h2>Today / Needs Attention</h2><p>Only the items that deserve attention now.</p></div><button class="hub-v2-link" data-page="requests">View all →</button></div>
            <div class="hub-v2-attention">
              <div class="hub-v2-attn-col urgent"><div class="hub-v2-attn-title">● Urgent (${urgentItems.length})</div>${urgentItems.slice(0,4).map(miniRow).join('')||'<div class="hub-v2-empty">No urgent items.</div>'}</div>
              <div class="hub-v2-attn-col today"><div class="hub-v2-attn-title">◷ Today / Next</div>${todayItems.map(miniRow).join('')||'<div class="hub-v2-empty">Nothing scheduled in the next 7 days.</div>'}</div>
              <div class="hub-v2-attn-col waiting"><div class="hub-v2-attn-title">⌛ Waiting on Others (${dedup.length})</div>${dedup.slice(0,4).map(miniRow).join('')||'<div class="hub-v2-empty">No external blockers.</div>'}</div>
            </div>
          </section>

          <div class="hub-v2-two">
            <section class="hub-v2-panel">
              <div class="hub-v2-panel-head"><div><h3>Active Projects</h3><p>Current initiatives and the next step.</p></div><button class="hub-v2-link" data-page="projects">View all (${activeProjects.length}) →</button></div>
              ${projectTable(activeProjects.slice(0,5))}
            </section>
            <section class="hub-v2-panel">
              <div class="hub-v2-panel-head"><div><h3>Open Requests</h3><p>Latest issues and requests still open.</p></div><button class="hub-v2-link" data-page="requests">View all (${openRequests.length}) →</button></div>
              ${requestTable(openRequests.slice(0,5))}
            </section>
          </div>
        </div>

        <aside class="hub-v2-right">
          <section class="hub-v2-panel">
            <div class="hub-v2-panel-head"><div><h3>Quick Actions</h3><p>Common tasks, one click away.</p></div></div>
            <div class="hub-v2-quick">
              ${quick('＋','New Request','Submit a store or IT request','new-request')}
              ${quick('◷','Log Work','Track hours and onsite work','log-work')}
              ${quick('▣','Retail Systems','Retail Pro, Stealth and POS support','retail')}
              ${quick('◈','Pass & Access','Open access records','pass')}
            </div>
          </section>

          <section class="hub-v2-panel">
            <div class="hub-v2-panel-head"><div><h3>Vendor Follow-ups</h3><p>Items waiting on vendor action.</p></div><button class="hub-v2-link" data-page="vendors">View all →</button></div>
            <ul class="hub-v2-side-list">${vendorActions.slice(0,5).map(v=>sideRow({title:v.name,sub:v.nextAction||v.service,meta:v.status||'Open',page:'vendors'})).join('')||'<li class="hub-v2-empty">No vendor follow-ups.</li>'}</ul>
          </section>

          <section class="hub-v2-panel">
            <div class="hub-v2-panel-head"><div><h3>Recent Activity</h3><p>Latest changes across operations.</p></div><button class="hub-v2-link" data-page="activity">View all →</button></div>
            <ul class="hub-v2-side-list">${recent.map(sideRow).join('')||'<li class="hub-v2-empty">No recent activity.</li>'}</ul>
          </section>
        </aside>
      </div>

      <section class="hub-v2-panel">
        <div class="hub-v2-panel-head"><div><h3>Quick Tools</h3><p>Only the tools you are most likely to need from the overview.</p></div></div>
        <div class="hub-v2-tools">
          ${tool('Retail Systems','Retail Pro / Stealth / POS support','retail_systems')}
          ${tool('Store Health','Connectivity and service status','store_health')}
          ${tool('Peter Work','Hours and billing register','pmworklog')}
          ${tool('Pass & Access','Account access references','pass')}
          ${tool('Roadmap','Phases and next steps','roadmap')}
          ${tool('SOP Library','Store procedures','sops')}
        </div>
      </section>
    </div>`;

    bind(root);
  };
})();