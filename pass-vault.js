(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let activeFilter='all';

  const passIndex=[
    {id:'PASS-001',category:'network',system:'SonicWALL',accessType:'Firewall Admin',owner:'IT / to confirm',location:'NYC Store',status:'Review',secret:true,note:'Registration / ownership requires review.'},
    {id:'PASS-002',category:'network',system:'Spectrum Router',accessType:'Router Admin',owner:'Store / Corporate',location:'NYC Store',status:'Incomplete',secret:false,note:'Source record does not clearly identify the password.'},
    {id:'PASS-003',category:'network',system:'IBUSA Wi-Fi',accessType:'Wi-Fi Access',owner:'Italy IT',location:'NYC Store',status:'Active',secret:true,note:'Trusted store wireless network.'},
    {id:'PASS-004',category:'network',system:'IBUSA-GUEST Wi-Fi',accessType:'Guest Wi-Fi',owner:'Italy IT',location:'NYC Store',status:'Review',secret:true,note:'Guest configuration should be validated.'},
    {id:'PASS-005',category:'network',system:'WatchGuard Firewall',accessType:'Status / Read Access',owner:'Italy IT',location:'NYC Store',status:'Active',secret:true,note:'Read/status account.'},
    {id:'PASS-006',category:'network',system:'WatchGuard Firewall',accessType:'Administrator',owner:'Italy IT',location:'NYC Store',status:'Active',secret:true,note:'Administrative account.'},
    {id:'PASS-007',category:'remote',system:'Cashier Computer',accessType:'TeamViewer',owner:'Store / IT',location:'Cashier PC',status:'Active',secret:true,note:'Remote support credential.'},
    {id:'PASS-008',category:'remote',system:'Cashier Computer',accessType:'AnyDesk',owner:'Store / IT',location:'Cashier PC',status:'Active',secret:true,note:'Remote support credential.'},
    {id:'PASS-009',category:'computers',system:'Cashier Computer',accessType:'Windows Administrator',owner:'IT',location:'Cashier PC',status:'Active',secret:true,note:'Local administrator credential.'},
    {id:'PASS-010',category:'remote',system:'Store Manager PC',accessType:'TeamViewer',owner:'Store Manager / IT',location:'Manager PC',status:'Active',secret:true,note:'Remote support credential.'},
    {id:'PASS-011',category:'remote',system:'Store Manager PC',accessType:'AnyDesk',owner:'Store Manager / IT',location:'Manager PC',status:'Active',secret:true,note:'Remote support credential.'},
    {id:'PASS-012',category:'computers',system:'Store Manager PC',accessType:'Windows Administrator',owner:'IT',location:'Manager PC',status:'Active',secret:true,note:'Local administrator credential.'},
    {id:'PASS-013',category:'retail',system:'PC Server Prism',accessType:'Prism / Windows User',owner:'Store / IT',location:'Prism Server',status:'Active',secret:true,note:'Prism server login.'},
    {id:'PASS-014',category:'remote',system:'PC Server Prism',accessType:'AnyDesk',owner:'IT',location:'Prism Server',status:'Active',secret:true,note:'Remote access to Prism server.'},
    {id:'PASS-015',category:'retail',system:'Akite SHOP.NET',accessType:'Application Login',owner:'Store Manager',location:'NYC Store',status:'Active',secret:true,note:'Retail application access.'},
    {id:'PASS-016',category:'retail',system:'POS.NET',accessType:'Application Login',owner:'Store / IT',location:'NYC Store',status:'Incomplete',secret:true,note:'Username / account identity still needs validation.'}
  ];

  document.addEventListener('DOMContentLoaded',()=>waitForVaultCore().then(initPassVault).catch(console.error));

  function waitForVaultCore(){
    return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{
      n++;
      try{
        if(typeof App!=='undefined'&&App.nav?.project_manager?.some(x=>x[0]==='credentials')&&typeof renderPage==='function'){
          clearInterval(t);resolve();return;
        }
      }catch(e){}
      if(n>160){clearInterval(t);reject(new Error('Pass workspace could not initialize'));}
    },50)});
  }

  function initPassVault(){
    replaceCredentialsNavigation();
    patchPassRouting();
    renderNav();
  }

  function replaceCredentialsNavigation(){
    ['project_manager','management'].forEach(role=>{
      const list=App.nav[role];if(!list)return;
      const old=list.findIndex(x=>x[0]==='credentials');
      if(old>=0)list.splice(old,1);
      if(!list.some(x=>x[0]==='pass')){
        const anchor=role==='project_manager'?'systems':'decisions';
        const idx=list.findIndex(x=>x[0]===anchor);
        list.splice(idx>=0?idx+1:list.length,0,['pass','◈','Pass']);
      }
    });
  }

  function patchPassRouting(){
    const previous=renderPage;
    renderPage=function(){
      if(App.page==='pass'){renderPassPage();return;}
      previous();
    };
  }

  function renderPassPage(){
    const root=q('#pageRoot');if(!root)return;
    const connected=Boolean(window.IB_CONFIG?.credentials?.sheetConnected);
    const total=passIndex.length;
    const review=passIndex.filter(x=>x.status!=='Active').length;
    const categories=new Set(passIndex.map(x=>x.category)).size;
    root.innerHTML=`${pageHead('Pass & Access','Organize store credentials by system, owner and purpose while keeping raw secrets outside the public web app.','ACCESS & CREDENTIALS')}
      <div class="pass-shell">
        <div class="pass-hero">
          <div class="pass-summary">
            <div class="pass-stat"><strong>${total}</strong><span>Credential records organized</span></div>
            <div class="pass-stat"><strong>${categories}</strong><span>Operational categories</span></div>
            <div class="pass-stat"><strong>${review}</strong><span>Need review / completion</span></div>
          </div>
          <div class="pass-connection">
            <div><div class="eyebrow">PRIVATE DATA SOURCE</div><h3>Google Sheet Vault</h3><p>The sensitive credential file is kept separate from GitHub and Netlify. The app currently shows a safe index with masked secrets; authenticated Sheet access can be connected next.</p></div>
            <div class="pass-connection-row"><span class="pass-live-badge"><i></i>${connected?'Connected securely':'Structured vault ready · connection pending'}</span><button class="pass-connect-btn" id="passConnectSheet">${connected?'Manage connection':'Connect private Sheet'}</button></div>
          </div>
        </div>
        <div class="pass-security-note"><div class="pass-security-icon">🔒</div><div><strong>The real passwords are not committed to this public repository.</strong><br>The uploaded credential file has been reorganized into a private structured Google Sheet. This page deliberately displays masked secrets until real user authentication and the private Apps Script connection are enabled.</div></div>
        <div class="panel">
          <div class="pass-controls">
            <div class="pass-tabs">
              ${tabButton('all','All')}${tabButton('network','Network & Wi-Fi')}${tabButton('remote','Remote Access')}${tabButton('computers','Store PCs')}${tabButton('retail','Retail / POS')}
            </div>
            <div class="pass-search"><span>⌕</span><input id="passSearch" type="search" placeholder="Search system, owner, or access type..."></div>
          </div>
          <div id="passTableWrap">${passTable(passIndex)}</div>
        </div>
      </div>`;
    q('#passConnectSheet').onclick=openPassSetup;
    qa('[data-pass-filter]').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.passFilter;qa('[data-pass-filter]').forEach(x=>x.classList.toggle('active',x.dataset.passFilter===activeFilter));filterPassRows();});
    q('#passSearch').addEventListener('input',filterPassRows);
  }

  function tabButton(id,label){return `<button class="pass-tab ${activeFilter===id?'active':''}" data-pass-filter="${id}">${safe(label)}</button>`}

  function filterPassRows(){
    const term=(q('#passSearch')?.value||'').trim().toLowerCase();
    const rows=passIndex.filter(x=>(activeFilter==='all'||x.category===activeFilter)&&(!term||[x.system,x.accessType,x.owner,x.location,x.note].join(' ').toLowerCase().includes(term)));
    const host=q('#passTableWrap');if(host)host.innerHTML=passTable(rows);
  }

  function passTable(rows){
    if(!rows.length)return '<div class="empty">No credential records match this filter.</div>';
    return `<div class="table-wrap"><table class="pass-table"><thead><tr><th>ID</th><th>System / Device</th><th>Access</th><th>Secret</th><th>Owner</th><th>Location</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe(r.id)}</td><td><div class="pass-system">${safe(r.system)}<small>${safe(r.note)}</small></div></td><td>${safe(r.accessType)}</td><td><span class="pass-secret"><span class="pass-lock">●</span><code>${r.secret?'••••••••••••':'Not recorded'}</code></span></td><td><div class="pass-owner"><strong>${safe(r.owner)}</strong><span>Private Sheet owner field</span></div></td><td>${safe(r.location)}</td><td><span class="pass-status ${statusClass(r.status)}">${safe(r.status)}</span></td><td><div class="pass-row-actions"><button class="pass-icon-btn" disabled title="Enabled after secure Sheet connection">◉</button><button class="pass-icon-btn" disabled title="Copy is disabled until authenticated vault connection">⧉</button></div></td></tr>`).join('')}</tbody></table></div>`;
  }

  function statusClass(v){const s=String(v||'').toLowerCase();if(s==='active')return'active';if(s.includes('incomplete'))return'incomplete';return'review';}

  function openPassSetup(){
    const root=q('#modalRoot');if(!root)return;
    const hasUrl=Boolean(window.IB_CONFIG?.credentials?.sheetUrl);
    root.innerHTML=`<div class="modal-backdrop" id="passSetupBackdrop"><div class="modal pass-setup-modal"><div class="modal-head"><div><div class="eyebrow">PRIVATE CREDENTIAL CONNECTION</div><h2>Connect Google Sheet Vault</h2></div><button class="icon-btn" id="passSetupClose">×</button></div><div class="pass-security-note"><div class="pass-security-icon">✓</div><div><strong>The structured private vault already exists.</strong><br>We keep raw secrets in the private Sheet and keep the public GitHub/Netlify frontend secret-free.</div></div><div class="pass-setup-list"><div class="pass-setup-step"><b>1</b><div><strong>Private Sheet</strong><span>Credential rows are organized by category, system/device, access type, owner, secret, endpoint, status and notes.</span></div></div><div class="pass-setup-step"><b>2</b><div><strong>Authenticated Apps Script</strong><span>Deploy the backend under the company Google account and validate the signed-in user before returning any sensitive field.</span></div></div><div class="pass-setup-step"><b>3</b><div><strong>Role-based reveal</strong><span>Only approved Management / IT roles receive Reveal or Copy controls. Every reveal should be logged in the activity register.</span></div></div></div><div class="modal-actions"><button class="btn" id="passSetupDone">Close</button>${hasUrl?'<button class="btn primary" id="passOpenSheet">Open private Sheet</button>':''}</div></div></div>`;
    q('#passSetupClose').onclick=close;q('#passSetupDone').onclick=close;q('#passSetupBackdrop').onclick=e=>{if(e.target===e.currentTarget)close()};
    if(hasUrl)q('#passOpenSheet').onclick=()=>window.open(window.IB_CONFIG.credentials.sheetUrl,'_blank','noopener');
    function close(){q('#passSetupBackdrop')?.remove();}
  }
})();
