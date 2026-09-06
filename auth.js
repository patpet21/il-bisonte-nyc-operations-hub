(function(){
  const SESSION_KEY='ib_auth_session_v01';
  const q=(s,r=document)=>r.querySelector(s);
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cfg=()=>window.IB_CONFIG?.auth||{};
  let session=loadSession();

  function decodeJwt(token){
    try{const p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(atob(p).split('').map(c=>'%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')))}catch(e){return {}}
  }
  function loadSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');if(!s)return null;if(s.idToken){const p=decodeJwt(s.idToken);if(p.exp&&Date.now()/1000>p.exp-60){localStorage.removeItem(SESSION_KEY);return null}}return s}catch(e){return null}}
  function saveSession(s){session=s;if(s)localStorage.setItem(SESSION_KEY,JSON.stringify(s));else localStorage.removeItem(SESSION_KEY)}
  function initials(name,email){const t=String(name||email||'IB').trim().split(/\s+/).filter(Boolean);return (t.length>1?t[0][0]+t[t.length-1][0]:String(t[0]||'IB').slice(0,2)).toUpperCase()}
  function current(){return session}
  function token(){return session?.idToken||''}

  async function backend(action,payload={}){
    const url=window.IB_CONFIG?.appsScriptUrl;
    if(!url)throw new Error('Apps Script URL is not configured');
    const body=new URLSearchParams({action,payload:JSON.stringify(payload),idToken:token()});
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});
    if(!res.ok)throw new Error(`Backend error ${res.status}`);
    const json=await res.json();if(json.error)throw new Error(json.error);return json.data;
  }

  async function bootstrap(){
    mountGate();
    if(cfg().mode==='google'){
      if(!cfg().googleClientId){renderConfigMissing();return null}
      if(session?.idToken){try{return await resolveGoogleSession()}catch(e){saveSession(null)}}
      renderGoogleLogin();return null;
    }
    if(session?.profile){applyAuthorizedSession(session);hideGate();return session}
    renderDemoLogin();return null;
  }

  function mountGate(){
    if(q('#authRoot'))return;
    const root=document.createElement('div');root.id='authRoot';document.body.appendChild(root);
  }
  function shell(inner){q('#authRoot').innerHTML=`<div class="auth-overlay"><div class="auth-shell"><section class="auth-brand"><div><div class="auth-brand-mark">✦</div><h1>Il Bisonte<br>NYC Operations</h1><p>Private workspace for store requests, projects, vendors, procedures, access governance and management visibility.</p></div><div class="auth-brand-foot">New York · Private Operations Hub</div></section><section class="auth-panel">${inner}</section></div></div>`}
  function renderConfigMissing(){shell(`<div class="auth-eyebrow">Authentication setup</div><h2>Google sign-in is ready</h2><p>The application is configured for Google authentication, but a Google OAuth Client ID has not been added yet.</p><div class="auth-config-warning"><strong>One external setup step remains:</strong> create a Google Web OAuth Client ID and add the Netlify/custom domain as an authorized JavaScript origin. Then paste the Client ID into <code>IB_CONFIG.auth.googleClientId</code>. No passwords will be stored by this application.</div>`)}
  function renderGoogleLogin(){
    shell(`<div class="auth-eyebrow">Secure access</div><h2>Sign in</h2><p>Use your approved Google account. New users can request access and remain pending until Management approves them.</p><div id="googleSignInHost" class="auth-google-host"></div><div class="auth-note">Authentication is handled by Google. The Operations Hub stores only your identity, role, approval status and operational permissions.</div>`);
    waitForGoogle().then(()=>{google.accounts.id.initialize({client_id:cfg().googleClientId,callback:onGoogleCredential,auto_select:false,cancel_on_tap_outside:false});google.accounts.id.renderButton(q('#googleSignInHost'),{theme:'outline',size:'large',shape:'rectangular',text:'continue_with',width:330})}).catch(()=>renderConfigMissing());
  }
  function waitForGoogle(){return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.google?.accounts?.id){clearInterval(t);resolve()}else if(++n>100){clearInterval(t);reject(new Error('Google Identity Services did not load'))}},50)})}
  async function onGoogleCredential(response){
    try{
      const p=decodeJwt(response.credential);saveSession({idToken:response.credential,profile:{email:p.email||'',displayName:p.name||p.email||'',picture:p.picture||'',sub:p.sub||''}});await resolveGoogleSession();
    }catch(e){renderAuthError(e.message||'Unable to sign in')}
  }
  async function resolveGoogleSession(){
    const data=await backend('getSession');session.user=data.user;session.permissions=data.permissions||{};saveSession(session);
    if(String(data.user?.status||'').toLowerCase()==='approved'){applyAuthorizedSession(session);hideGate();return session}
    if(String(data.user?.status||'').toLowerCase()==='pending'){renderPending(data.user);return null}
    if(String(data.user?.status||'').toLowerCase()==='rejected'){renderRejected(data.user);return null}
    renderRequestAccess(data.identity||session.profile);return null;
  }
  function renderRequestAccess(profile={}){
    shell(`<div class="auth-eyebrow">First access</div><h2>Request access</h2><p>Your Google identity is verified, but this account is not yet authorized for the Operations Hub.</p><form id="authRequestForm" class="access-form"><label>Full name<input name="displayName" required value="${safe(profile.displayName||profile.name||'')}"></label><label>Work email<input name="email" type="email" readonly value="${safe(profile.email||'')}"></label><label>Requested role<select name="role"><option value="store_manager">Store Manager</option><option value="project_manager">Project Manager</option><option value="management">Management</option><option value="it_admin">IT Admin</option><option value="read_only">Read Only</option></select></label><label>Store / location<input name="store" value="${safe(window.IB_CONFIG.storeName||'New York')}"></label><div class="auth-actions"><button class="btn primary" type="submit">Submit access request</button><button class="btn" type="button" id="authSignOutRequest">Sign out</button></div></form>`);
    q('#authSignOutRequest').onclick=signOut;q('#authRequestForm').onsubmit=async e=>{e.preventDefault();const payload=Object.fromEntries(new FormData(e.currentTarget).entries());try{const row=await backend('requestAccess',payload);session.user=row;saveSession(session);renderPending(row)}catch(err){renderAuthError(err.message)}};
  }
  function renderPending(user){shell(`<div class="auth-eyebrow">Access governance</div><h2>Approval pending</h2><p>Your identity is verified. Management has been notified and must approve your access before the workspace opens.</p><div class="auth-user-card"><div class="auth-user-avatar">${safe(initials(user.displayName,user.email))}</div><div class="auth-user-main"><strong>${safe(user.displayName||user.email)}</strong><span>${safe(user.email)} · ${safe(prettyRole(user.role))}</span></div><span class="auth-status pending">Pending</span></div><div class="auth-note">Requested for: ${safe(user.store||window.IB_CONFIG.storeName)}<br>Requested: ${safe(user.requestedAt||'Now')}</div><div class="auth-actions"><button class="btn" id="authRefreshApproval">Check approval</button><button class="btn" id="authPendingSignOut">Sign out</button></div>`);q('#authRefreshApproval').onclick=()=>resolveGoogleSession().catch(e=>renderAuthError(e.message));q('#authPendingSignOut').onclick=signOut}
  function renderRejected(user){shell(`<div class="auth-eyebrow">Access governance</div><h2>Access not approved</h2><p>This account does not currently have permission to enter the Operations Hub.</p><div class="auth-user-card"><div class="auth-user-avatar">${safe(initials(user.displayName,user.email))}</div><div class="auth-user-main"><strong>${safe(user.displayName||user.email)}</strong><span>${safe(user.email)}</span></div><span class="auth-status rejected">Rejected</span></div><div class="auth-actions"><button class="btn" id="authRejectedSignOut">Sign out</button></div>`);q('#authRejectedSignOut').onclick=signOut}
  function renderAuthError(message){shell(`<div class="auth-eyebrow">Authentication</div><h2>Unable to continue</h2><p>${safe(message)}</p><div class="auth-actions"><button class="btn" id="authErrorRetry">Try again</button><button class="btn" id="authErrorOut">Sign out</button></div>`);q('#authErrorRetry').onclick=()=>bootstrap();q('#authErrorOut').onclick=signOut}

  function renderDemoLogin(){
    shell(`<div class="auth-eyebrow">Prototype access</div><h2>Sign in to the demo</h2><p>This prototype uses local demo identities. Production is already prepared for Google sign-in and Sheet-based roles.</p><div class="auth-demo-grid"><button class="auth-demo-btn" data-demo-role="store_manager"><strong>Store Manager</strong><span>Daily store workspace</span></button><button class="auth-demo-btn" data-demo-role="project_manager"><strong>Project Manager</strong><span>Projects, issues and vendors</span></button><button class="auth-demo-btn" data-demo-role="management"><strong>Management</strong><span>Executive view and approvals</span></button><button class="auth-demo-btn" data-demo-role="it_admin"><strong>IT Admin</strong><span>Systems and privileged access</span></button></div><div class="auth-note">Demo mode does not provide real security. When Google mode is enabled, the role switch disappears and every protected backend action is checked against the approved user record.</div>`);
    document.querySelectorAll('[data-demo-role]').forEach(b=>b.onclick=()=>demoSignIn(b.dataset.demoRole));
  }
  function demoSignIn(role){
    const profiles={store_manager:['Store Manager','demo.store@ilbisonte.local'],project_manager:['Project Manager','demo.pm@ilbisonte.local'],management:['Management','demo.management@ilbisonte.local'],it_admin:['IT Admin','demo.it@ilbisonte.local']};const p=profiles[role]||profiles.project_manager;
    saveSession({profile:{displayName:p[0],email:p[1]},user:{displayName:p[0],email:p[1],role,status:'Approved',store:window.IB_CONFIG.storeName},permissions:{demo:true}});applyAuthorizedSession(session);hideGate();
  }
  function applyAuthorizedSession(s){
    window.IB_CURRENT_USER=s.user||s.profile||null;
    waitForApp().then(()=>{
      const role=s.user?.role||'project_manager';if(App.nav[role])App.role=role;else if(role==='it_admin')App.role='project_manager';else App.role='project_manager';App.page='dashboard';
      const sel=q('#roleSelect');const label=q('.role-label');if(sel){if(cfg().mode==='google'){sel.classList.add('auth-hidden');label?.classList.add('auth-hidden')}else{sel.value=App.role}}
      const avatar=q('.avatar');if(avatar){avatar.textContent=initials(s.user?.displayName||s.profile?.displayName,s.user?.email||s.profile?.email);avatar.title=s.user?.displayName||s.profile?.displayName||''}
      injectSignOut();if(typeof render==='function')render();
    });
  }
  function injectSignOut(){const host=q('.topbar-actions');if(!host||q('#authSignOutBtn'))return;const b=document.createElement('button');b.id='authSignOutBtn';b.className='auth-signout';b.textContent='Sign out';b.onclick=signOut;host.appendChild(b)}
  function waitForApp(){return new Promise(resolve=>{let n=0;const t=setInterval(()=>{if(typeof App!=='undefined'&&App.data){clearInterval(t);resolve()}else if(++n>200){clearInterval(t);resolve()}},40)})}
  function hideGate(){const r=q('#authRoot');if(r)r.innerHTML=''}
  function signOut(){try{window.google?.accounts?.id?.disableAutoSelect()}catch(e){}saveSession(null);location.reload()}
  function prettyRole(role){return ({store_manager:'Store Manager',project_manager:'Project Manager',management:'Management',it_admin:'IT Admin',read_only:'Read Only'})[role]||role}

  window.IBAuth={bootstrap,current,getToken:token,backend,signOut,prettyRole};
  document.addEventListener('DOMContentLoaded',bootstrap);
})();
