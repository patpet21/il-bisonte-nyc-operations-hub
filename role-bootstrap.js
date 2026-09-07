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

  function installFastSessionBootstrap(){
    if(window.IB_CONFIG?.dataMode!=='apps_script'||!window.IB_CONFIG?.appsScriptUrl||typeof window.fetch!=='function')return;
    if(window.__IB_FAST_BOOTSTRAP_INSTALLED)return;
    window.__IB_FAST_BOOTSTRAP_INSTALLED=true;
    const nativeFetch=window.fetch.bind(window);
    const endpoint=String(window.IB_CONFIG.appsScriptUrl);
    window.fetch=function(input,init){
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        const body=init&&init.body;
        if(url===endpoint&&body instanceof URLSearchParams&&body.get('action')==='bootstrap'){
          const fastBody=new URLSearchParams(body.toString());
          fastBody.set('action','getSession');
          return nativeFetch(input,{...init,body:fastBody});
        }
      }catch(e){}
      return nativeFetch(input,init);
    };
  }

  function workspaceCacheKey(){
    const s=window.IBAuth?.current?.();
    const email=String(s?.user?.email||s?.profile?.email||'').trim().toLowerCase();
    const role=String(s?.user?.role||'');
    return email&&role?`ib_workspace_session_v01:${email}:${role}`:'';
  }
  function readWorkspaceCache(){
    try{
      const key=workspaceCacheKey();if(!key)return null;
      const item=JSON.parse(sessionStorage.getItem(key)||'null');
      if(!item||!item.data||Date.now()-Number(item.at||0)>60000)return null;
      return item.data;
    }catch(e){return null}
  }
  function writeWorkspaceCache(data){
    try{const key=workspaceCacheKey();if(key&&data)sessionStorage.setItem(key,JSON.stringify({at:Date.now(),data}))}catch(e){}
  }
  function applyFreshWorkspace(data){
    if(!data)return;
    writeWorkspaceCache(data);
    setTimeout(()=>{
      try{
        if(typeof App!=='undefined'&&App.data){App.data=data;if(typeof render==='function')render();}
      }catch(e){}
    },0);
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
      if(boot){writeWorkspaceCache(boot);return boot;}

      const cached=readWorkspaceCache();
      if(cached){
        if(!inflight){
          inflight=originalGetAll().then(fresh=>{applyFreshWorkspace(fresh);return fresh;}).catch(()=>null).finally(()=>{inflight=null;});
        }
        return cached;
      }

      if(inflight)return inflight;
      inflight=originalGetAll().then(fresh=>{writeWorkspaceCache(fresh);return fresh;}).finally(()=>{inflight=null;});
      return inflight;
    };
  }

  function revealAuthorizedShellEarly(){
    if(window.IB_CONFIG?.dataMode!=='apps_script'||!window.IBAuth?.whenAuthorized)return;
    window.IBAuth.whenAuthorized().then(()=>{
      const root=document.querySelector('#pageRoot');
      if(root&&!root.innerHTML.trim())root.innerHTML='<div class="panel"><div class="empty">Loading workspace…</div></div>';
      const gate=document.querySelector('#authRoot');
      if(gate)gate.innerHTML='';
    }).catch(()=>{});
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

  installFastSessionBootstrap();
  optimizeProductionLoading();
  revealAuthorizedShellEarly();
  addRequestReferenceLinks();
  normalizeDemoPermissions();
  document.addEventListener('DOMContentLoaded',normalizeDemoPermissions);
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-demo-role]'))setTimeout(normalizeDemoPermissions,0)},true);
})();
