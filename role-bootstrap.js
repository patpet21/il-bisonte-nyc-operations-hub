(function(){
  if(typeof App==='undefined')return;

  // IT Admin is the production super-user: one workspace with PM, management,
  // operations, access-governance and credential visibility.
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
    session.permissions={
      ...(session.permissions||{}),
      demo:true,
      manageProjects:['project_manager','management','it_admin'].includes(role)
    };
  }

  // Production loading: do not hit Apps Script before Google has produced a token,
  // deduplicate concurrent getAll calls and reuse a very short per-user session cache.
  function optimizeProductionLoading(){
    if(window.IB_CONFIG?.dataMode!=='apps_script'||!window.IBData?.getAll)return;
    const originalGetAll=window.IBData.getAll.bind(window.IBData);
    let inflight=null;
    const CACHE_TTL=30000;

    function waitForToken(){
      if(window.IB_CONFIG?.auth?.mode!=='google'||window.IBAuth?.getToken?.())return Promise.resolve();
      return new Promise(resolve=>{
        const timer=setInterval(()=>{
          if(window.IBAuth?.getToken?.()){
            clearInterval(timer);
            resolve();
          }
        },80);
      });
    }

    function cacheKey(){
      const s=window.IBAuth?.current?.();
      const identity=s?.user?.email||s?.profile?.email||'signed-user';
      return 'ib_ops_data_cache_v1:'+String(identity).trim().toLowerCase();
    }

    function readCache(key){
      try{
        const cached=JSON.parse(sessionStorage.getItem(key)||'null');
        if(cached?.data&&Date.now()-Number(cached.at||0)<CACHE_TTL)return cached.data;
      }catch(e){}
      return null;
    }

    function fetchFresh(key){
      if(inflight)return inflight;
      inflight=originalGetAll().then(data=>{
        try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),data:data}));}catch(e){}
        return data;
      }).finally(()=>{inflight=null;});
      return inflight;
    }

    window.IBData.getAll=async function(){
      await waitForToken();
      const key=cacheKey();
      const cached=readCache(key);
      if(cached){
        // Render immediately from the recent session copy, then quietly refresh.
        setTimeout(()=>fetchFresh(key).then(fresh=>{
          if(typeof App!=='undefined'&&App.data&&fresh){
            App.data=fresh;
            if(typeof render==='function')render();
          }
        }).catch(()=>{}),0);
        return cached;
      }
      return fetchFresh(key);
    };
  }

  // Show safe HTTP(S) references directly in the request register. This makes
  // procurement links such as REQ-0008 usable without exposing non-web schemes.
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
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-demo-role]'))setTimeout(normalizeDemoPermissions,0);
  },true);
})();
