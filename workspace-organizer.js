/* Restored full workspace: presentation only. Keeps the original page routes,
   roles, permissions, backend, and original editing modules intact. */
(function(){
  'use strict';
  if(typeof App==='undefined'||typeof renderNav!=='function')return;
  const SIDEBAR_GROUPS=[
    {key:'store',en:'Store operations',it:'Operazioni negozio',pages:['work','requests','store_health','purchases_visits','activity']},
    {key:'support',en:'Partners & technology',it:'Partner e tecnologia',pages:['vendors','emazzanti','systems','retail_systems']},
    {key:'planning',en:'Projects & planning',it:'Progetti e pianificazione',pages:['roadmap','projects','improvements','decisions']},
    {key:'resources',en:'Resources & access',it:'Risorse e accessi',pages:['sops','pass','credentials','users']}
  ];
  const expanded=new Set();
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function italian(){return window.IBI18n?.language?.()==='it';}
  function navButton(entry,host){
    const id=entry[0],icon=entry[1],label=entry[2];
    const button=document.createElement('button');
    button.type='button';
    button.className='nav-btn'+(App.page===id?' active':'');
    button.dataset.page=id;
    button.setAttribute('aria-current',App.page===id?'page':'false');
    const symbol=document.createElement('span');symbol.className='nav-icon';symbol.setAttribute('aria-hidden','true');symbol.textContent=icon||'·';
    const name=document.createElement('span');name.textContent=label;
    button.append(symbol,name);
    button.addEventListener('click',()=>{App.page=id;render();});
    host.appendChild(button);
  }
  function organizedNav(){
    const host=document.querySelector('#sidebarNav'),entries=App.nav?.[App.role]||[];
    if(!host)return;
    host.replaceChildren();
    host.classList.add('ib-organized-nav');
    const seen=new Set();
    const topIds=['dashboard','pmworklog'];
    topIds.forEach(id=>{const entry=entries.find(item=>item[0]===id);if(entry){seen.add(id);navButton(entry,host);}});
    SIDEBAR_GROUPS.forEach(group=>{
      const members=group.pages.map(id=>entries.find(entry=>entry[0]===id)).filter(Boolean).filter(entry=>!seen.has(entry[0]));
      if(!members.length)return;
      members.forEach(entry=>seen.add(entry[0]));
      const details=document.createElement('details');
      details.className='ib-nav-group';
      details.dataset.group=group.key;
      details.open=expanded.has(group.key)||members.some(entry=>entry[0]===App.page);
      const summary=document.createElement('summary');
      const label=document.createElement('span');label.className='ib-nav-group-label';label.dataset.i18nSkip='1';
      label.dataset.en=group.en;label.dataset.it=group.it;
      label.textContent=italian()?group.it:group.en;
      const arrow=document.createElement('span');arrow.className='ib-nav-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';
      summary.append(label,arrow);
      const items=document.createElement('div');items.className='ib-nav-group-items';
      members.forEach(entry=>navButton(entry,items));
      details.append(summary,items);
      details.addEventListener('toggle',()=>{if(details.open)expanded.add(group.key);else expanded.delete(group.key);});
      host.appendChild(details);
    });
    const remaining=entries.filter(entry=>!seen.has(entry[0]));
    if(remaining.length){
      const details=document.createElement('details');details.className='ib-nav-group';
      details.open=remaining.some(entry=>entry[0]===App.page)||expanded.has('more');
      details.dataset.group='more';
      const summary=document.createElement('summary');
      const label=document.createElement('span');label.className='ib-nav-group-label';label.dataset.i18nSkip='1';
      label.dataset.en='Other tools';label.dataset.it='Altri strumenti';label.textContent=italian()?'Altri strumenti':'Other tools';
      const arrow=document.createElement('span');arrow.className='ib-nav-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';
      summary.append(label,arrow);const items=document.createElement('div');items.className='ib-nav-group-items';
      remaining.forEach(entry=>navButton(entry,items));details.append(summary,items);
      details.addEventListener('toggle',()=>{if(details.open)expanded.add('more');else expanded.delete('more');});
      host.appendChild(details);
    }
  }
  renderNav=organizedNav;
  document.addEventListener('ib-language-change',()=>{
    document.querySelectorAll('.ib-nav-group-label').forEach(node=>{node.textContent=italian()?node.dataset.it:node.dataset.en;});
  });
  const originalVendors=renderVendors;
  renderVendors=function(root){
    const vendors=Array.isArray(App.data?.vendors)?App.data.vendors:[];
    if(!vendors.length)return originalVendors(root);
    const priority=['VEN-0001','VEN-0007','VEN-0004','VEN-0005','VEN-0002','VEN-0003','VEN-0006'];
    const sorted=[...vendors].sort((a,b)=>{
      const ai=priority.indexOf(a.id),bi=priority.indexOf(b.id);
      return (ai<0?100:ai)-(bi<0?100:bi);
    });
    const value=(x,fallback='—')=>safe(String(x??'').trim()||fallback);
    const supportField=(v,key)=>String(v?.[key]??'').trim();
    const cards=sorted.map(v=>{
      const name=String(v.name||'').trim();
      const isRetail=v.id==='VEN-0004'||/retail pro support/i.test(name);
      const isEmazzanti=v.id==='VEN-0001'||/emazzanti/i.test(name);
      const phones=[supportField(v,'supportPhone'),supportField(v,'phone')].filter(Boolean);
      const emails=[supportField(v,'supportEmail'),supportField(v,'email')].filter(Boolean);
      const phone=isEmazzanti&&!phones.length?'201-360-4400 (option 2)':phones[0];
      const email=isEmazzanti&&!emails.length?'support@emazzanti.net':emails[0];
      const contact=String(v.contact||v.supportContact||v.supportName||'').trim();
      const action=String(v.nextAction||'').trim();
      const route=isRetail?'retail_systems':isEmazzanti?'emazzanti':null;
      const hasRoute=route&&(App.nav?.[App.role]||[]).some(x=>x[0]===route);
      return '<article class="ib-partner-card">'+
        '<div class="ib-partner-card-head"><div><span class="ib-partner-kicker">'+value(v.id,'PARTNER')+'</span><h2>'+value(name,'Partner')+'</h2></div><span class="ib-partner-state">'+value(v.status,'To confirm')+'</span></div>'+
        '<p class="ib-partner-service">'+value(v.service,'Service to confirm')+'</p>'+
        '<dl class="ib-partner-fields">'+
          '<div><dt>Contact / Referente</dt><dd>'+value(contact,'To confirm')+'</dd></div>'+
          (phone?'<div><dt>Phone / Telefono</dt><dd><a href="tel:'+value(phone.replace(/\s*\(.*\)\s*$/,'').replace(/[^+\d]/g,''))+'">'+value(phone)+'</a></dd></div>':'')+
          (email?'<div><dt>Email / Assistenza</dt><dd><a href="mailto:'+value(email)+'">'+value(email)+'</a></dd></div>':'')+
        '</dl>'+
        (action?'<p class="ib-partner-next"><strong>Next action / Prossimo passo</strong><br>'+value(action)+'</p>':'')+
        (hasRoute?'<button class="btn ib-partner-link" type="button" data-partner-route="'+value(route)+'">Open details →</button>':'')+
      '</article>';
    }).join('');
    root.innerHTML=pageHead('Partners & support','One card per company: named contacts, support channels and the next action, using the existing vendor register.')+
      '<div class="ib-partners-grid">'+cards+'</div>';
    root.querySelectorAll('[data-partner-route]').forEach(btn=>btn.addEventListener('click',()=>{
      App.page=btn.dataset.partnerRoute;render();
    }));
  };
  try{organizedNav();}catch(e){}
})();