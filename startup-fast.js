/* Startup coordinator: chooses the fastest safe bootstrap path and forces PWA updates to become visible without a manual refresh. */
(function(){
  const CACHE_PREFIX='ib_workspace_persistent_v0101:';
  const MAX_AGE=24*60*60*1000;

  function session(){try{return window.IBAuth?.current?.()||null}catch(e){return null}}
  function identity(s=session()){
    const email=String(s?.user?.email||s?.profile?.email||'').trim().toLowerCase();
    const role=String(s?.user?.role||'').trim();
    return {email,role};
  }
  function key(email,role){return email&&role?`${CACHE_PREFIX}${email}:${role}`:''}
  function readFor(s=session()){
    try{
      const {email,role}=identity(s),k=key(email,role);if(!k)return null;
      const item=JSON.parse(localStorage.getItem(k)||'null');
      if(!item?.data||Date.now()-Number(item.at||0)>MAX_AGE)return null;
      return item;
    }catch(e){return null}
  }
  function write(data,s=session()){
    try{
      const {email,role}=identity(s),k=key(email,role);if(!k||!data)return;
      localStorage.setItem(k,JSON.stringify({at:Date.now(),data}));
    }catch(e){}
  }

  window.IBWorkspaceCache={readFor,write,identity,maxAge:MAX_AGE};

  /* role-bootstrap.js normally forces bootstrap -> getSession on every load.
     We take ownership of that decision: use the lightweight session call only when
     a role-matched local snapshot already exists. Otherwise keep the one-request
     bootstrap so the first load receives session + workspace together. */
  window.__IB_FAST_BOOTSTRAP_INSTALLED=true;
  const cached=readFor();
  if(cached&&window.IB_CONFIG?.dataMode==='apps_script'&&window.IB_CONFIG?.appsScriptUrl&&typeof window.fetch==='function'){
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

  if('serviceWorker' in navigator){
    const hadController=Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(!hadController)return;
      const guard='ib_sw_auto_reload_v0101';
      if(sessionStorage.getItem(guard)==='1')return;
      sessionStorage.setItem(guard,'1');
      location.reload();
    });
    window.addEventListener('load',()=>{
      navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{});
    },{once:true});
  }
})();
