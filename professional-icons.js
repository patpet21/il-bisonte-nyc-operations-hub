/* Professional icon layer — inline SVG only, no external dependency. */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

  const paths={
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    heart:'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/><path d="M3.5 12h4l1.5-3 3 7 2-4h6.5"/>',
    roadmap:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    projects:'<path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2h5"/>',
    alert:'<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 17h.01"/>',
    vendors:'<path d="M4 21V7l8-4 8 4v14"/><path d="M8 10h2M14 10h2M8 14h2M14 14h2M9 21v-3h6v3"/>',
    server:'<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/>',
    book:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23Z"/>',
    sparkles:'<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8ZM5 15l.7 1.8L7.5 17l-1.8.7L5 19.5l-.7-1.8L2.5 17l1.8-.2Z"/>',
    decision:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    receipt:'<path d="M6 3h12v18l-2-1.4L14 21l-2-1.4L10 21l-2-1.4L6 21Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M15 8l2 2M17 6l2 2"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    shield:'<path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
    cart:'<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.6L21 8H7"/>',
    wrench:'<path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L5 16a2.1 2.1 0 1 0 3 3l7.3-7.3a4 4 0 0 0 5-5L18 9l-2.4-2.4 2.3-2.3a4 4 0 0 0-3.2 2Z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    userPlus:'<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
    wifi:'<path d="M4.5 10.5a11 11 0 0 1 15 0M7.5 13.5a7 7 0 0 1 9 0M10.5 16.5a3 3 0 0 1 3 0"/><circle cx="12" cy="20" r=".7"/>',
    activity:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    managed:'<path d="M4 5h16v12H4Z"/><path d="M8 21h8M12 17v4M8 9h8M8 13h5"/>'
  };

  const pageIcon={
    dashboard:'dashboard',store_health:'heart',roadmap:'roadmap',pmworklog:'clock',projects:'projects',requests:'alert',vendors:'vendors',systems:'server',sops:'book',improvements:'sparkles',decisions:'decision',activity:'history',purchases_visits:'receipt',pass:'key',credentials:'key',users:'users',assets:'server',tasks:'decision',emazzanti:'managed',managed_it:'managed'
  };

  function icon(name,cls='hub-icon'){
    const body=paths[name]||paths.dashboard;
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }
  function iconForPage(page){return pageIcon[page]||'dashboard'}
  window.IBHubIcon=icon;

  document.addEventListener('DOMContentLoaded',()=>waitForCore().then(init).catch(console.error));

  function waitForCore(){return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(typeof App!=='undefined'&&App.nav&&typeof renderNav==='function'){clearInterval(t);resolve()}else if(++n>220){clearInterval(t);reject(new Error('Icon layer could not initialize'))}},40)})}

  function patchNavigationData(){
    Object.keys(App.nav||{}).forEach(role=>(App.nav[role]||[]).forEach(item=>{item[1]=icon(iconForPage(item[0]),'hub-icon nav-svg')}));
  }

  function init(){
    patchNavigationData();
    const previousRenderNav=renderNav;
    renderNav=function(){patchNavigationData();previousRenderNav();setTimeout(decorate,0)};
    renderNav();
    decorate();
    let queued=false;
    const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})});
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function decorate(){
    decorateTopbar();decorateQuickRoutes();decorateToolLinks();decorateMobileTools();decorateSectionLabels();
  }

  function decorateTopbar(){
    const menu=q('#sidebarToggle');
    if(menu&&!menu.dataset.proIcon){menu.dataset.proIcon='1';menu.innerHTML=icon('menu','hub-icon');}
    const search=q('.search-icon');
    if(search&&!search.dataset.proIcon){search.dataset.proIcon='1';search.innerHTML=icon('search','hub-icon');}
    const bell=q('#ibNotificationBtn');
    if(bell&&!bell.dataset.proIcon){const count=q('#ibNotificationCount',bell)?.textContent||'';bell.dataset.proIcon='1';bell.innerHTML=`${icon('bell','hub-icon')}<span id="ibNotificationCount" class="notification-count">${count}</span>`;bell.setAttribute('aria-label','Notifications');}
    const access=q('#ibAccessRequestBtn');
    if(access&&!access.dataset.proIcon){access.dataset.proIcon='1';access.innerHTML=`${icon('userPlus','hub-icon')}<span class="access-label">Request Access</span>`;}
    const install=q('#ibInstallBtn');
    if(install&&!install.dataset.proIcon){install.dataset.proIcon='1';install.innerHTML=`${icon('download','hub-icon')}<span class="access-label">Install</span>`;}
    const signout=q('#authSignOutBtn');
    if(signout&&!signout.dataset.proIcon){signout.dataset.proIcon='1';signout.innerHTML=`${icon('logout','hub-icon')}<span>Sign out</span>`;}
  }

  function decorateQuickRoutes(){
    qa('.hub-quick-link[data-hub-go]').forEach(el=>{
      if(el.dataset.proIcon)return;el.dataset.proIcon='1';
      el.insertAdjacentHTML('afterbegin',`<span class="hub-quick-icon">${icon(iconForPage(el.dataset.hubGo),'hub-icon')}</span>`);
    });
  }

  function decorateToolLinks(){
    qa('.hub-link[data-hub-go]').forEach(el=>{
      if(el.dataset.proIcon)return;el.dataset.proIcon='1';
      const copy=document.createElement('span');copy.className='hub-link-copy';
      while(el.firstChild)copy.appendChild(el.firstChild);
      el.appendChild(document.createRange().createContextualFragment(`<span class="hub-link-icon">${icon(iconForPage(el.dataset.hubGo),'hub-icon')}</span>`));
      el.appendChild(copy);
    });
  }

  function decorateMobileTools(){
    const map={'#ibAccessRequestBtn':'userPlus','#ibInstallBtn':'download','#authSignOutBtn':'logout'};
    qa('#hubMobileTools [data-hub-proxy]').forEach(el=>{if(el.dataset.proIcon)return;el.dataset.proIcon='1';const name=map[el.dataset.hubProxy]||'dashboard';el.innerHTML=`${icon(name,'hub-icon')}<span>${el.textContent}</span>`;});
  }

  function decorateSectionLabels(){
    const map={
      'Needs attention':'alert','Projects':'projects','Issues & Requests':'alert','All tools':'dashboard','Store, IT & vendors':'server'
    };
    qa('.hub-section-head h2').forEach(h=>{const key=h.textContent.trim();if(!map[key]||h.dataset.proIcon)return;h.dataset.proIcon='1';h.insertAdjacentHTML('afterbegin',icon(map[key],'hub-icon section-svg'));});
    const eyebrowMap={'SYSTEMS':'server','VENDOR COORDINATION':'vendors','RECENT ACTIVITY':'history'};
    qa('.hub-three-col .eyebrow').forEach(el=>{const key=el.textContent.trim();if(!eyebrowMap[key]||el.dataset.proIcon)return;el.dataset.proIcon='1';el.insertAdjacentHTML('afterbegin',icon(eyebrowMap[key],'hub-icon eyebrow-svg'));});
  }
})();
