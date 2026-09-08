/* Intuitive UI layer — rendering and wording only. Existing data/actions remain the source of truth. */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const MOBILE=()=>window.matchMedia('(max-width: 900px)').matches;

  document.addEventListener('DOMContentLoaded',ensureNavigationShell);
  document.addEventListener('DOMContentLoaded',()=>waitForCore().then(init).catch(console.error));

  function ensureNavigationShell(){
    const topbar=q('.topbar'),search=q('.search-wrap'),app=q('#app');
    if(!topbar||!search||!app)return;
    let btn=q('#sidebarToggle');
    if(!btn){
      btn=document.createElement('button');
      btn.id='sidebarToggle';btn.className='sidebar-toggle';btn.type='button';
      btn.setAttribute('aria-label','Open navigation');btn.setAttribute('aria-expanded','false');btn.innerHTML='<span aria-hidden="true">☰</span>';
      topbar.insertBefore(btn,search);
    }
    let screen=q('#sidebarScreen');
    if(!screen){screen=document.createElement('div');screen.className='sidebar-screen';screen.id='sidebarScreen';document.body.appendChild(screen)}
    if(btn.dataset.hubBound==='1')return;
    btn.dataset.hubBound='1';
    const close=()=>{app.classList.remove('sidebar-open');screen.classList.remove('visible');btn.setAttribute('aria-expanded','false')};
    btn.onclick=()=>{
      if(MOBILE()){
        const open=app.classList.toggle('sidebar-open');screen.classList.toggle('visible',open);btn.setAttribute('aria-expanded',String(open));
      }else{
        const collapsed=app.classList.toggle('sidebar-collapsed');localStorage.setItem('ib_sidebar_collapsed',collapsed?'1':'0');btn.setAttribute('aria-expanded',String(!collapsed));
      }
    };
    screen.onclick=close;
    document.addEventListener('click',e=>{if(MOBILE()&&e.target.closest?.('.nav-btn'))close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&MOBILE())close()});
  }

  function waitForCore(){
    return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{
      const ready=typeof App!=='undefined'&&App.data&&typeof renderPMDashboard==='function'&&typeof renderNav==='function'&&typeof render==='function';
      if(ready){clearInterval(t);resolve();return}
      if(++n>200){clearInterval(t);reject(new Error('Intuitive layout could not initialize'))}
    },50)})
  }

  function init(){
    ensureNavigationShell();
    renameWorkNavigation();
    installMobileSidebarTools();
    installDashboard();
    observeWorklogWording();
    renderNav();
    if(App.page==='dashboard')render();
  }

  function renameWorkNavigation(){
    Object.keys(App.nav||{}).forEach(role=>{
      (App.nav[role]||[]).forEach(item=>{
        if(item[0]==='pmworklog')item[2]='Peter Work Tracking';
      });
    });
  }

  function prettyRole(role){return ({store_manager:'Store Manager',project_manager:'Project Manager',management:'Management',it_admin:'IT Admin',read_only:'Read Only'})[role]||role||'User'}

  function installMobileSidebarTools(){
    const sidebar=q('.sidebar');if(!sidebar||q('#hubMobileTools'))return;
    const tools=document.createElement('div');tools.id='hubMobileTools';tools.className='hub-mobile-tools';
    const user=window.IB_CURRENT_USER||window.IBAuth?.current?.()?.user||{};
    const role=user.role||App.role||'project_manager';
    tools.innerHTML=`<div class="hub-mobile-account"><span>ACCOUNT</span><strong>${safe(user.displayName||prettyRole(role))}</strong><small>${safe(prettyRole(role))}</small></div>
      ${window.IB_CONFIG?.auth?.mode==='demo'?`<label class="hub-mobile-role">View as<select id="hubMobileRole"></select></label>`:''}
      <button type="button" data-hub-proxy="#ibAccessRequestBtn">Request access</button>
      <button type="button" data-hub-proxy="#ibInstallBtn">Install app</button>
      <button type="button" data-hub-proxy="#authSignOutBtn">Sign out</button>`;
    const foot=q('.sidebar-foot',sidebar);sidebar.insertBefore(tools,foot||null);
    const mobileRole=q('#hubMobileRole',tools),sourceRole=q('#roleSelect');
    if(mobileRole&&sourceRole){mobileRole.innerHTML=sourceRole.innerHTML;mobileRole.value=sourceRole.value;mobileRole.onchange=()=>{sourceRole.value=mobileRole.value;sourceRole.dispatchEvent(new Event('change',{bubbles:true}));q('#app')?.classList.remove('sidebar-open');q('#sidebarScreen')?.classList.remove('visible')}}
    qa('[data-hub-proxy]',tools).forEach(b=>b.onclick=()=>{const target=q(b.dataset.hubProxy);if(target)target.click();else if(typeof toast==='function')toast('This tool is still loading.');q('#app')?.classList.remove('sidebar-open');q('#sidebarScreen')?.classList.remove('visible')});
  }

  function installDashboard(){
    const previousPMDashboard=renderPMDashboard;
    renderPMDashboard=function(root){
      if(!['project_manager','it_admin'].includes(App.role))return previousPMDashboard(root);

      const data=App.data||{};
      const projects=data.projects||[],requests=data.requests||[],vendors=data.vendors||[],systems=data.systems||[],activity=data.activity||[],improvements=data.improvements||[],decisions=data.decisions||[];
      const activeProjects=projects.filter(x=>!['Completed','Closed'].includes(x.status));
      const openRequests=requests.filter(x=>!['Resolved','Closed'].includes(x.status));
      const vendorActions=vendors.filter(x=>String(x.nextAction||'').trim());
      const requiredDecisions=decisions.filter(x=>String(x.status||'').toLowerCase()==='required');
      const openImprovements=improvements.filter(x=>x.status!=='Completed');
      const role=App.role==='it_admin'?'IT & Operations Overview':'Operations Overview';
      const subtitle='Everything important is here. Use the quick routes first, then open a section when you need full detail or edit controls.';

      const priorities=[
        ...openRequests.filter(x=>['Urgent','High'].includes(x.priority)).map(x=>({title:x.title,sub:x.nextAction||x.category,meta:`${x.priority} · ${x.owner||'Unassigned'}`,tone:x.priority,page:'requests'})),
        ...activeProjects.filter(x=>['Urgent','High'].includes(x.priority)).map(x=>({title:x.name,sub:x.nextAction||x.scope,meta:`${x.status} · ${x.owner||'Unassigned'}`,tone:x.priority,page:'projects'}))
      ];
      if(!priorities.length){
        priorities.push(...openRequests.slice(0,3).map(x=>({title:x.title,sub:x.nextAction||x.category,meta:`${x.status} · ${x.owner||'Unassigned'}`,tone:x.priority,page:'requests'})));
        priorities.push(...activeProjects.slice(0,3).map(x=>({title:x.name,sub:x.nextAction||x.scope,meta:`${x.status} · ${x.owner||'Unassigned'}`,tone:x.priority,page:'projects'})));
      }

      root.innerHTML=pageHead(role,subtitle,'IL BISONTE NEW YORK')+`<div class="hub-overview">
        <nav class="hub-quickbar" aria-label="Quick routes">
          ${quickLink('Store status','Health & service status','store_health')}
          ${quickLink('Issues','Open requests & problems','requests')}
          ${quickLink('Projects','Current work & next steps','projects')}
          ${quickLink('Peter work','Hours, activity & billing','pmworklog')}
        </nav>

        <div class="hub-summary-strip">
          ${summary(activeProjects.length,'Active projects','Project work currently moving')}
          ${summary(openRequests.length,'Open issues & requests','Items still needing action')}
          ${summary(vendorActions.length,'Vendor follow-ups','External actions still open')}
          ${summary(activity.length,'Activity records','Operational history available')}
        </div>

        <section class="hub-section hub-attention">
          ${sectionHead('Needs attention','The items most likely to need a decision, follow-up or next action.','View all issues','requests')}
          <div class="hub-section-body">${priorities.length?`<ul class="hub-list">${priorities.slice(0,6).map(hubRow).join('')}</ul>`:'<div class="hub-empty">Nothing currently needs special attention.</div>'}</div>
        </section>

        <div class="hub-two-col">
          <section class="hub-section">
            ${sectionHead('Projects','Current work, status and next step without opening the full project workspace.','Open projects','projects')}
            <div class="hub-section-body">${activeProjects.length?`<ul class="hub-list">${activeProjects.slice(0,6).map(p=>hubRow({title:p.name,sub:p.nextAction||p.scope,meta:`${p.status} · ${p.owner||'Unassigned'}`,tone:p.priority,page:'projects',projectId:p.id})).join('')}</ul>`:'<div class="hub-empty">No active projects.</div>'}</div>
          </section>

          <section class="hub-section">
            ${sectionHead('Issues & Requests','What is open, who owns it and what happens next.','Open register','requests')}
            <div class="hub-section-body">${openRequests.length?`<ul class="hub-list">${openRequests.slice(0,6).map(r=>hubRow({title:r.title,sub:r.nextAction||r.category,meta:`${r.status} · ${r.owner||'Unassigned'}`,tone:r.priority,page:'requests'})).join('')}</ul>`:'<div class="hub-empty">No open issues or requests.</div>'}</div>
          </section>
        </div>

        <section class="hub-section">
          ${sectionHead('Store, IT & vendors','A compact operating picture. Details remain in their dedicated workspaces.')}
          <div class="hub-section-body">
            <div class="hub-three-col">
              <div>
                <div class="eyebrow" style="margin-top:16px">SYSTEMS</div>
                <ul class="hub-list">${systems.slice(0,4).map(s=>hubRow({title:s.name,sub:`${s.vendor||'Internal'} · ${s.owner||'Owner not set'}`,meta:s.status||'—',tone:s.status,page:'systems'})).join('')||'<li class="hub-empty">No systems recorded.</li>'}</ul>
              </div>
              <div>
                <div class="eyebrow" style="margin-top:16px">VENDOR COORDINATION</div>
                <ul class="hub-list">${vendorActions.slice(0,4).map(v=>hubRow({title:v.name,sub:v.nextAction||v.service,meta:v.status||'—',tone:v.status,page:'vendors'})).join('')||'<li class="hub-empty">No vendor follow-up currently open.</li>'}</ul>
              </div>
              <div>
                <div class="eyebrow" style="margin-top:16px">RECENT ACTIVITY</div>
                <ul class="hub-list">${activity.slice(0,4).map(a=>hubRow({title:a.action||a.title||a.description||'Activity',sub:a.detail||a.description||a.notes||'',meta:a.date||a.timestamp||a.when||'',tone:'',page:'activity'})).join('')||'<li class="hub-empty">No recent activity.</li>'}</ul>
              </div>
            </div>
          </div>
        </section>

        <section class="hub-section">
          ${sectionHead('All tools','Every capability remains available here.')}
          <div class="hub-links">
            ${hubLink('Store Health','Current store service status','store_health')}
            ${hubLink('Purchases & Visits','Hardware, invoices and onsite work','purchases_visits')}
            ${hubLink('Systems','Infrastructure and application register','systems')}
            ${hubLink('Pass & Access','Credentials and access workspace','pass')}
            ${hubLink('Peter Work Tracking','Time, activities, billing and records','pmworklog')}
            ${hubLink('Roadmap','Phases, dependencies and next steps','roadmap')}
            ${hubLink('SOP Library','Store procedures and repeatable actions','sops')}
            ${hubLink('Process Improvement',`${openImprovements.length} open improvement items`,'improvements')}
            ${hubLink('Decisions',`${requiredDecisions.length} currently require a decision`,'decisions')}
            ${hubLink('Vendors',`${vendorActions.length} follow-ups currently open`,'vendors')}
            ${hubLink('Activity Log','Full history and audit trail','activity')}
            ${hubLink('Projects','Open complete project portfolio','projects')}
          </div>
        </section>
      </div>`;

      bindOverview(root);
    };
  }

  function quickLink(title,sub,page){return `<button class="hub-quick-link" data-hub-go="${safe(page)}"><span><strong>${safe(title)}</strong><small>${safe(sub)}</small></span><b aria-hidden="true">→</b></button>`}
  function summary(value,label,detail){return `<div class="hub-summary-item"><span>${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(detail)}</small></div>`}
  function sectionHead(title,sub='',action='',page=''){return `<div class="hub-section-head"><div><h2>${safe(title)}</h2>${sub?`<p>${safe(sub)}</p>`:''}</div>${action&&page?`<button class="hub-section-action" data-hub-go="${safe(page)}">${safe(action)} →</button>`:''}</div>`}
  function hubRow(x){const tone=String(x.tone||'').toLowerCase().replace(/\s+/g,'-');return `<li class="hub-row" data-hub-go="${safe(x.page||'')}" ${x.projectId?`data-project-id="${safe(x.projectId)}"`:''}><div class="hub-row-main"><div class="hub-row-title">${safe(x.title)}</div><div class="hub-row-sub">${safe(x.sub||'')}</div></div><div class="hub-row-meta"><span class="hub-priority"><i class="hub-priority-dot ${safe(tone)}"></i>${safe(x.meta||'')}</span></div></li>`}
  function hubLink(title,sub,page){return `<button class="hub-link" data-hub-go="${safe(page)}"><strong>${safe(title)}</strong><span>${safe(sub)}</span></button>`}

  function bindOverview(root){
    qa('[data-hub-go]',root).forEach(el=>el.addEventListener('click',e=>{
      if(e.target.closest?.('[data-project-id]')&&e.currentTarget.dataset.projectId)return;
      const page=e.currentTarget.dataset.hubGo;if(!page)return;App.page=page;render();
    }));
  }

  function observeWorklogWording(){
    const root=q('#pageRoot');if(!root)return;
    const apply=()=>{
      renameWorkNavigation();
      if(App.page!=='pmworklog')return;
      const head=q('.page-head',root);if(!head)return;
      const title=q('.page-title',head);if(title)title.textContent='Peter Work & Time';
      const sub=q('.page-subtitle',head);if(sub)sub.textContent='Activities, hours, billing and supporting records in one working register.';
      const eyebrow=q('.eyebrow',head);if(eyebrow)eyebrow.textContent='WORK & TIME TRACKING';
    };
    const observer=new MutationObserver(apply);observer.observe(root,{childList:true,subtree:true});apply();
  }
})();
