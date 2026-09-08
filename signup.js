(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mounting=false;

  function firebaseCfg(){return window.IB_CONFIG?.auth?.firebase||{};}

  function signupErrorMessage(err){
    const code=String(err?.message||err||'');
    if(/EMAIL_EXISTS/i.test(code))return 'An account already exists for this email. Sign in instead.';
    if(/INVALID_EMAIL/i.test(code))return 'Enter a valid email address.';
    if(/WEAK_PASSWORD|PASSWORD_DOES_NOT_MEET_REQUIREMENTS/i.test(code))return 'Choose a stronger password with at least 8 characters.';
    if(/OPERATION_NOT_ALLOWED/i.test(code))return 'Email/password account creation is not enabled.';
    if(/TOO_MANY_ATTEMPTS/i.test(code))return 'Too many attempts. Try again later.';
    if(/NETWORK|fetch/i.test(code))return 'Unable to reach Firebase Authentication. Check the connection and try again.';
    return code.replace(/_/g,' ').toLowerCase().replace(/^./,c=>c.toUpperCase());
  }

  async function firebaseSignUp(email,password,displayName){
    const apiKey=firebaseCfg().apiKey;
    if(!apiKey)throw new Error('Firebase Authentication is not configured');
    const res=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})
    });
    const json=await res.json();
    if(!res.ok)throw new Error(json?.error?.message||'SIGN_UP_FAILED');
    if(displayName&&json.idToken){
      try{
        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(apiKey)}`,{
          method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:json.idToken,displayName,returnSecureToken:false})
        });
      }catch(e){}
    }
    return json;
  }

  function restoreSignIn(panel,signup){
    signup?.remove();
    [...panel.children].forEach(el=>{
      if(el.dataset.signupHidden==='1'){
        el.style.display=el.dataset.signupDisplay||'';
        delete el.dataset.signupHidden;
        delete el.dataset.signupDisplay;
      }
    });
  }

  function openSignup(){
    const panel=q('.auth-panel');
    const signInForm=q('#emailPasswordForm');
    if(!panel||!signInForm||q('#signupInline'))return;
    [...panel.children].forEach(el=>{
      el.dataset.signupHidden='1';
      el.dataset.signupDisplay=el.style.display||'';
      el.style.display='none';
    });
    const wrap=document.createElement('div');
    wrap.id='signupInline';
    wrap.innerHTML=`
      <div class="auth-eyebrow">New account</div>
      <h2>Create account</h2>
      <p>Create your identity first. Access to the Operations Hub is granted only after an administrator approves your request.</p>
      <div id="signupError" class="auth-inline-error" style="display:none"></div>
      <form id="signupForm" class="auth-email-form">
        <label>Full name<input name="displayName" type="text" autocomplete="name" required placeholder="Full name"></label>
        <label>Work email<input name="email" type="email" autocomplete="email" required placeholder="name@company.com"></label>
        <label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></label>
        <label>Confirm password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="Repeat password"></label>
        <button class="btn primary auth-signup-submit" type="submit">Create account</button>
        <button class="auth-reset-link" type="button" id="signupBack">Back to sign in</button>
      </form>
      <div class="auth-note">Creating an account does not grant access. After sign-up you will submit an access request and an IT Admin must approve it.</div>`;
    panel.appendChild(wrap);
    q('#signupBack').onclick=()=>restoreSignIn(panel,wrap);
    q('#signupForm').onsubmit=async e=>{
      e.preventDefault();
      const form=e.currentTarget,fd=new FormData(form),displayName=String(fd.get('displayName')||'').trim(),email=String(fd.get('email')||'').trim().toLowerCase(),password=String(fd.get('password')||''),confirm=String(fd.get('confirmPassword')||''),submit=q('.auth-signup-submit',form),error=q('#signupError');
      if(password!==confirm){error.textContent='Passwords do not match.';error.style.display='block';return;}
      if(password.length<8){error.textContent='Use at least 8 characters.';error.style.display='block';return;}
      submit.disabled=true;submit.textContent='Creating account…';error.style.display='none';
      try{
        await firebaseSignUp(email,password,displayName);
        restoreSignIn(panel,wrap);
        const liveForm=q('#emailPasswordForm');
        if(!liveForm)throw new Error('Sign-in form is unavailable');
        const emailInput=q('input[name="email"]',liveForm),passwordInput=q('input[name="password"]',liveForm);
        if(emailInput)emailInput.value=email;
        if(passwordInput)passwordInput.value=password;
        liveForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      }catch(err){
        submit.disabled=false;submit.textContent='Create account';error.textContent=signupErrorMessage(err);error.style.display='block';
      }
    };
  }

  function mount(){
    if(mounting)return;
    const form=q('#emailPasswordForm');
    if(!form||q('#authCreateAccount'))return;
    mounting=true;
    const btn=document.createElement('button');
    btn.type='button';btn.id='authCreateAccount';btn.className='auth-reset-link';btn.textContent='Create account';btn.onclick=openSignup;
    const forgot=q('#authForgotPassword');
    if(forgot)forgot.insertAdjacentElement('afterend',btn);else form.appendChild(btn);
    const note=document.createElement('div');
    note.className='auth-note auth-signup-note';
    note.textContent='New user? Create an account, then request access for administrator approval.';
    form.insertAdjacentElement('afterend',note);
    mounting=false;
  }

  const observer=new MutationObserver(()=>mount());
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#authRoot');if(root)observer.observe(root,{childList:true,subtree:true});
    mount();
  });
})();