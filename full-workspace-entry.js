/* Optional deep links from the simple homepage into the existing protected tools. */
(function(){
  'use strict';
  const allowed=new Set(['pass','users','retail_systems','projects','roadmap','store_health',
    'purchases_visits','sops','activity','systems']);
  const requested=new URLSearchParams(location.search).get('page');
  if(!allowed.has(requested))return;
  async function openRequested(){
    if(window.IBAuth?.whenAuthorized){
      try{await window.IBAuth.whenAuthorized();}catch(_){return;}
    }
    let tries=0;
    const poll=setInterval(()=>{
      tries++;
      if(tries>180){clearInterval(poll);return;}
      if(typeof App==='undefined'||!App.data||typeof render!=='function')return;
      const authRole=window.IBAuth?.current?.()?.user?.role||window.IB_CURRENT_USER?.role||App.role;
      if(!authRole)return;
      // Let async feature modules register their routes, and never bypass role permissions.
      const routes=App.nav?.[authRole]||[];
      if(!routes.some(entry=>entry[0]===requested))return;
      App.role=authRole;
      App.page=requested;
      clearInterval(poll);
      render();
    },100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openRequested,{once:true});
  else openRequested();
})();