(function(){
  if(typeof App==='undefined'||typeof renderPage!=='function')return;
  const PAGE_ID='retail_systems';
  const safe=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const matchesRetail=s=>/retail|prism|stealth|shop\.net|pos\.net/i.test([s?.name,s?.vendor,s?.details,s?.contactWhen].filter(Boolean).join(' '));

  function addNav(){
    ['project_manager','it_admin','store_manager'].forEach(role=>{
      const list=App.nav?.[role];if(!list||list.some(x=>x[0]===PAGE_ID))return;
      const anchor=list.findIndex(x=>x[0]==='systems');
      list.splice(anchor>=0?anchor+1:list.length,0,[PAGE_ID,'▣','Retail Systems']);
    });
  }

  function systemRows(){
    const data=(App.data?.systems||[]).filter(matchesRetail);
    const fallback=[
      {id:'SYS-0001',name:'Retail Pro Prism',owner:'Damiano / Italy IT',vendor:'Retail Pro Support',status:'Needs Validation',credentialLocation:'Pass & Access / private vault',supportName:'Retail Pro Support / Italy IT',supportPhone:'To confirm',supportEmail:'To confirm',supportHours:'To confirm',contactWhen:'Prism login, synchronization, peripheral communication, port 8081, application availability or remote access issues.',contactHow:'Use the confirmed support channel; include store, workstation/server affected, exact error, time, screenshots and whether Italy remote access is working.',credentialRef:'PASS-013 / Pass & Access',details:'Retail / POS application and Prism server path.'},
      {id:'SYS-0009',name:'Stealth',owner:'Store / Italy IT · confirm',vendor:'Application support · confirm',status:'Documentation Required',credentialLocation:'Pass & Access / private vault',supportName:'To confirm with Damiano',supportPhone:'To confirm',supportEmail:'To confirm',supportHours:'To confirm',contactWhen:'Application login, configuration, connectivity, sync or store workstation issues related to Stealth.',contactHow:'Confirm the official support contact before use. Record case number, person contacted and resolution notes.',credentialRef:'Pass & Access · record to confirm',details:'Store application referenced during Retail Pro / workstation setup.'},
      {id:'SYS-0010',name:'Akite SHOP.NET',owner:'Lisa / Store',vendor:'Italy IT / application support · confirm',status:'Active / Support details pending',credentialLocation:'Pass & Access / private vault',supportName:'To confirm',supportPhone:'To confirm',supportEmail:'To confirm',supportHours:'To confirm',contactWhen:'SHOP.NET login, account, data or application issues.',contactHow:'Use the support contact confirmed by Italy IT. Provide the store account context and issue details.',credentialRef:'PASS-015 / Pass & Access',details:'Retail application account used by the store manager.'},
      {id:'SYS-0011',name:'POS.NET',owner:'Store / IT',vendor:'Italy IT / application support · confirm',status:'Needs Documentation',credentialLocation:'Pass & Access / private vault',supportName:'To confirm',supportPhone:'To confirm',supportEmail:'To confirm',supportHours:'To confirm',contactWhen:'POS.NET login, account, configuration or application issues.',contactHow:'Confirm official support ownership and account identity before escalation.',credentialRef:'PASS-016 / Pass & Access',details:'Retail application record currently incomplete in the access register.'}
    ];
    const byName=new Map(data.map(x=>[String(x.name||'').toLowerCase(),x]));
    fallback.forEach(x=>{if(!byName.has(x.name.toLowerCase()))data.push(x)});
    return data;
  }

  function value(v,fallback='To confirm'){const s=String(v??'').trim();return s||fallback}
  function field(label,val){return '<div class="retail-field"><span>'+safe(label)+'</span><strong>'+safe(val)+'</strong></div>'}
  function renderCard(s){
    return '<article class="retail-card">'+
      '<div class="retail-card-head"><div><h3>'+safe(s.name)+'</h3><small>'+safe(s.id||'Retail application')+' · '+safe(value(s.vendor,'Support ownership to confirm'))+'</small></div><span class="retail-status">'+safe(value(s.status,'Review'))+'</span></div>'+
      '<div class="retail-card-body">'+
        field('Purpose / details',value(s.details,s.description||'Store retail application and support reference.'))+
        field('Owner',value(s.owner))+
        field('Support contact',value(s.supportName,s.supportContact||s.vendor))+
        field('Phone',value(s.supportPhone))+
        field('Email',value(s.supportEmail))+
        field('Support hours',value(s.supportHours))+
        field('When to contact',value(s.contactWhen,'Use for application-specific incidents after basic store/network checks.'))+
        field('How to contact',value(s.contactHow,'Record the issue, impact, device/user affected, error message, case number and outcome.'))+
        field('Access record',value(s.credentialRef,s.credentialLocation||'Pass & Access'))+
      '</div>'+
      '<div class="retail-card-actions"><button data-retail-pass>Open Pass & Access</button><button data-retail-systems>Open full Systems register</button></div>'+
    '</article>';
  }

  function renderRetail(){
    const root=document.querySelector('#pageRoot');if(!root)return;
    const rows=systemRows();
    root.innerHTML=pageHead('Retail Pro & Store Applications','Support contacts, escalation reasons, owners and access references for the retail systems used by the NYC store.','RETAIL SYSTEMS & SUPPORT')+
      '<div class="retail-shell">'+
        '<section class="retail-intro"><div><strong>One place to know who to call and why.</strong><p>This page keeps operational support information together. Account access stays referenced through the existing Pass & Access workspace.</p></div><span class="retail-secure">● Support directory</span></section>'+
        '<div class="retail-grid">'+rows.map(renderCard).join('')+'</div>'+
        '<div class="retail-support-grid">'+
          '<section class="hub-v2-panel"><div class="hub-v2-panel-head"><div><h3>Before contacting support</h3><p>Capture these details so the escalation is useful and traceable.</p></div></div><ul class="retail-list">'+
            '<li><div><strong>1. Business impact</strong><small>What cannot be done: sale, login, sync, reporting, remote support, etc.</small></div><b>Required</b></li>'+
            '<li><div><strong>2. Exact error and device</strong><small>Screenshot, workstation/server, user and approximate time.</small></div><b>Required</b></li>'+
            '<li><div><strong>3. Basic checks already completed</strong><small>Internet, VPN, restart, affected users and whether other retail apps still work.</small></div><b>Useful</b></li>'+
            '<li><div><strong>4. Case number and result</strong><small>Record who was contacted, ticket number, action taken and follow-up owner.</small></div><b>Track it</b></li>'+
          '</ul></section>'+
          '<section class="hub-v2-panel"><div class="hub-v2-panel-head"><div><h3>Access reference</h3><p>Keep operational support and account access separated.</p></div></div><div class="retail-note"><strong>Use Pass & Access for store account records.</strong><br><br>This directory should contain the support contact, why to contact them, and the account reference needed to find the matching access record.</div></section>'+
        '</div>'+
      '</div>';
    root.querySelectorAll('[data-retail-pass]').forEach(b=>b.onclick=()=>{App.page='pass';render()});
    root.querySelectorAll('[data-retail-systems]').forEach(b=>b.onclick=()=>{App.page='systems';render()});
  }

  addNav();
  const baseRenderPage=renderPage;
  renderPage=function(){if(App.page===PAGE_ID)return renderRetail();return baseRenderPage();};
  try{renderNav();}catch(e){}
})();