(function(){
  if(typeof App==='undefined')return;

  App.nav.it_admin=[
    ['dashboard','▦','Admin Control Center'],
    ['roadmap','◆','Roadmap'],
    ['pmworklog','◷','My PM Work'],
    ['projects','□','Projects'],
    ['requests','△','Issues & Requests'],
    ['vendors','◉','Vendors'],
    ['systems','⌘','Systems'],
    ['sops','▤','SOP Library'],
    ['improvements','✦','Process Improvement'],
    ['decisions','!','Decisions'],
    ['activity','≋','Activity Log']
  ];
  App.nav.read_only=[['dashboard','⌂','Overview'],['projects','□','Projects'],['requests','△','Issues'],['vendors','◉','Vendors'],['systems','⌘','Systems'],['sops','▤','Procedures']];

  function normalizeDemoPermissions(){
    if(window.IB_CONFIG?.auth?.mode!=='demo')return;
    const session=window.IBAuth?.current?.();
    if(!session)return;
    const role=session.user?.role||App.role||'project_manager';
    session.permissions={...(session.permissions||{}),demo:true,manageProjects:['project_manager','management','it_admin'].includes(role)};
  }

  function optimizeProductionLoading(){
    if(window.IB_CONFIG?.dataMode!=='apps_script'||!window.IBData?.getAll||!window.IBAuth?.whenAuthorized)return;
    const originalGetAll=window.IBData.getAll.bind(window.IBData);
    let inflight=null;

    function showLoadingState(){
      const root=document.querySelector('#pageRoot');
      if(root&&!root.innerHTML.trim())root.innerHTML='<div class="panel"><div class="empty">Loading workspace…</div></div>';
    }

    window.IBData.getAll=async function(){
      showLoadingState();
      await window.IBAuth.whenAuthorized();
      const boot=window.IBAuth.takeBootstrapData?.();
      if(boot)return boot;
      if(inflight)return inflight;
      inflight=originalGetAll().finally(()=>{inflight=null;});
      return inflight;
    };
  }

  function addRequestReferenceLinks(){
    if(typeof requestRows!=='function')return;
    requestRows=function(rows,actions){
      if(!rows.length)return '<div class="empty">No records.</div>';
      return `<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Request</th><th>Priority</th><th>Owner</th><th>Status</th><th>Next Action</th>${actions?'<th></th>':''}</tr></thead><tbody>${rows.map(r=>{
        const raw=String(r.attachmentRef||'').trim();
        const href=/^https?:\/\//i.test(raw)?raw:'';
        const reference=href?`<div class="row-sub"><a href="${esc(href)}" target="_blank" rel="noopener noreferrer">Open reference ↗</a></div>`:'';
        return `<tr><td>${esc(r.id)}</td><td><strong>${esc(r.title)}</strong><div class="row-sub">${esc(r.category)}</div>${reference}</td><td><span class="pill ${cls(r.priority)}">${esc(r.priority)}</span></td><td>${esc(r.owner)}</td><td><span class="pill ${cls(r.status)}">${esc(r.status)}</span></td><td>${esc(r.nextAction||'')}</td>${actions?`<td><button class="btn mini-action" data-id="${esc(r.id)}" data-status="${esc(r.status==='New'?'In Progress':r.status==='In Progress'?'Resolved':'In Progress')}">${r.status==='Resolved'?'Reopen':r.status==='In Progress'?'Resolve':'Start'}</button></td>`:''}</tr>`;
      }).join('')}</tbody></table></div>`;
    };
  }

  optimizeProductionLoading();
  addRequestReferenceLinks();
  normalizeDemoPermissions();
  document.addEventListener('DOMContentLoaded',normalizeDemoPermissions);
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-demo-role]'))setTimeout(normalizeDemoPermissions,0)},true);
})();
