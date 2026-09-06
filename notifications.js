let ibDeferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ibDeferredInstallPrompt=e;const b=document.getElementById('ibInstallBtn');if(b)b.hidden=false;});

(function(){
  const seenSession=new Set();
  const roleEmails={store_manager:'demo.store@ilbisonte.local',project_manager:'demo.pm@ilbisonte.local',management:'demo.management@ilbisonte.local'};
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  document.addEventListener('DOMContentLoaded',()=>waitForCore().then(initEnhancements).catch(console.error));

  function waitForCore(){return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{n++;try{if(window.IBAccess&&typeof App!=='undefined'&&typeof renderPage==='function'){clearInterval(t);resolve();return}}catch(e){}if(n>100){clearInterval(t);reject(new Error('Operations Hub core did not initialize'))}},50)})}

  function context(){const role=App.role||q('#roleSelect')?.value||'project_manager';return {role,email:roleEmails[role]||''}}

  async function initEnhancements(){
    addUsersNavigation();
    patchPageRenderer();
    injectTopbarTools();
    await registerServiceWorker();
    await refreshBell();
    setInterval(pollNotifications,30000);
  }

  function addUsersNavigation(){
    ['project_manager','management'].forEach(role=>{
      if(App.nav[role]&&!App.nav[role].some(x=>x[0]==='users'))App.nav[role].push(['users','◎','Access & Users']);
    });
  }

  function patchPageRenderer(){
    const original=renderPage;
    renderPage=function(){
      if(App.page==='users'){renderUsersPage();return;}
      original();
      refreshBell();
    };
  }

  function injectTopbarTools(){
    const host=q('.topbar-actions');if(!host||q('#ibNotificationBtn'))return;
    const tools=document.createElement('div');tools.className='notification-tools';
    tools.innerHTML=`<button id="ibAccessRequestBtn" class="icon-btn access-btn" title="Request access"><span>＋</span><span class="access-label">Request Access</span></button><button id="ibInstallBtn" class="icon-btn" title="Install app" hidden>⇩ <span class="access-label">Install</span></button><button id="ibNotificationBtn" class="icon-btn" title="Notifications">🔔<span id="ibNotificationCount" class="notification-count"></span></button>`;
    host.insertBefore(tools,host.firstChild);
    q('#ibAccessRequestBtn').onclick=openAccessRequestModal;
    q('#ibNotificationBtn').onclick=openNotificationCenter;
    q('#ibInstallBtn').onclick=installPwa;
  }

  async function refreshBell(){
    try{const rows=await IBAccess.listNotifications(context());const unread=rows.filter(n=>!truthy(n.read)).length;const badge=q('#ibNotificationCount');if(badge)badge.textContent=unread?String(unread):'';}catch(e){console.warn(e)}
  }

  async function pollNotifications(){
    try{
      const rows=await IBAccess.listNotifications(context());
      await refreshBell();
      const fresh=rows.filter(n=>!truthy(n.read)&&!seenSession.has(n.id));
      fresh.forEach(n=>seenSession.add(n.id));
      if(document.visibilityState==='hidden'&&fresh[0]&&Notification.permission==='granted')showDeviceNotification(fresh[0].title,fresh[0].message,{tag:fresh[0].id});
    }catch(e){}
  }

  function truthy(v){return v===true||String(v).toLowerCase()==='true'||String(v).toLowerCase()==='yes'||String(v)==='1'}

  function modal(title,body,footer=''){
    const root=q('#modalRoot');
    root.innerHTML=`<div class="ib-overlay" role="dialog" aria-modal="true"><div class="ib-dialog"><div class="ib-dialog-head"><div><div class="eyebrow">IL BISONTE NEW YORK</div><h2>${safe(title)}</h2></div><button class="ib-close" aria-label="Close">×</button></div><div class="ib-dialog-body">${body}</div>${footer?`<div class="ib-dialog-foot">${footer}</div>`:''}</div></div>`;
    q('.ib-close',root).onclick=closeModal;q('.ib-overlay',root).onclick=e=>{if(e.target===e.currentTarget)closeModal()};
  }
  function closeModal(){q('#modalRoot').innerHTML=''}

  function openAccessRequestModal(){
    modal('Request access',`<form id="ibAccessForm" class="access-form"><label>Full name<input name="displayName" required placeholder="Name and surname"></label><label>Work email<input name="email" type="email" required placeholder="name@company.com"></label><label>Requested role<select name="role"><option value="store_manager">Store Manager</option><option value="project_manager">Project Manager</option><option value="management">Management</option></select></label><label>Store / location<input name="store" value="${safe(window.IB_CONFIG.storeName||'New York')}"></label><div class="pwa-status">New accounts remain <strong>Pending</strong> until a Project Manager or Management user approves them. In production the backend can email the approvers automatically.</div><div class="modal-actions-row"><button type="button" class="btn" id="ibCancelAccess">Cancel</button><button class="btn primary" type="submit">Submit request</button></div></form>`);
    q('#ibCancelAccess').onclick=closeModal;
    q('#ibAccessForm').onsubmit=async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget);const payload=Object.fromEntries(f.entries());
      try{await IBAccess.requestAccess(payload);closeModal();if(typeof toast==='function')toast('Access request submitted for approval');await showDeviceNotification('Access request submitted','Your request is pending approval.');await refreshBell();if(App.page==='users')renderUsersPage();}
      catch(err){if(typeof toast==='function')toast(err.message||'Unable to submit request')}
    };
  }

  async function openNotificationCenter(){
    modal('Notifications','<div id="ibNotificationBody"><div class="empty">Loading notifications…</div></div>',`<button class="btn" id="ibEnableAlerts">Enable device alerts</button><button class="btn" id="ibMarkAllRead">Mark all read</button>`);
    q('#ibEnableAlerts').onclick=enableDeviceNotifications;q('#ibMarkAllRead').onclick=markAllRead;
    await loadNotificationCenter();
  }

  async function loadNotificationCenter(){
    const body=q('#ibNotificationBody');if(!body)return;
    try{
      const rows=await IBAccess.listNotifications(context());
      body.innerHTML=rows.length?`<div class="notification-list">${rows.map(n=>`<button class="notification-item ${truthy(n.read)?'':'unread'}" data-notification-id="${safe(n.id)}"><span class="notification-dot"></span><span><span class="notification-title">${safe(n.title)}</span><span class="notification-message">${safe(n.message)}</span></span><span class="notification-time">${safe(n.createdAt||'')}</span></button>`).join('')}</div><div class="pwa-status">Browser/device alerts work after permission is granted. True remote push while the app is fully closed is prepared through the service worker and will be enabled when a production push provider/VAPID key is configured.</div>`:'<div class="empty">No notifications.</div>';
      qa('[data-notification-id]',body).forEach(el=>el.onclick=async()=>{await IBAccess.markNotificationRead(el.dataset.notificationId);el.classList.remove('unread');await refreshBell()});
    }catch(e){body.innerHTML=`<div class="empty">${safe(e.message)}</div>`}
  }

  async function markAllRead(){
    const rows=await IBAccess.listNotifications(context());await Promise.all(rows.filter(n=>!truthy(n.read)).map(n=>IBAccess.markNotificationRead(n.id)));await loadNotificationCenter();await refreshBell();
  }

  async function enableDeviceNotifications(){
    if(!('Notification'in window)){if(typeof toast==='function')toast('Notifications are not supported by this browser');return}
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){if(typeof toast==='function')toast('Notification permission was not granted');return}
    await showDeviceNotification('Il Bisonte Operations','Device notifications are enabled for this browser.');
    if(typeof toast==='function')toast('Device notifications enabled');
  }

  async function showDeviceNotification(title,message,options={}){
    if(!('Notification'in window)||Notification.permission!=='granted')return;
    try{const reg=await navigator.serviceWorker?.ready;if(reg){await reg.showNotification(title,{body:message,icon:'icon.svg',badge:'icon.svg',data:{url:location.origin},...options});return}}catch(e){}
    try{new Notification(title,{body:message,...options})}catch(e){}
  }

  async function registerServiceWorker(){
    if(!('serviceWorker'in navigator))return;
    try{await navigator.serviceWorker.register('/sw.js')}catch(e){console.warn('Service worker registration failed',e)}
  }

  async function installPwa(){
    if(ibDeferredInstallPrompt){ibDeferredInstallPrompt.prompt();await ibDeferredInstallPrompt.userChoice;ibDeferredInstallPrompt=null;q('#ibInstallBtn').hidden=true;return}
    if(typeof toast==='function')toast('Use your browser menu and choose Install app / Add to Home Screen');
  }

  async function renderUsersPage(){
    const root=q('#pageRoot');
    root.innerHTML=`<div class="page-head"><div><div class="eyebrow">ACCESS GOVERNANCE</div><h1 class="page-title">Access & Users</h1><p class="page-subtitle">Approve new users, assign roles and keep access changes visible.</p></div><div class="date-card"><strong>User approval workflow</strong><br><span class="muted">No account becomes active automatically</span></div></div><div id="ibUsersContent"><div class="panel"><div class="empty">Loading users…</div></div></div>`;
    try{
      const users=await IBAccess.listUsers();const pending=users.filter(u=>String(u.status).toLowerCase()==='pending').length;const approved=users.filter(u=>String(u.status).toLowerCase()==='approved'||String(u.status).toLowerCase()==='demo').length;const content=q('#ibUsersContent');
      content.innerHTML=`<div class="users-summary"><div class="user-card-stat"><strong>${users.length}</strong><span>Total users / requests</span></div><div class="user-card-stat"><strong>${pending}</strong><span>Pending approval</span></div><div class="user-card-stat"><strong>${approved}</strong><span>Approved</span></div></div><div class="panel"><div class="panel-head"><h3>User Access Register</h3><button class="btn primary" id="ibNewAccessFromUsers">+ New access request</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>User</th><th>Role</th><th>Store</th><th>Status</th><th>Requested</th><th>Approved by</th><th>Action</th></tr></thead><tbody>${users.map(u=>`<tr><td><strong>${safe(u.displayName||u.email)}</strong><div class="row-sub">${safe(u.email)}</div></td><td>${safe(window.IBPrettyRole?IBPrettyRole(u.role):u.role)}</td><td>${safe(u.store||'')}</td><td><span class="status-${safe(String(u.status).toLowerCase())}">${safe(u.status)}</span></td><td>${safe(u.requestedAt||'')}</td><td>${safe(u.approvedBy||'—')}</td><td>${String(u.status).toLowerCase()==='pending'?`<div class="approval-actions"><button class="btn approve" data-user-action="Approved" data-user-email="${safe(u.email)}">Approve</button><button class="btn reject" data-user-action="Rejected" data-user-email="${safe(u.email)}">Reject</button></div>`:'—'}</td></tr>`).join('')}</tbody></table></div></div><div class="pwa-status">Production behavior: a new access request can email the configured administrators; approval/rejection can email the requester. The Apps Script backend for these actions is included in the repository.</div>`;
      q('#ibNewAccessFromUsers').onclick=openAccessRequestModal;
      qa('[data-user-action]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await IBAccess.setUserStatus(b.dataset.userEmail,b.dataset.userAction,App.role==='management'?'Management':'Project Manager');if(typeof toast==='function')toast(`User ${b.dataset.userAction.toLowerCase()}`);await showDeviceNotification(`Access ${b.dataset.userAction.toLowerCase()}`,`${b.dataset.userEmail} was ${b.dataset.userAction.toLowerCase()}.`);await renderUsersPage();await refreshBell()}catch(e){b.disabled=false;if(typeof toast==='function')toast(e.message)}});
    }catch(e){q('#ibUsersContent').innerHTML=`<div class="panel"><div class="empty">${safe(e.message)}</div></div>`}
  }
})();
