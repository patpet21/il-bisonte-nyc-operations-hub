const CACHE='ib-ops-v0107-speed';
const SHELL=['/','/index.html','/styles.css','/notifications.css','/access-modal.css','/ui-enhancements.css','/layout-v04.css','/pass-vault.css','/auth.css','/roadmap.css','/project-workspace.css','/operations-control.css','/pm-worklog.css','/mobile-v010.css','/intuitive-layout.css','/professional-icons.css','/i18n.css','/config.js','/auth.js','/signup.js','/data-provider.js','/emazzanti-managed-it.js','/access-provider.js','/app.js','/dashboard-primary.js','/startup-fast.js','/role-bootstrap.js','/workspace-cache.js','/notifications.js','/ui-enhancements.js','/pass-vault.js','/roadmap-phase-workspace-v2.js','/roadmap.js','/project-workspace.js','/operations-control.js','/pm-worklog.js','/intuitive-layout.js','/professional-icons.js','/i18n.js','/manifest.webmanifest','/icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(SHELL.map(async url=>{
      try{
        const response=await fetch(url,{cache:'no-store'});
        if(response.ok)await cache.put(url,response);
      }catch(e){}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }catch(e){
      const hit=await caches.match(event.request);
      if(hit)return hit;
      if(event.request.mode==='navigate')return caches.match('/index.html');
      throw e;
    }
  })());
});

self.addEventListener('push',event=>{let payload={title:'Il Bisonte Operations',body:'You have a new operations notification.',url:'/'};try{const incoming=event.data?.json();payload={...payload,...incoming}}catch(e){try{payload.body=event.data?.text()||payload.body}catch(_){}}event.waitUntil(self.registration.showNotification(payload.title,{body:payload.body,icon:'/icon.svg',badge:'/icon.svg',tag:payload.tag||'ib-ops',data:{url:payload.url||'/'}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=event.notification.data?.url||'/';event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus'in client){client.navigate(url);return client.focus();}}return clients.openWindow?clients.openWindow(url):null;}));});
