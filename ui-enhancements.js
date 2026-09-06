(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const MOBILE=()=>window.matchMedia('(max-width: 900px)').matches;

  document.addEventListener('DOMContentLoaded',()=>waitForEnhancedCore().then(initV03).catch(console.error));

  function waitForEnhancedCore(){
    return new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{
      n++;
      try{
        const accessPatched=typeof App!=='undefined'&&App.data&&App.nav&&App.nav.project_manager&&App.nav.project_manager.some(x=>x[0]==='users');
        if(accessPatched&&typeof renderPage==='function'&&typeof renderNav==='function'){clearInterval(t);resolve();return;}
      }catch(e){}
      if(n>140){clearInterval(t);reject(new Error('v0.3 UI enhancements could not initialize'));}
    },50)});
  }

  function initV03(){
    addCredentialNavigation();
    patchPageRouting();
    injectSidebarControls();
    bindProjectInteractions();
    observePageChanges();
    renderNav();
    decorateProjects();
  }

  function addCredentialNavigation(){
    addNavItem('project_manager',['credentials','◇','Credentials'],'systems');
    addNavItem('management',['credentials','◇','Credentials'],'decisions');
  }

  function addNavItem(role,item,afterId){
    const list=App.nav[role];if(!list||list.some(x=>x[0]===item[0]))return;
    const idx=list.findIndex(x=>x[0]===afterId);
    list.splice(idx>=0?idx+1:list.length,0,item);
  }

  function patchPageRouting(){
    const previous=renderPage;
    renderPage=function(){
      if(App.page==='credentials'){renderCredentialsPage();decorateProjects();return;}
      previous();
      setTimeout(decorateProjects,0);
    };
  }

  function injectSidebarControls(){
    const topbar=q('.topbar');const search=q('.search-wrap');if(!topbar||!search||q('#sidebarToggle'))return;
    const btn=document.createElement('button');btn.id='sidebarToggle';btn.className='sidebar-toggle';btn.type='button';btn.setAttribute('aria-label','Toggle navigation');btn.setAttribute('aria-expanded','true');btn.textContent='☰';
    topbar.insertBefore(btn,search);
    const screen=document.createElement('div');screen.className='sidebar-screen';screen.id='sidebarScreen';document.body.appendChild(screen);

    const app=q('#app');
    if(!MOBILE()&&localStorage.getItem('ib_sidebar_collapsed')==='1')app.classList.add('sidebar-collapsed');
    btn.onclick=()=>{
      if(MOBILE()){
        const open=app.classList.toggle('sidebar-open');screen.classList.toggle('visible',open);btn.setAttribute('aria-expanded',String(open));
      }else{
        const collapsed=app.classList.toggle('sidebar-collapsed');localStorage.setItem('ib_sidebar_collapsed',collapsed?'1':'0');btn.setAttribute('aria-expanded',String(!collapsed));
      }
    };
    screen.onclick=closeMobileSidebar;
    document.addEventListener('click',e=>{if(MOBILE()&&e.target.closest('.nav-btn'))closeMobileSidebar();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMobileSidebar();closeProjectModal();}});
    window.addEventListener('resize',()=>{if(!MOBILE())closeMobileSidebar();});
  }

  function closeMobileSidebar(){
    const app=q('#app'),screen=q('#sidebarScreen'),btn=q('#sidebarToggle');if(!app)return;
    app.classList.remove('sidebar-open');screen?.classList.remove('visible');btn?.setAttribute('aria-expanded','false');
  }

  function observePageChanges(){
    const root=q('#pageRoot');if(!root)return;
    const observer=new MutationObserver(()=>decorateProjects());observer.observe(root,{childList:true,subtree:true});
  }

  function decorateProjects(){
    if(!App.data?.projects)return;
    qa('.kanban-card').forEach(card=>{
      const name=q('.kanban-title',card)?.textContent.trim();const p=App.data.projects.find(x=>x.name===name);if(!p)return;
      card.dataset.projectName=p.name;card.dataset.projectId=p.id;card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Open project ${p.name}`);
    });
    qa('.data-table tbody tr').forEach(row=>{
      const id=qa('.row-sub',row).map(x=>x.textContent.trim()).find(x=>/^PRJ-\d+/i.test(x));if(!id)return;
      row.dataset.projectId=id;row.classList.add('project-row-clickable');row.tabIndex=0;row.setAttribute('role','button');
    });
    qa('.simple-row').forEach(row=>{
      const name=q('.row-title',row)?.textContent.trim();const p=App.data.projects.find(x=>x.name===name);if(!p)return;
      row.dataset.projectId=p.id;row.classList.add('project-simple-clickable');row.tabIndex=0;row.setAttribute('role','button');
    });
  }

  function bindProjectInteractions(){
    const root=q('#pageRoot');if(!root)return;
    root.addEventListener('click',e=>{
      if(e.target.closest('button,a,input,select,textarea'))return;
      const target=e.target.closest('[data-project-id],.kanban-card[data-project-name]');if(!target)return;
      const p=target.dataset.projectId?App.data.projects.find(x=>x.id===target.dataset.projectId):App.data.projects.find(x=>x.name===target.dataset.projectName);
      if(p)openProjectModal(p);
    });
    root.addEventListener('keydown',e=>{
      if(!['Enter',' '].includes(e.key))return;const target=e.target.closest('[data-project-id],.kanban-card[data-project-name]');if(!target)return;e.preventDefault();
      const p=target.dataset.projectId?App.data.projects.find(x=>x.id===target.dataset.projectId):App.data.projects.find(x=>x.name===target.dataset.projectName);if(p)openProjectModal(p);
    });
  }

  function openProjectModal(p){
    const root=q('#modalRoot');if(!root)return;
    root.innerHTML=`<div class="project-detail-backdrop" id="projectDetailBackdrop"><article class="project-detail-modal" role="dialog" aria-modal="true" aria-labelledby="projectDetailTitle"><header class="project-detail-head"><div><div class="eyebrow">${safe(p.id)} · ${safe(p.scope)}</div><h2 id="projectDetailTitle">${safe(p.name)}</h2><div><span class="pill ${statusClass(p.priority)}">${safe(p.priority)}</span> <span class="pill ${statusClass(p.status)}">${safe(p.status)}</span></div></div><button class="project-close" id="projectDetailClose" aria-label="Close">×</button></header><div class="project-detail-body"><div class="project-detail-grid"><div class="project-meta-card"><span>Owner</span><strong>${safe(p.owner||'—')}</strong></div><div class="project-meta-card"><span>Target date</span><strong>${safe(formatDate(p.due))}</strong></div><div class="project-meta-card"><span>Scope</span><strong>${safe(p.scope||'—')}</strong></div><div class="project-meta-card"><span>Status</span><strong>${safe(p.status||'—')}</strong></div></div><div class="project-next-action"><span>Next action</span><strong>${safe(p.nextAction||'To be defined')}</strong></div>${projectSection('Description',p.description)}${projectSection('Objective',p.objective)}${projectSection('Stakeholders',p.stakeholders)}${projectSection('Deliverables',p.deliverables)}${projectSection('Risks / Dependencies',p.risks)}</div></article></div>`;
    q('#projectDetailClose').onclick=closeProjectModal;q('#projectDetailBackdrop').onclick=e=>{if(e.target===e.currentTarget)closeProjectModal()};
    q('#projectDetailClose').focus();
  }

  function projectSection(title,value){return `<section class="project-section"><h4>${safe(title)}</h4><p>${safe(value||'To be completed during project baseline.')}</p></section>`}
  function closeProjectModal(){const el=q('#projectDetailBackdrop');if(el)el.remove();}
  function statusClass(v){return String(v||'').toLowerCase().replace(/\s+/g,'-')}
  function formatDate(v){if(!v)return '—';const d=new Date(`${v}T00:00:00`);return Number.isNaN(d.getTime())?v:d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}

  function renderCredentialsPage(){
    const root=q('#pageRoot');const rows=App.data.credentials||[];
    const migration=rows.filter(x=>/migration|review/i.test(x.status||'')).length;const controlled=rows.filter(x=>/controlled/i.test(x.status||'')).length;
    root.innerHTML=`${pageHead('Credential Register','Centralize credential ownership and recovery without putting passwords into spreadsheets.','ACCESS GOVERNANCE')}<div class="credential-safety"><div class="credential-safety-icon">🔐</div><div><strong>No raw passwords are stored in this Hub.</strong><p>This register replaces paper notes and scattered emails by recording the system, account owner, secure storage location and recovery path. The actual secret stays in an approved password manager or IT-controlled vault.</p></div></div><div class="credentials-summary"><div class="metric-box"><strong>${rows.length}</strong><div class="muted">Registered credential sets</div></div><div class="metric-box"><strong>${migration}</strong><div class="muted">Need migration / review</div></div><div class="metric-box"><strong>${controlled}</strong><div class="muted">Controlled</div></div></div><div class="panel"><div class="panel-head"><h3>Credential Ownership Register</h3><span class="muted">Secret value intentionally excluded</span></div>${credentialTable(rows)}</div>`;
  }

  function credentialTable(rows){
    if(!rows.length)return '<div class="empty">No credential records yet.</div>';
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>System / Account</th><th>Owner</th><th>Secure Storage</th><th>Recovery</th><th>Last Review</th><th>Status</th><th>Notes</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe(r.id)}</td><td><strong>${safe(r.system)}</strong><div class="row-sub">${safe(r.accountLabel)} · ${safe(r.loginHint||'')}</div></td><td>${safe(r.owner)}</td><td>${safe(r.storageLocation)}</td><td>${safe(r.recoveryContact)}</td><td>${safe(r.lastReviewed)}</td><td><span class="pill ${statusClass(r.status)}">${safe(r.status)}</span></td><td>${safe(r.notes||'')}</td></tr>`).join('')}</tbody></table></div>`;
  }
})();
