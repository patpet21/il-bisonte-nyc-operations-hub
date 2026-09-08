/* Persistent stale-while-revalidate workspace cache.
   Cached operational data is never rendered before backend authorization succeeds. */
(function(){
  if(!window.IBData?.getAll||!window.IBAuth?.whenAuthorized||!window.IBWorkspaceCache)return;
  if(window.__IB_PERSISTENT_WORKSPACE_CACHE_INSTALLED)return;
  window.__IB_PERSISTENT_WORKSPACE_CACHE_INSTALLED=true;

  const underlyingGetAll=window.IBData.getAll.bind(window.IBData);
  let refreshPromise=null;

  function applyFresh(data){
    if(!data)return;
    window.IBWorkspaceCache.write(data,window.IBAuth.current?.());
    try{
      if(typeof App!=='undefined'&&App.data){
        App.data=data;
        if(typeof render==='function')render();
      }
    }catch(e){}
  }

  function refreshInBackground(){
    if(refreshPromise)return refreshPromise;
    refreshPromise=underlyingGetAll()
      .then(fresh=>{applyFresh(fresh);return fresh})
      .catch(()=>null)
      .finally(()=>{refreshPromise=null});
    return refreshPromise;
  }

  window.IBData.getAll=async function(){
    await window.IBAuth.whenAuthorized();
    const cached=window.IBWorkspaceCache.readFor(window.IBAuth.current?.());
    if(cached?.data){
      setTimeout(refreshInBackground,120);
      return cached.data;
    }
    const fresh=await underlyingGetAll();
    window.IBWorkspaceCache.write(fresh,window.IBAuth.current?.());
    return fresh;
  };
})();
