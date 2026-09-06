(function(){
  if(typeof App==='undefined')return;

  App.nav.it_admin=[['dashboard','⌂','IT Operations'],['requests','△','Issues & Requests'],['vendors','◉','Vendors'],['systems','⌘','Systems'],['activity','≋','Activity Log']];
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

  normalizeDemoPermissions();
  document.addEventListener('DOMContentLoaded',normalizeDemoPermissions);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-demo-role]'))setTimeout(normalizeDemoPermissions,0);
  },true);
})();
