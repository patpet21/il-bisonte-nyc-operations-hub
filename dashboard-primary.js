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
    const attrs=item.requestId?`data-request-id="${safe(item.requestId)}"`:item.projectId?`data-project-id="${safe(item.projectId)}"`:`data-page="${safe(item.page||'')}"`;
    return `<div class="hub-v2-minirow" ${attrs}><div><strong>${safe(item.title)}</strong><small>${safe(item.sub||'')}</small></div>${pill(item.badge||item.meta||'Open',item.tone||item.badge||item.meta)}</div>`;
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
      return `<tr data-project-id="${safe(p.id)}" title="Open project"><td><strong>${safe(p.name)}</strong><small>${safe(p.nextAction||p.scope||p.id)}</small></td><td>${pill(p.status||'Open',p.status)}</td><td><div class="hub-v2-progress"><span><i style="width:${progress}%"></i></span><b>${progress}%</b></div></td><td>${safe(p.owner||'—')}</td><td>${safe(dueLabel(p.due))}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function requestTable(rows){
    if(!rows.length)return'<div class="hub-v2-empty">No open requests.</div>';
    return `<div class="table-wrap"><table class="hub-v2-table"><thead><tr><th>Request</th><th>Priority</th><th>Status</th><th>Owner</th></tr></thead><tbody>${rows.map(r=>`<tr data-request-id="${safe(r.id)}" title="Open and edit request"><td><strong>${safe(r.title)}</strong><small>${safe(r.id||r.category||'')}</small></td><td>${pill(r.priority||'Normal',r.priority)}</td><td>${pill(r.status||'Open',r.status)}</td><td>${safe(r.owner||'—')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function localDateKey(offset=0){
    const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+offset);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  }
  function workItemCard(t){
    const project=(App.data?.projects||[]).find(p=>p.id===t.projectId);
    return `<button class="hub-daily-task" data-task-id="${safe(t.id)}"><span><strong>${safe(t.title)}</strong><small>${safe(project?.name||t.projectId||'General')} · ${safe(t.owner||'Unassigned')}</small></span>${pill(t.status||'Open',t.status)}</button>`;
  }
  function dailyWorkCard(label,date,rows,emptyText){
    return `<section class="hub-work-day"><div class="hub-work-day-head"><div><span>${safe(label)}</span><strong>${safe(date)}</strong></div><b>${rows.length}</b></div><div class="hub-work-entries">${rows.length?rows.map(workItemCard).join(''):`<div class="hub-v2-empty">${safe(emptyText)}</div>`}</div></section>`;
  }

  function bind(root){
    root.querySelectorAll('[data-request-id]').forEach(el=>el.addEventListener('click',e=>{
      e.stopPropagation();window.IBRequestEditor?.open?.(el.dataset.requestId);
    }));
    root.querySelectorAll('[data-task-id]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();window.IBWorkBoard?.editById?.(el.dataset.taskId);}));
    root.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>{
      const page=el.dataset.page;if(!page)return;App.page=page;render();
    }));
    root.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{
      const a=el.dataset.action;
      if(a==='new-request'&&typeof openRequestModal==='function')return openRequestModal('request');
      if(a==='new-work')return window.IBWorkBoard?.newItem?.()||(App.page='work',render());
      if(a==='log-work'){App.page='pmworklog';return render();}
      if(a==='retail'){App.page='retail_systems';return render();}
      if(a==='pass'){App.page='pass';return render();}
    }));
  }

  // Only the homepage changes; all existing feature pages and data actions remain.
  const legacyPMDashboard=renderPMDashboard;
  renderPMDashboard=function(root){
    if(!['project_manager','it_admin'].includes(App.role))return legacyPMDashboard(root);
    const d=App.data||{};
    const tasks=(d.tasks||[]).filter(t=>!closed(t));
    const openRequests=(d.requests||[]).filter(r=>!closed(r));
    const vendors=(d.vendors||[]).filter(v=>String(v.nextAction||'').trim());
    const today=localDateKey();
    const date=t=>String(t.due||'').slice(0,10);
    const bucket=t=>!date(t)?3:date(t)<today?0:date(t)===today?1:2;
    const high=t=>/urgent|critical|high/i.test(String(t.priority||''))?0:1;
    const ordered=[...tasks].sort((a,b)=>bucket(a)-bucket(b)||high(a)-high(b)||
      (date(a)||'9999').localeCompare(date(b)||'9999')||
      String(a.title||'').localeCompare(String(b.title||''))).slice(0,6);
    const partnerOrder=['VEN-0001','VEN-0007','VEN-0004','VEN-0005','VEN-0002','VEN-0003','VEN-0006'];
    const partnerRank=v=>{const index=partnerOrder.indexOf(v.id);return index<0?99:index;};
    const support=[...vendors].sort((a,b)=>partnerRank(a)-partnerRank(b)).slice(0,4);
    const workRows=ordered.map(t=>{
      const due=date(t)?(date(t)<today?'Overdue · ':'')+dueLabel(t.due):'No due date';
      return '<li class="hub-v2-side-row ib-focus-row" data-task-id="'+safe(t.id)+'" role="button" tabindex="0">'+
        '<div><strong>'+safe(t.title||'Work item')+'</strong><small>'+safe(t.owner||'Unassigned')+' · '+safe(due)+'</small></div>'+
        '<span class="hub-v2-side-meta">'+safe(t.status||'Open')+'</span></li>';
    }).join('');
    const vendorRows=support.map(v=>
      '<li class="hub-v2-side-row ib-focus-row" data-page="vendors" role="button" tabindex="0">'+
        '<div><strong>'+safe(v.name||'Partner')+'</strong><small>'+safe(v.nextAction||v.service||'')+'</small></div>'+
        '<span class="hub-v2-side-meta">'+safe(v.contact||'Contact to confirm')+'</span></li>'
    ).join('');
    root.innerHTML=pageHead(
      App.role==='it_admin'?'IT & Operations Overview':'Operations Overview',
      'Current work and partner follow-ups. Detailed records remain in their original sections.',
      'IL BISONTE NEW YORK'
    )+'<div class="hub-v2 ib-focus-overview">'+
      '<div class="hub-v2-top"><p class="ib-focus-summary">'+tasks.length+' open work items · '+openRequests.length+' open requests</p>'+
        '<div class="hub-v2-actions">'+
          '<button class="hub-v2-action primary" type="button" data-action="new-work">+ New work</button>'+
          '<button class="hub-v2-action" type="button" data-action="new-request">+ New request</button>'+
          '<button class="hub-v2-action" type="button" data-action="log-work">My work & hours →</button>'+
        '</div></div>'+
      '<div class="hub-v2-two ib-focus-columns">'+
        '<section class="hub-v2-panel">'+
          '<div class="hub-v2-panel-head"><div><h2>Work to do</h2><p>Overdue, today and upcoming.</p></div>'+
            '<button class="hub-v2-link" type="button" data-page="work">All work ('+tasks.length+') →</button></div>'+
          '<ul class="hub-v2-side-list">'+(workRows||'<li class="hub-v2-empty">No open work items.</li>')+'</ul>'+
        '</section>'+
        '<section class="hub-v2-panel">'+
          '<div class="hub-v2-panel-head"><div><h2>Partner follow-ups</h2><p>Next actions from the existing vendor register.</p></div>'+
            '<button class="hub-v2-link" type="button" data-page="vendors">All partners →</button></div>'+
          '<ul class="hub-v2-side-list">'+(vendorRows||'<li class="hub-v2-empty">No pending partner follow-ups.</li>')+'</ul>'+
        '</section>'+
      '</div></div>';
    bind(root);
    root.querySelectorAll('.ib-focus-row').forEach(row=>row.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();row.click();}
    }));
  };
})();