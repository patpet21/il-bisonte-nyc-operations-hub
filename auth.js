(function(){
  const SESSION_KEY='ib_auth_session_v02';
  const LEGACY_SESSION_KEY='ib_auth_session_v01';
  const q=(s,r=document)=>r.querySelector(s);
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cfg=()=>window.IB_CONFIG?.auth||{};
  const firebaseCfg=()=>cfg().firebase||{};
  let session=loadSession();
  let bootstrapData=null;
  let authorizedSession=null;
  let resolveAuthorized;
  const authorizedPromise=new Promise(resolve=>{resolveAuthorized=resolve;});

  function decodeJwt(token){
    try{const p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(atob(p).split('').map(c=>'%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')))}catch(e){return {}}
  }
  function isExpired(token,skew=60){const p=decodeJwt(token||'');return Boolean(p.exp&&Date.now()/1000>Number(p.exp)-skew)}
  function loadSession(){
    try{
      let s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
      if(!s){s=JSON.parse(localStorage.getItem(LEGACY_SESSION_KEY)||'null');if(s){s.provider=s.provider||'google';localStorage.setItem(SESSION_KEY,JSON.stringify(s));localStorage.removeItem(LEGACY_SESSION_KEY)}}
      if(!s)return null;
      if(s.idToken&&isExpired(s.idToken,0)&&s.provider!=='firebase'){localStorage.removeItem(SESSION_KEY);return null}
      return s;
    }catch(e){return null}
  }
  function saveSession(s){session=s;if(s)localStorage.setItem(SESSION_KEY,JSON.stringify(s));else{localStorage.removeItem(SESSION_KEY);localStorage.removeItem(LEGACY_SESSION_KEY)}}
  function initials(name,email){const t=String(name||email||'IB').trim().split(/\s+/).filter(Boolean);return (t.length>1?t[0][0]+t[t.length-1][0]:String(t[0]||'IB').slice(0,2)).toUpperCase()}
  function current(){return session}
  function token(){return session?.idToken||''}
  function whenAuthorized(){return authorizedSession?Promise.resolve(authorizedSession):authorizedPromise}
  function takeBootstrapData(){const data=bootstrapData;bootstrapData=null;return data}

  async function backend(action,payload={}){
    await ensureFreshToken();
    const url=window.IB_CONFIG?.appsScriptUrl;
    if(!url)throw new Error('Apps Script URL is not configured');
    const body=new URLSearchParams({action,payload:JSON.stringify(payload),idToken:token()});
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});
    if(!res.ok)throw new Error(`Backend error ${res.status}`);
    const json=await res.json();if(json.error)throw new Error(json.error);return json.data;
  }

  async function ensureFreshToken(){
    if(!session?.idToken)return;
    if(!isExpired(session.idToken,120))return;
    if(session.provider!=='firebase'||!session.refreshToken){saveSession(null);throw new Error('Your session has expired. Please sign in again.');}
    const apiKey=firebaseCfg().apiKey;if(!apiKey)throw new Error('Firebase Authentication is not configured');
    const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken});
    const res=await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});
    const json=await res.json();
    if(!res.ok||!json.id_token){saveSession(null);throw new Error('Your email/password session has expired. Please sign in again.');}
    session.idToken=json.id_token;session.refreshToken=json.refresh_token||session.refreshToken;saveSession(session);
  }

  async function bootstrap(){
    mountGate();
    if(cfg().mode==='demo'){
      if(session?.profile){applyAuthorizedSession(session);completeAuthorization(session);return session}
      renderDemoLogin();return null;
    }
    if(session?.idToken){
      renderOpening(session.profile);
      try{return await resolveProductionSession(true)}catch(e){saveSession(null);renderSignIn(e.message&&/expired|invalid/i.test(e.message)?'Your previous session ended. Sign in again.':'');return null}
    }
    renderSignIn();return null;
  }

  function mountGate(){if(q('#authRoot'))return;const root=document.createElement('div');root.id='authRoot';document.body.appendChild(root)}
  function shell(inner){q('#authRoot').innerHTML=`<div class="auth-overlay"><div class="auth-shell"><section class="auth-brand"><div><div class="auth-brand-mark">✦</div><h1>Il Bisonte<br>NYC Operations</h1><p>Private workspace for store requests, projects, vendors, procedures, access governance and management visibility.</p></div><div class="auth-brand-foot">New York · Private Operations Hub</div></section><section class="auth-panel">${inner}</section></div></div>`}
  function renderOpening(profile={}){shell(`<div class="auth-eyebrow">Secure access</div><h2>Opening workspace</h2><p>Verifying ${safe(profile.displayName||profile.email||'your account')} and loading your authorized workspace.</p><div class="auth-loading"><span></span><strong>Signing you in…</strong></div>`)}
  function renderConfigMissing(){shell(`<div class="auth-eyebrow">Authentication setup</div><h2>Sign-in configuration incomplete</h2><p>The application needs its Google OAuth Client ID and Firebase web authentication settings before production sign-in can continue.</p>`)}

  function renderSignIn(message=''){
    const googleReady=Boolean(cfg().googleClientId);
    const emailReady=Boolean(firebaseCfg().apiKey&&firebaseCfg().projectId);
    shell(`<div class="auth-eyebrow">Secure access</div><h2>Sign in</h2><p>Use Google, or use your approved work email and password.</p>${message?`<div class="auth-inline-error">${safe(message)}</div>`:''}${googleReady?'<div id="googleSignInHost" class="auth-google-host"></div>':''}${googleReady&&emailReady?'<div class="auth-separator">or</div>':''}${emailReady?`<form id="emailPasswordForm" class="auth-email-form"><label>Work email<input name="email" type="email" autocomplete="username" required placeholder="name@company.com"></label><label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Password"></label><button class="btn primary auth-email-submit" type="submit">Sign in with email</button><button class="auth-reset-link" type="button" id="authForgotPassword">Forgot password?</button></form>`:''}<div class="auth-note">Google and Firebase handle authentication. The Operations Hub stores your work identity, role, approval status and operational permissions — never your password.</div>`);
    if(!googleReady&&!emailReady){renderConfigMissing();return}
    if(googleReady)waitForGoogle().then(()=>{google.accounts.id.initialize({client_id:cfg().googleClientId,callback:onGoogleCredential,auto_select:false,cancel_on_tap_outside:false});google.accounts.id.renderButton(q('#googleSignInHost'),{theme:'outline',size:'large',shape:'rectangular',text:'continue_with',width:330})}).catch(()=>{});
    if(emailReady){q('#emailPasswordForm').onsubmit=onEmailPasswordSubmit;q('#authForgotPassword').onclick=forgotPassword}
  }
  function waitForGoogle(){return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.google?.accounts?.id){clearInterval(t);resolve()}else if(++n>100){clearInterval(t);reject(new Error('Google Identity Services did not load'))}},50)})}

  async function onGoogleCredential(response){
    try{
      const p=decodeJwt(response.credential);saveSession({provider:'google',idToken:response.credential,profile:{email:p.email||'',displayName:p.name||p.email||'',picture:p.picture||'',sub:p.sub||''}});renderOpening(session.profile);await resolveProductionSession(true);
    }catch(e){saveSession(null);renderSignIn(e.message||'Unable to sign in with Google')}
  }

  async function onEmailPasswordSubmit(e){
    e.preventDefault();const form=e.currentTarget;const submit=q('.auth-email-submit',form);const fd=new FormData(form);const email=String(fd.get('email')||'').trim().toLowerCase(),password=String(fd.get('password')||'');
    if(submit){submit.disabled=true;submit.textContent='Signing in…'}
    try{
      const auth=await firebasePasswordSignIn(email,password);
      saveSession({provider:'firebase',idToken:auth.idToken,refreshToken:auth.refreshToken||'',profile:{email:auth.email||email,displayName:auth.displayName||auth.email||email,sub:auth.localId||''}});
      renderOpening(session.profile);await resolveProductionSession(true);
    }catch(err){saveSession(null);renderSignIn(firebaseErrorMessage(err))}
  }

  async function firebasePasswordSignIn(email,password){
    const apiKey=firebaseCfg().apiKey;if(!apiKey)throw new Error('Firebase Authentication is not configured');
    const res=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    const json=await res.json();if(!res.ok)throw new Error(json?.error?.message||'EMAIL_PASSWORD_SIGN_IN_FAILED');return json;
  }

  function firebaseErrorMessage(err){
    const code=String(err?.message||err||'');
    if(/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/i.test(code))return 'Email or password is incorrect.';
    if(/USER_DISABLED/i.test(code))return 'This account has been disabled.';
    if(/TOO_MANY_ATTEMPTS/i.test(code))return 'Too many attempts. Try again later or reset the password.';
    if(/NETWORK|fetch/i.test(code))return 'Unable to reach the authentication service. Check the connection and try again.';
    return code.replace(/_/g,' ').toLowerCase().replace(/^./,c=>c.toUpperCase());
  }

  async function forgotPassword(){
    const email=String(q('#emailPasswordForm input[name="email"]')?.value||'').trim().toLowerCase();
    if(!email){renderSignIn('Enter your work email first, then choose Forgot password.');return}
    try{
      const apiKey=firebaseCfg().apiKey;const res=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestType:'PASSWORD_RESET',email})});
      const json=await res.json();if(!res.ok)throw new Error(json?.error?.message||'PASSWORD_RESET_FAILED');
      shell(`<div class="auth-eyebrow">Password reset</div><h2>Check your email</h2><p>If an email/password account exists for <strong>${safe(email)}</strong>, Firebase has sent password-reset instructions.</p><div class="auth-actions"><button class="btn primary" id="authBackToSignIn">Back to sign in</button></div>`);q('#authBackToSignIn').onclick=()=>renderSignIn();
    }catch(err){renderSignIn(firebaseErrorMessage(err))}
  }

  async function resolveProductionSession(withWorkspace=false){
    const data=await backend(withWorkspace?'bootstrap':'getSession');
    session.user=data.user;session.permissions=data.permissions||{};if(data.identity){session.profile={...(session.profile||{}),email:data.identity.email||session.profile?.email||'',displayName:data.identity.name||session.profile?.displayName||'',sub:data.identity.sub||session.profile?.sub||''}}saveSession(session);
    const status=String(data.user?.status||'').toLowerCase();
    if(status==='approved'){
      if(data.workspace)bootstrapData=data.workspace;
      applyAuthorizedSession(session);completeAuthorization(session);return session;
    }
    if(status==='pending'){renderPending(data.user);return null}
    if(status==='rejected'){renderRejected(data.user);return null}
    renderRequestAccess(data.identity||session.profile);return null;
  }

  function completeAuthorization(s){
    authorizedSession=s;resolveAuthorized?.(s);waitForAppData().then(hideGate);
  }

  function renderRequestAccess(profile={}){
    shell(`<div class="auth-eyebrow">First access</div><h2>Request access</h2><p>Your identity is verified, but this account is not yet authorized for the Operations Hub.</p><form id="authRequestForm" class="access-form"><label>Full name<input name="displayName" required value="${safe(profile.displayName||profile.name||'')}"></label><label>Work email<input name="email" type="email" readonly value="${safe(profile.email||'')}"></label><label>Requested role<select name="role"><option value="store_manager">Store Manager</option><option value="project_manager">Project Manager</option><option value="management">Management</option><option value="it_admin">IT Admin</option><option value="read_only">Read Only</option></select></label><label>Store / location<input name="store" value="${safe(window.IB_CONFIG.storeName||'New York')}"></label><div class="auth-actions"><button class="btn primary" type="submit">Submit access request</button><button class="btn" type="button" id="authSignOutRequest">Sign out</button></div></form>`);
    q('#authSignOutRequest').onclick=signOut;q('#authRequestForm').onsubmit=async e=>{e.preventDefault();const payload=Object.fromEntries(new FormData(e.currentTarget).entries());try{const row=await backend('requestAccess',payload);session.user=row;saveSession(session);renderPending(row)}catch(err){renderAuthError(err.message)}};
  }
  function renderPending(user){shell(`<div class="auth-eyebrow">Access governance</div><h2>Approval pending</h2><p>Your identity is verified. An authorized administrator must approve your access before the workspace opens.</p><div class="auth-user-card"><div class="auth-user-avatar">${safe(initials(user.displayName,user.email))}</div><div class="auth-user-main"><strong>${safe(user.displayName||user.email)}</strong><span>${safe(user.email)} · ${safe(prettyRole(user.role))}</span></div><span class="auth-status pending">Pending</span></div><div class="auth-note">Requested for: ${safe(user.store||window.IB_CONFIG.storeName)}<br>Requested: ${safe(user.requestedAt||'Now')}</div><div class="auth-actions"><button class="btn" id="authRefreshApproval">Check approval</button><button class="btn" id="authPendingSignOut">Sign out</button></div>`);q('#authRefreshApproval').onclick=()=>resolveProductionSession(true).catch(e=>renderAuthError(e.message));q('#authPendingSignOut').onclick=signOut}
  function renderRejected(user){shell(`<div class="auth-eyebrow">Access governance</div><h2>Access not approved</h2><p>This account does not currently have permission to enter the Operations Hub.</p><div class="auth-user-card"><div class="auth-user-avatar">${safe(initials(user.displayName,user.email))}</div><div class="auth-user-main"><strong>${safe(user.displayName||user.email)}</strong><span>${safe(user.email)}</span></div><span class="auth-status rejected">Rejected</span></div><div class="auth-actions"><button class="btn" id="authRejectedSignOut">Sign out</button></div>`);q('#authRejectedSignOut').onclick=signOut}
  function renderAuthError(message){shell(`<div class="auth-eyebrow">Authentication</div><h2>Unable to continue</h2><p>${safe(message)}</p><div class="auth-actions"><button class="btn" id="authErrorRetry">Try again</button><button class="btn" id="authErrorOut">Sign out</button></div>`);q('#authErrorRetry').onclick=()=>bootstrap();q('#authErrorOut').onclick=signOut}

  function renderDemoLogin(){shell(`<div class="auth-eyebrow">Prototype access</div><h2>Sign in to the demo</h2><p>This prototype uses local demo identities.</p><div class="auth-demo-grid"><button class="auth-demo-btn" data-demo-role="store_manager"><strong>Store Manager</strong><span>Daily store workspace</span></button><button class="auth-demo-btn" data-demo-role="project_manager"><strong>Project Manager</strong><span>Projects, issues and vendors</span></button><button class="auth-demo-btn" data-demo-role="management"><strong>Management</strong><span>Executive view and approvals</span></button><button class="auth-demo-btn" data-demo-role="it_admin"><strong>IT Admin</strong><span>Systems and privileged access</span></button></div>`);document.querySelectorAll('[data-demo-role]').forEach(b=>b.onclick=()=>demoSignIn(b.dataset.demoRole))}
  function demoSignIn(role){const profiles={store_manager:['Store Manager','demo.store@ilbisonte.local'],project_manager:['Project Manager','demo.pm@ilbisonte.local'],management:['Management','demo.management@ilbisonte.local'],it_admin:['IT Admin','demo.it@ilbisonte.local']};const p=profiles[role]||profiles.project_manager;saveSession({provider:'demo',profile:{displayName:p[0],email:p[1]},user:{displayName:p[0],email:p[1],role,status:'Approved',store:window.IB_CONFIG.storeName},permissions:{demo:true}});applyAuthorizedSession(session);completeAuthorization(session)}

  function applyAuthorizedSession(s){
    window.IB_CURRENT_USER=s.user||s.profile||null;
    const apply=()=>{
      if(typeof App==='undefined')return false;
      const role=s.user?.role||'project_manager';App.role=App.nav?.[role]?role:'project_manager';App.page='dashboard';
      const sel=q('#roleSelect');const label=q('.role-label');if(sel){if(cfg().mode!=='demo'){sel.classList.add('auth-hidden');label?.classList.add('auth-hidden')}else sel.value=App.role}
      const avatar=q('.avatar');if(avatar){avatar.textContent=initials(s.user?.displayName||s.profile?.displayName,s.user?.email||s.profile?.email);avatar.title=s.user?.displayName||s.profile?.displayName||''}
      injectSignOut();if(App.data&&typeof render==='function')render();return true;
    };
    if(!apply()){let n=0;const t=setInterval(()=>{if(apply()||++n>100)clearInterval(t)},40)}
  }
  function injectSignOut(){const host=q('.topbar-actions');if(!host||q('#authSignOutBtn'))return;const b=document.createElement('button');b.id='authSignOutBtn';b.className='auth-signout';b.textContent='Sign out';b.onclick=signOut;host.appendChild(b)}
  function waitForAppData(){return new Promise(resolve=>{let n=0;const t=setInterval(()=>{if(typeof App!=='undefined'&&App.data){clearInterval(t);resolve()}else if(++n>250){clearInterval(t);resolve()}},30)})}
  function hideGate(){const r=q('#authRoot');if(r)r.innerHTML=''}
  function signOut(){try{window.google?.accounts?.id?.disableAutoSelect()}catch(e){}bootstrapData=null;authorizedSession=null;saveSession(null);location.reload()}
  function prettyRole(role){return ({store_manager:'Store Manager',project_manager:'Project Manager',management:'Management',it_admin:'IT Admin',read_only:'Read Only'})[role]||role}

  window.IBAuth={bootstrap,current,getToken:token,backend,signOut,prettyRole,whenAuthorized,takeBootstrapData,ensureFreshToken};
  document.addEventListener('DOMContentLoaded',bootstrap);
})();
