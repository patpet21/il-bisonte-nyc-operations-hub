/* Runtime stability layer.
   Keeps the authenticated shell quiet while remote data/auth services are still resolving.
   Does not change the Google Sheet schema or application data model. */
(function(){
  const EMPTY_WORKSPACE={
    requests:[],projects:[],tasks:[],vendors:[],systems:[],sops:[],decisions:[],improvements:[],activity:[],pmWorklog:[]
  };

  function cleanStaleStorage(){
    try{
      if(window.IB_CONFIG?.environment==='PRODUCTION')localStorage.removeItem('ib_nyc_ops_demo_v04');
      const keepPrefix='ib_workspace_persistent_v0101:';
      const remove=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||'';
        if(k.startsWith('ib_workspace_persistent_')&&!k.startsWith(keepPrefix))remove.push(k);
      }
      remove.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
    }catch(e){}
  }

  function primeSafeWorkspace(){
    try{
      if(typeof App!=='undefined'&&!App.data)App.data={...EMPTY_WORKSPACE};
    }catch(e){}
  }

  function installGoogleInitGuard(){
    let tries=0;
    const timer=setInterval(()=>{
      const api=window.google?.accounts?.id;
      if(!api){if(++tries>1000)clearInterval(timer);return;}
      clearInterval(timer);
      if(api.__ibInitializeGuardInstalled)return;
      const original=api.initialize.bind(api);
      let initialized=false;
      api.initialize=function(options){
        if(initialized)return;
        initialized=true;
        return original(options);
      };
      try{Object.defineProperty(api,'__ibInitializeGuardInstalled',{value:true})}catch(e){api.__ibInitializeGuardInstalled=true}
    },10);
  }

  function showBackendWarning(status){
    const render=()=>{
      const host=document.querySelector('#authRoot .auth-panel');
      if(!host||document.getElementById('ibBackendWarning'))return;
      const note=document.createElement('div');
      note.id='ibBackendWarning';
      note.className='auth-inline-error';
      note.textContent=status===404
        ?'The Operations data service returned a temporary 404. Retrying with a fresh Apps Script request…'
        :'The Operations data service is temporarily unavailable. Please try again.';
      host.prepend(note);
    };
    setTimeout(render,0);
    setTimeout(render,250);
  }

  function freshEndpointUrl(endpoint){
    try{
      const u=new URL(endpoint,location.href);
      u.searchParams.set('__ibcb',`${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
      return u.toString();
    }catch(e){
      const joiner=endpoint.includes('?')?'&':'?';
      return `${endpoint}${joiner}__ibcb=${Date.now()}`;
    }
  }

  function monitorBackend(){
    if(typeof window.fetch!=='function')return;
    const endpoint=String(window.IB_CONFIG?.appsScriptUrl||'');
    if(!endpoint)return;
    const nativeFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const url=typeof input==='string'?input:(input&&input.url)||'';
      const isBackend=url===endpoint;
      const requestInput=isBackend?freshEndpointUrl(endpoint):input;
      const requestInit=isBackend?{...(init||{}),cache:'no-store',redirect:'follow'}:init;
      try{
        let response=await nativeFetch(requestInput,requestInit);
        if(isBackend&&response.status===404){
          showBackendWarning(404);
          response=await nativeFetch(freshEndpointUrl(endpoint),{...(init||{}),cache:'no-store',redirect:'follow'});
        }
        return response;
      }catch(err){
        if(isBackend)showBackendWarning(0);
        throw err;
      }
    };
  }

  cleanStaleStorage();
  installGoogleInitGuard();
  monitorBackend();
  document.addEventListener('DOMContentLoaded',primeSafeWorkspace,{once:true});
  window.IBRuntimeStability={primeSafeWorkspace,emptyWorkspace:()=>({...EMPTY_WORKSPACE})};
})();
