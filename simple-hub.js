/* Il Bisonte NYC — single-screen-friendly interface.
   The live TASKS, REQUESTS, VENDORS, SYSTEMS and PM_WORKLOG APIs are unchanged.
   No credentials or worklog entries are copied into this public repository. */
(function(){
  'use strict';
  const SHEET_URL='https://docs.google.com/spreadsheets/d/1cUYOUMcwLNOtNtsGUcqMcbKLKsRN_kGLfzz3072i4LE/edit';
  const REGISTER_URL='https://docs.google.com/spreadsheets/d/1oI4C08UaD8i-UppqIF4rNGOjkvvoSr0uZTZ8nUW27Ck/edit';
  const NAV=[['dashboard','⌂','Overview'],['activities','✓','Activities'],['partners','◉','Partners'],['retail_simple','▣','Retail & POS'],['systems_simple','▦','Store systems'],['settings','⚙','Settings']];
  let filter='priority', activityKind='tasks', query='';
  function role(){return window.IB_CONFIG?.dataMode==='apps_script'
    ?String(window.IBAuth?.current?.()?.user?.role||window.IB_CURRENT_USER?.role||'')
    :String(App.role||'');}
  function editRole(){return ['project_manager','it_admin'].includes(role());}
  function workRole(){return ['project_manager','management','it_admin'].includes(role()) && window.IBPMWorklog?.canView?.()===true;}
  function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function rows(type){return Array.isArray(App.data?.[type])?App.data[type]:[];}
  function closed(status){return ['completed','closed','resolved','cancelled','canceled'].includes(String(status||'').toLowerCase());}
  function waiting(status){return /pending|waiting|blocked|scheduled|deferred/i.test(String(status||''));}
  function chip(status){return '<span class="simple-chip '+(closed(status)?'done':waiting(status)?'wait':/progress/i.test(String(status))?'open':'muted')+'">'+safe(status||'Da verificare')+'</span>';}
  function navTo(page){App.page=page;render();document.querySelector('.main-shell')?.scrollTo?.({top:0});}
  function header(title,description,actions=''){return '<header class="simple-head"><div><span class="simple-eyebrow">Il Bisonte · New York</span><h1>'+safe(title)+'</h1><p>'+safe(description)+'</p></div><div class="simple-quick">'+actions+'</div></header>';}
  function empty(text){return '<div class="simple-empty">'+safe(text)+'</div>';}
  function button(label,action,kind=''){return '<button type="button" class="simple-button '+kind+'" data-simple="'+safe(action)+'">'+label+'</button>';}
  function taskSort(a,b){const priority={urgent:0,high:1,medium:2,normal:3,low:4};return Number(closed(a.status))-Number(closed(b.status))||Number(waiting(a.status))-Number(waiting(b.status))||((priority[String(a.priority||'').toLowerCase()]??5)-(priority[String(b.priority||'').toLowerCase()]??5))||String(a.due||'9999').localeCompare(String(b.due||'9999'));}
  function taskMatches(t){const text=[t.title,t.owner,t.notes,t.status,t.id,t.priority].join(' ').toLowerCase();return text.includes(query);}
  function taskList(list,limit=0){let tasks=list.filter(taskMatches).sort(taskSort);if(limit)tasks=tasks.slice(0,limit);if(!tasks.length)return empty('Nessuna attività per questa selezione.');
    return '<div class="simple-list">'+tasks.map(t=>'<article class="simple-task"><div class="simple-task-main"><div class="simple-task-title">'+safe(t.title)+'</div><div class="simple-task-meta">'+safe(t.owner||'Responsabile da assegnare')+(t.due?' · '+safe(t.due):'')+'</div>'+(t.notes?'<div class="simple-task-meta">'+safe(t.notes)+'</div>':'')+'</div><div class="simple-task-actions">'+chip(t.status)+(editRole()?button('Modifica','edit-task:'+t.id)+(closed(t.status)?button('Riapri','task-status:'+t.id+':In Progress'):button('Completa','task-status:'+t.id+':Completed','primary')):'')+'</div></article>').join('')+'</div>';}
  function issueList(items){if(!items.length)return empty('Nessuna segnalazione per questa selezione.');return '<div class="simple-list">'+items.map(t=>'<article class="simple-task"><div class="simple-task-main"><div class="simple-task-title">'+safe(t.title)+'</div><div class="simple-task-meta">'+safe(t.owner||'Responsabile da assegnare')+' · '+safe(t.category||'Store')+'</div>'+(t.nextAction?'<div class="simple-task-meta">Prossimo passo: '+safe(t.nextAction)+'</div>':'')+'</div><div class="simple-task-actions">'+chip(t.status)+(editRole()?button('Modifica','edit-issue:'+t.id):'')+'</div></article>').join('')+'</div>';}
  function focusedTasks(){return rows('tasks').filter(t=>!closed(t.status)).sort(taskSort).slice(0,5);}
  function vendorFrom(term){return rows('vendors').find(v=>term.test(String(v.name||'')));}
  function vendorCard(name,initial,description,matcher){const v=vendorFrom(matcher);
    return '<article class="simple-card simple-vendor"><div class="simple-vendor-top"><div class="simple-vendor-icon">'+safe(initial)+'</div><div><strong>'+safe(v?.name||name)+'</strong><br><small>'+safe(description)+'</small></div></div><p>'+safe(v?.service||description)+'</p><div class="vendor-note"><b>Referente:</b> '+safe(v?.contact||'Da completare nel registro')+'</div><div class="vendor-note"><b>Prossimo passo:</b> '+safe(v?.nextAction||'Confermare servizi e contatti con Damiano')+'</div><div class="vendor-foot">'+chip(v?.status||'Da documentare')+(v&&editRole()?button('Aggiorna card','edit-vendor:'+v.id):'')+'</div></article>';
  }
  function vendorGrid(){const featured=[
    vendorCard('eMazzanti','e','Rete, WatchGuard e supporto eCare',/emazzanti/i),
    vendorCard('RIS','R','Coordinamento dell\'incarico tecnico iniziale',/\bris\b|retail information systems/i),
    vendorCard('Deda Group','D','Prism, server e migrazione Retail Pro',/deda/i),
    vendorCard('Retail Pro Support','P','Assistenza applicativa e supporto POS',/retail pro/i),
    vendorCard('Spectrum','S','Connessione Internet principale',/spectrum/i),
    vendorCard('Verizon','V','Servizi telefonici e connettività da verificare',/verizon/i)
  ];const used=rows('vendors').filter(v=>![/emazzanti/i,/\bris\b|retail information systems/i,/deda/i,/retail pro/i,/spectrum/i,/verizon/i].some(rx=>rx.test(v.name||'')));
    return '<div class="simple-vendors">'+featured.join('')+used.map(v=>vendorCard(v.name,'•','Altri fornitori',new RegExp('^'+String(v.name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i'))).join('')+'</div>';
  }
  function home(root){const task=rows('tasks'),active=task.filter(t=>!closed(t.status)),pending=active.filter(t=>waiting(t.status)),issues=rows('requests').filter(t=>!closed(t.status));
    root.innerHTML=header('Lo store, senza complicazioni','Le attività da chiudere e i contatti utili, in un unico posto.',button('Aggiorna dati','refresh')+(editRole()?button('+ Nuova attività','new-task','primary'):''))
      +'<div class="simple-grid"><section class="simple-card simple-hero"><div><span class="simple-eyebrow" style="color:#c9a881">STORE OPERATIONS</span><h2>Le cose importanti, subito.</h2><p>Apri le attività, assegna un responsabile e registra ciò che è stato completato. Lo storico resta nel database.</p></div>'+button('Apri attività →','page:activities')+'</section>'
      +'<section class="simple-card simple-summary"><div class="summary-row"><span>Attività aperte</span><strong class="summary-num">'+active.length+'</strong></div><div class="summary-row"><span>In attesa</span><strong class="summary-num">'+pending.length+'</strong></div><div class="summary-row"><span>Segnalazioni aperte</span><strong class="summary-num">'+issues.length+'</strong></div><div class="summary-row"><span>Completate (storico)</span><strong class="summary-num">'+task.filter(t=>closed(t.status)).length+'</strong></div></section>'
      +'<section class="simple-card full"><div class="simple-card-head"><h2>Da seguire adesso</h2>'+button('Vedi tutte →','page:activities')+'</div>'+taskList(focusedTasks(),5)+'</section>'
      +'<section class="simple-card full"><div class="simple-card-head"><h2>Fornitori e supporto</h2>'+button('Tutte le card →','page:partners')+'</div><div class="simple-vendors">'+vendorCard('eMazzanti','e','Rete e supporto IT',/emazzanti/i)+vendorCard('RIS','R','Incarico tecnico iniziale',/\bris\b|retail information systems/i)+'</div></section>'
      +(workRole()?'<section class="simple-card full"><div class="simple-card-head"><div><h2>Il mio lavoro e le ore</h2><p>Ore, attività, compensi e stato fatture, senza perdere lo storico.</p></div>'+button('Apri registro →','page:pmworklog','primary')+'</div></section>':'')+'</div>'+footer();
  }
  function activities(root){const all=rows('tasks'),open=all.filter(t=>!closed(t.status)),done=all.filter(t=>closed(t.status));
    let list=filter==='priority'?focusedTasks():filter==='done'?done:filter==='all'?all:filter==='waiting'?open.filter(t=>waiting(t.status)):open;
    const tabs=[['priority','Da seguire',focusedTasks().length],['waiting','In attesa',open.filter(t=>waiting(t.status)).length],['done','Completate',done.length],['all','Tutte',all.length]];
    const kindTabs=[['tasks','Attività'],['requests','Segnalazioni']];
    const tools=editRole()?button('+ Nuova attività','new-task','primary'):button('Segnala un problema','new-issue','primary');
    root.innerHTML=header('Attività','Cosa fare, chi se ne occupa e cosa è stato completato.',button('Aggiorna','refresh')+tools)
      +'<section class="simple-card full"><div class="simple-toolbar"><div class="simple-tabs">'+kindTabs.map(([k,l])=>'<button class="simple-tab '+(activityKind===k?'active':'')+'" data-kind="'+k+'">'+l+'</button>').join('')+'</div><span class="simple-count">Lo storico è conservato in Google Sheets.</span></div>'
      +(activityKind==='tasks'?'<div class="simple-toolbar"><div class="simple-tabs">'+tabs.map(([k,l,c])=>'<button class="simple-tab '+(filter===k?'active':'')+'" data-filter="'+k+'">'+l+' · '+c+'</button>').join('')+'</div></div>'+taskList(list)
      :'<div class="simple-toolbar"><div class="simple-tabs">'+[['open','Aperte'],['done','Chiuse'],['all','Tutte']].map(([k,l])=>'<button class="simple-tab '+(filter===k?'active':'')+'" data-filter="'+k+'">'+l+'</button>').join('')+'</div>'+button('Nuova segnalazione','new-issue')+'</div>'+issueList(rows('requests').filter(r=>(filter==='done'?closed(r.status):filter==='all'?true:!closed(r.status))&&[r.title,r.owner,r.category,r.nextAction].join(' ').toLowerCase().includes(query))))+'</section>'+footer();
  }
  function partners(root){root.innerHTML=header('Contatti & supporto','Una card per ogni fornitore: ruolo, referente e prossimo passo.',button('Aggiorna','refresh'))+vendorGrid()+'<div class="simple-footer">Le card RIS senza un record nel database indicano chiaramente i dati da completare; non vengono inventati numeri di telefono o contratti.</div>';}
  function systems(root){const systems=rows('systems'),assets=rows('assets');root.innerHTML=header('Sistemi dello store','Computer, reti, programmi e dispositivi, senza informazioni inutili.',button('Aggiorna','refresh'))
      +'<section class="simple-card"><div class="simple-card-head"><h2>Sistemi e servizi</h2><span class="simple-count">'+systems.length+' elementi</span></div><div class="simple-systems">'+systems.map(s=>'<article class="simple-system"><h3>'+safe(s.name)+'</h3><p>Responsabile: '+safe(s.owner||'Da definire')+'</p><p>Supporto: '+safe(s.vendor||'Da definire')+'</p>'+chip(s.status)+'</article>').join('')+'</div></section>'
      +(assets.length?'<section class="simple-card" style="margin-top:15px"><div class="simple-card-head"><h2>Dispositivi</h2><span class="simple-count">'+assets.length+' elementi</span></div><div class="simple-systems">'+assets.map(s=>'<article class="simple-system"><h3>'+safe(s.name||s.assetType||'Dispositivo')+'</h3><p>'+safe(s.location||'Posizione da registrare')+'</p>'+chip(s.status)+'</article>').join('')+'</div></section>':'')+footer();}
  function documents(root){const documents=[['Database operativo','Attività, segnalazioni e ore',SHEET_URL],['Registro IT & Operations','Contratti, dispositivi e servizi',REGISTER_URL]];
    const sops=rows('sops');root.innerHTML=header('Documenti','Collegamenti utili: un clic per trovare il documento corretto.')
      +'<div class="simple-grid">'+documents.map(d=>'<article class="simple-card half"><h2>'+safe(d[0])+'</h2><p>'+safe(d[1])+'</p><div style="margin-top:16px"><a class="simple-button" href="'+safe(d[2])+'" target="_blank" rel="noopener noreferrer">Apri risorsa ↗</a></div></article>').join('')
      +'<section class="simple-card full"><div class="simple-card-head"><h2>Procedure operative</h2><span class="simple-count">'+sops.length+' registrate</span></div><div class="simple-list">'+sops.map(s=>'<div class="simple-task"><div class="simple-task-main"><div class="simple-task-title">'+safe(s.title)+'</div><div class="simple-task-meta">'+safe(s.category||'Store')+' · '+safe(s.version||'')+'</div></div><div class="simple-task-actions">'+chip(s.status)+(typeof s.driveFileRef==='string'&&/^https:\/\//.test(s.driveFileRef)?'<a class="simple-button" href="'+safe(s.driveFileRef)+'" target="_blank" rel="noopener noreferrer">Apri ↗</a>':'')+'</div></div>').join('')+'</div></section></div>'+footer();}
  // All operational routes now remain inside this same compact application shell.
  function adminRole(){return ['project_manager','management','it_admin'].includes(role());}
  function fullTool(page,label){
    const allowed=['pass_simple','users_simple','projects_simple','docs_simple'];
    if(!allowed.includes(page))return '';
    return button(label,'page:'+page);
  }
  function accessHub(root){return settings(root);}
  function retail(root){
    const retailSystems=rows('systems').filter(s=>/retail|prism|stealth|shop\.net|pos\.net/i.test([s.name,s.vendor,s.details].join(' ')));
    const support=rows('vendors').find(v=>/retail pro support/i.test(v.name||''));
    const programs=[...retailSystems];
    if(!programs.some(s=>/retail pro/i.test(s.name||''))&&support)
      programs.unshift({name:'Retail Pro Prism',vendor:support.name,owner:'Damiano / Italy IT',status:'Da verificare'});
    root.innerHTML=header('Retail & POS','Programmi del negozio e riferimenti al supporto.',button('Aggiorna','refresh'))+
      '<section class="simple-card full"><div class="simple-list">'+
      (programs.length?programs.map(s=>
        '<div class="simple-task"><div class="simple-task-main"><div class="simple-task-title">'+safe(s.name)+'</div>'+
        '<div class="simple-task-meta">'+safe(s.vendor||'Supporto da verificare')+' · '+safe(s.owner||'Responsabile da definire')+'</div>'+
        (s.supportPhone?'<div class="simple-task-meta">Telefono: '+safe(s.supportPhone)+'</div>':'')+
        (s.supportEmail?'<div class="simple-task-meta">Email: '+safe(s.supportEmail)+'</div>':'')+
        '</div>'+chip(s.status)+'</div>').join(''):empty('Nessun sistema Retail registrato.'))+
      '</div></section>'+
      (support?'<section class="simple-card full simple-notice"><strong>Retail Pro Support</strong><p>'+safe(support.contact||'Referente da confermare')+
        (support.phone?' · '+safe(support.phone):'')+(support.supportPhone?' · '+safe(support.supportPhone):'')+
        (support.supportEmail?' · '+safe(support.supportEmail):'')+'</p>'+
        (support.nextAction?'<p>'+safe(support.nextAction)+'</p>':'')+'</section>':'')+footer();
  }
  function settings(root){
    const language=window.IBI18n?.language?.()||'en';
    root.innerHTML=header('Impostazioni','Lingua, accessi e strumenti di supporto: tutto nello stesso gestionale.')+
      '<section class="simple-card full simple-settings">'+
      '<div class="simple-settings-row"><div><h2>Lingua / Language</h2><p>Seleziona la lingua dell’interfaccia.</p></div>'+
      '<div class="simple-settings-actions">'+button('English','language:en',language==='en'?'primary':'')+
        button('Italiano','language:it',language==='it'?'primary':'')+'</div></div>'+
      (adminRole()?'<div class="simple-settings-row"><div><h2>Password e accessi</h2><p>Registro degli account e riferimenti al vault riservato.</p></div>'+
        '<div class="simple-settings-actions">'+fullTool('pass_simple','Apri registro')+fullTool('users_simple','Utenti e ruoli')+'</div></div>':'')+
      '<div class="simple-settings-row"><div><h2>Altre informazioni</h2><p>Progetti, documenti e registri del negozio.</p></div>'+
      '<div class="simple-settings-actions">'+(adminRole()?fullTool('projects_simple','Progetti'):'')+
      fullTool('docs_simple','Documenti')+'</div></div>'+
      '</section>'+footer();
  }
  function accessIndex(root){
    if(!adminRole()){App.page='dashboard';return home(root);}
    const connected=window.IB_CONFIG?.credentials?.sheetConnected===true;
    const creds=rows('credentials');
    root.innerHTML=header('Password e accessi','Account, referenti e posizione delle credenziali.',button('← Impostazioni','page:settings'))+
      '<section class="simple-card full"><div class="simple-notice">'+
      (connected?'Vault riservato configurato. L’accesso alle password dipende dalle autorizzazioni.':
        'Il vault privato non è ancora collegato al gestionale: qui sono visibili soltanto i riferimenti agli account, non le password.')+
      '</div><div class="simple-list">'+
      (creds.length?creds.map(c=>
        '<div class="simple-task"><div class="simple-task-main"><div class="simple-task-title">'+safe(c.system||c.name||'Account')+'</div>'+
        '<div class="simple-task-meta">'+safe(c.accountLabel||c.accessType||'')+' · '+safe(c.owner||'Responsabile da confermare')+'</div>'+
        '<div class="simple-task-meta">'+safe(c.storageLocation||c.credentialLocation||'Vault aziendale')+'</div>'+
        '</div>'+chip(c.status)+'</div>').join(''):empty('Nessun riferimento agli account disponibile.'))+
      '</div></section>'+footer();
  }
  async function userDirectory(root){
    if(!adminRole()){App.page='dashboard';return home(root);}
    root.innerHTML=header('Utenti e autorizzazioni','Account del gestionale e relativi ruoli.',button('← Impostazioni','page:settings'))+
      '<section class="simple-card full" id="simpleUserDirectory">'+empty('Caricamento utenti…')+'</section>';
    try{
      const users=await window.IBAccess.listUsers();
      if(App.page!=='users_simple'||!root.isConnected)return;
      const list=Array.isArray(users)?users:Array.isArray(users?.users)?users.users:[];
      const canApprove=['management','it_admin'].includes(role())&&
        window.IBAuth?.current?.()?.permissions?.approveUsers!==false;
      root.querySelector('#simpleUserDirectory').innerHTML='<div class="simple-list">'+
        (list.length?list.map(u=>
          '<div class="simple-task"><div class="simple-task-main"><div class="simple-task-title">'+safe(u.displayName||u.email||'Utente')+'</div>'+
          '<div class="simple-task-meta">'+safe(u.email||'')+' · '+safe(u.role||'')+'</div></div>'+
          '<div class="simple-task-actions">'+chip(u.status)+
          (canApprove&&String(u.status||'').toLowerCase()==='pending'?
            button('Approva','approve-user:'+u.email,'primary')+button('Rifiuta','reject-user:'+u.email):'')+
          '</div></div>').join(''):empty('Nessun utente disponibile.'))+
        '</div>';
      localizeSimple(root);
    }catch(err){
      if(App.page==='users_simple'&&root.isConnected){
        root.querySelector('#simpleUserDirectory').innerHTML=empty('Elenco utenti non disponibile: '+String(err?.message||'Accesso non autorizzato'));
      }
    }
  }
  function projects(root){
    if(!adminRole()){App.page='dashboard';return home(root);}
    root.innerHTML=header('Progetti','Stato e prossimi passi dei progetti del negozio.',button('← Impostazioni','page:settings'))+
      '<section class="simple-card full"><div class="simple-list">'+
      (rows('projects').length?rows('projects').map(p=>
        '<div class="simple-task"><div class="simple-task-main"><div class="simple-task-title">'+safe(p.name)+'</div>'+
        '<div class="simple-task-meta">'+safe(p.owner||'Responsabile da definire')+(p.nextAction?' · '+safe(p.nextAction):'')+'</div>'+
        '</div>'+chip(p.status)+'</div>').join(''):empty('Nessun progetto registrato.'))+
      '</div></section>'+footer();
  }
  function footer(){return '<p class="simple-footer">Il Bisonte NYC · I dati operativi restano nei registri originali. Le password non sono archiviate in questo sito.</p>';}
  function modal(title,fields,onSubmit){const host=document.querySelector('#modalRoot');if(!host)return;host.innerHTML='<div class="simple-modal-cover" role="presentation"><div class="simple-modal" role="dialog" aria-modal="true" aria-label="'+safe(title)+'"><div class="simple-modal-head"><h2>'+safe(title)+'</h2>'+button('✕','close-modal')+'</div><form class="simple-form" id="simpleEntryForm">'+fields+'<div class="simple-form-footer">'+button('Annulla','close-modal')+'<button class="simple-button primary" type="submit">Salva</button></div></form></div></div>';
    localizeSimple(host);
    const form=host.querySelector('#simpleEntryForm');form.addEventListener('submit',async e=>{e.preventDefault();const submit=form.querySelector('[type="submit"]');submit.disabled=true;try{await onSubmit(Object.fromEntries(new FormData(form)));host.innerHTML='';App.data=await IBData.getAll();render();toast('Modifiche salvate');}catch(err){toast(err.message||'Salvataggio non riuscito');submit.disabled=false;}});
    host.querySelector('.simple-modal-cover').addEventListener('click',e=>{if(e.target.classList.contains('simple-modal-cover'))host.innerHTML='';});
  }
  function field(key,label,value='',type='text',wide=false){return '<label class="simple-field '+(wide?'wide':'')+'"><span>'+safe(label)+'</span><input name="'+key+'" type="'+type+'" value="'+safe(value)+'" '+(key==='title'?'required':'')+'></label>';}
  function select(key,label,options,value){return '<label class="simple-field"><span>'+safe(label)+'</span><select name="'+key+'">'+options.map(x=>'<option value="'+safe(x)+'" '+(x===value?'selected':'')+'>'+safe(x)+'</option>').join('')+'</select></label>';}
  function textarea(key,label,value){return '<label class="simple-field wide"><span>'+safe(label)+'</span><textarea name="'+key+'">'+safe(value)+'</textarea></label>';}
  function taskEditor(id){if(!editRole())return;const t=rows('tasks').find(x=>x.id===id)||null;
    modal(t?'Modifica attività':'Nuova attività',field('title','Attività',t?.title,'text',true)+field('owner','Responsabile',t?.owner||'')+field('due','Data prevista',t?.due||'','date')+select('status','Stato',[...new Set(['Not Started','In Progress','Pending Vendor','Pending Validation','Pending Remote Validation','Pending Installation','Waiting','Blocked','Scheduled Onsite','Backlog','Deferred','Completed',t?.status].filter(Boolean))],t?.status||'Not Started')+select('priority','Priorità',['Low','Medium','High','Urgent'],t?.priority||'Medium')+textarea('notes','Note / prossimo passo',t?.notes||''),
      data=>t?IBData.updateTask(t.id,data):IBData.createTask({...data,projectId:''}));}
  function vendorEditor(id){if(!editRole())return;const v=rows('vendors').find(x=>x.id===id);if(!v)return;
    modal('Aggiorna '+v.name,field('contact','Referente / supporto',v.contact||'','text',true)+field('service','Servizio',v.service||'','text',true)+field('status','Stato',v.status||'')+textarea('nextAction','Prossimo passo',v.nextAction||''),data=>IBData.updateVendor(id,data));}
  async function updateStatus(id,status){if(!editRole())return;const row=rows('tasks').find(x=>x.id===id);if(!row)return;try{await IBData.updateTask(id,{status});App.data=await IBData.getAll();render();toast('Stato aggiornato');}catch(err){toast(err.message||'Modifica non riuscita');}}
  async function refresh(){try{App.data=await IBData.getAll();render();toast('Dati aggiornati');}catch(err){toast(err.message||'Aggiornamento non disponibile');}}
  // Base interface is Italian. Translate interface-only text locally for English;
  // user-entered task/vendor records are never sent to an extra translation service.
  const EN_UI={
    'Impostazioni':'Settings',
    'Lingua, accessi e strumenti di supporto: tutto nello stesso gestionale.':'Language, access and supporting tools in the same workspace.',
    'Seleziona la lingua dell’interfaccia.':'Choose your interface language.',
    'Registro degli account e riferimenti al vault riservato.':'Account register and private vault references.',
    'Apri registro':'Open register',
    'Utenti e ruoli':'Users & roles',
    'Altre informazioni':'More information',
    'Progetti, documenti e registri del negozio.':'Projects, documents and store registers.',
    'Documenti':'Documents',
    'Password e accessi':'Passwords & access',
    'Account, referenti e posizione delle credenziali.':'Accounts, contacts and where credentials are kept.',
    '← Impostazioni':'← Settings',
    'Il vault privato non è ancora collegato al gestionale: qui sono visibili soltanto i riferimenti agli account, non le password.':'The private vault is not connected yet: this page shows account references, not passwords.',
    'Vault riservato configurato. L’accesso alle password dipende dalle autorizzazioni.':'Private vault configured. Password access depends on your permissions.',
    'Nessun riferimento agli account disponibile.':'No account references are available.',
    'Utenti e autorizzazioni':'Users & permissions',
    'Account del gestionale e relativi ruoli.':'Workspace accounts and their roles.',
    'Caricamento utenti…':'Loading users…',
    'Approva':'Approve',
    'Rifiuta':'Reject',
    'Nessun utente disponibile.':'No users available.',
    'Progetti':'Projects',
    'Stato e prossimi passi dei progetti del negozio.':'Store project status and next steps.',
    'Nessun progetto registrato.':'No projects recorded.',
    'Impostazioni e strumenti':'Settings & tools',
    'Referente:':'Contact:',
    'Stato':'Status',
    'Priorità':'Priority',
    'Salva':'Save',
    'Annulla':'Cancel',
    'Note / prossimo passo':'Notes / next step',
    'Referente / supporto':'Contact / support',
    'Servizio':'Service',
    'Data prevista':'Due date',
    'Qui trovi le funzioni aggiuntive. Il menu principale resta semplice.':'Additional functions, without cluttering the main menu.',
    'Lingua / Language':'Language / Lingua',
    'Seleziona la lingua del gestionale.':'Choose the workspace language.',
    'Password e accessi':'Passwords & access',
    'Registro riservato e autorizzazioni, con i controlli originali.':'Private access register and original authorization controls.',
    'Strumenti completi':'More tools',
    'Progetti, roadmap, acquisti, storico e altre funzioni originali.':'Projects, roadmap, purchases, history and other original functions.',
    'Apri Pass':'Open Pass',
    'Utenti':'Users',
    'Progetti':'Projects',
    'Acquisti':'Purchases',
    'Procedure':'Procedures',
    'Retail & POS':'Retail & POS',
    'Programmi del negozio e riferimenti al supporto, senza schermate complicate.':'Store applications and support contacts, without extra clutter.',
    'Dettagli e supporto':'Support details',
    'Supporto da verificare':'Support to confirm',
    'Responsabile da definire':'Owner to confirm',
    'Telefono:':'Phone:',
    'Nessun sistema Retail registrato.':'No retail systems recorded.',
    'Lo store, senza complicazioni':'Store operations, made simple',
    'Le attività da chiudere e i contatti utili, in un unico posto.':'What needs doing and who to contact, in one place.',
    'Aggiorna dati':'Refresh data','+ Nuova attività':'+ New activity',
    'Le cose importanti, subito.':'The important things, right away.',
    'Apri le attività, assegna un responsabile e registra ciò che è stato completato. Lo storico resta nel database.':'Open activities, assign an owner and mark what is done. History stays in the database.',
    'Apri attività →':'Open activities →','Attività aperte':'Open activities',
    'In attesa':'Waiting','Segnalazioni aperte':'Open issues','Completate (storico)':'Completed (history)',
    'Da seguire adesso':'Current priorities','Vedi tutte →':'View all →',
    'Fornitori e supporto':'Vendors & support','Tutte le card →':'All cards →',
    'Rete e supporto IT':'Network & IT support','Incarico tecnico iniziale':'Initial technical engagement',
    'Il mio lavoro e le ore':'My work & hours',
    'Ore, attività, compensi e stato fatture, senza perdere lo storico.':'Hours, activities, fees and invoices, with full history.',
    'Apri registro →':'Open register →',
    'Attività':'Activities','Cosa fare, chi se ne occupa e cosa è stato completato.':'What to do, who owns it and what has been completed.',
    'Aggiorna':'Refresh','Segnalazioni':'Issues','Da seguire':'To follow up','Completate':'Completed',
    'Tutte':'All','Aperte':'Open','Chiuse':'Closed','Nuova segnalazione':'New issue',
    'Lo storico è conservato in Google Sheets.':'History is preserved in Google Sheets.',
    'Nessuna attività per questa selezione.':'No activities match this filter.',
    'Nessuna segnalazione per questa selezione.':'No issues match this filter.',
    'Responsabile da assegnare':'Owner to assign','Prossimo passo:':'Next step:',
    'Modifica':'Edit','Riapri':'Reopen','Completa':'Complete','Da verificare':'To verify',
    'Contatti & supporto':'Contacts & support',
    'Una card per ogni fornitore: ruolo, referente e prossimo passo.':'One card per vendor: role, contact and next step.',
    'Referente:':'Contact:','Prossimo passo:':'Next step:',
    'Da completare nel registro':'To complete in the register',
    'Confermare servizi e contatti con Damiano':'Confirm services and contacts with Damiano',
    'Da documentare':'Needs documentation','Aggiorna card':'Update card',
    'Rete, WatchGuard e supporto eCare':'Network, WatchGuard and eCare support',
    'Coordinamento dell’incarico tecnico iniziale':'Initial technical work coordination',
    "Coordinamento dell'incarico tecnico iniziale":'Initial technical work coordination',
    'Prism, server e migrazione Retail Pro':'Prism, server and Retail Pro migration',
    'Assistenza applicativa e supporto POS':'Application and POS support',
    'Connessione Internet principale':'Primary internet connection',
    'Servizi telefonici e connettività da verificare':'Phone and connectivity services to verify',
    'Altri fornitori':'Other vendors',
    'Le card RIS senza un record nel database indicano chiaramente i dati da completare; non vengono inventati numeri di telefono o contratti.':'Cards without a database record show missing details instead of inventing contacts or contract information.',
    'Sistemi dello store':'Store systems',
    'Computer, reti, programmi e dispositivi, senza informazioni inutili.':'Computers, networks, software and devices at a glance.',
    'Sistemi e servizi':'Systems & services','elementi':'items','Responsabile:':'Owner:','Supporto:':'Support:',
    'Da definire':'To be confirmed','Dispositivi':'Devices','Posizione da registrare':'Location to record',
    'Documenti':'Documents','Collegamenti utili: un clic per trovare il documento corretto.':'Useful links to find the right document in one click.',
    'Database operativo':'Operations database','Attività, segnalazioni e ore':'Activities, issues and hours',
    'Registro IT & Operations':'IT & Operations register','Contratti, dispositivi e servizi':'Contracts, equipment and services',
    'Apri Google Sheet ↗':'Open Google Sheet ↗','Procedure operative':'Operating procedures',
    'registrate':'recorded','Apri ↗':'Open ↗',
    'Password e accessi':'Passwords & access',
    'Tutte le funzioni di credenziali e autorizzazioni, senza perdere le sezioni originali.':'All the original credentials and authorization functions, in one place.',
    'Pass · Password e credenziali':'Pass · Passwords and credentials',
    'Apri il registro riservato di accessi, password mascherate e riferimenti al vault privato.':'Open the private access index, masked passwords and private vault references.',
    'Apri Pass →':'Open Pass →',
    'Utenti e autorizzazioni':'Users & permissions',
    'Visualizza le richieste di accesso, gli utenti e i ruoli consentiti al tuo account.':'View access requests, users and roles permitted for your account.',
    'Gestisci accessi →':'Manage access →',
    'Registro credenziali':'Credentials register',
    'Responsabili degli account, dati di recupero e posizione delle credenziali aziendali.':'Account owners, recovery details and secure storage locations.',
    'Il Bisonte NYC · I dati operativi restano nei registri originali. Le password non sono archiviate in questo sito.':'Il Bisonte NYC · Operational data remains in the original registers. Passwords are not stored in this website.',
    'Apertura accessi':'Opening access area','Caricamento della sezione riservata…':'Loading protected workspace…',
    '← Password e accessi':'← Passwords & access',
    'Nuova attività':'New activity','Modifica attività':'Edit activity',
    'Attività':'Activity','Responsabile':'Owner','Data prevista':'Due date',
    'Stato':'Status','Priorità':'Priority','Note / prossimo passo':'Notes / next step',
    'Annulla':'Cancel','Salva':'Save','Modifiche salvate':'Changes saved',
    'Aggiorna card':'Update card','Referente / supporto':'Contact / support',
    'Servizio':'Service','Modifica':'Edit',
    'Segnala un problema':'Report an issue',
    'Password & accessi':'Passwords & access'
  };
  function localizeSimple(root){
    if(!root)return;
    // Wrap only the simple UI so original Pass, Users and Worklog pages remain translatable.
    root.innerHTML='<div data-i18n-skip="1">'+root.innerHTML+'</div>';
    if(window.IBI18n?.language?.()!=='en'||!document.createTreeWalker)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(!node.parentElement||node.parentElement.closest('script,style,textarea,input'))continue;
      const original=node.nodeValue,trim=original.trim();
      if(Object.prototype.hasOwnProperty.call(EN_UI,trim)){
        node.nodeValue=original.replace(trim,EN_UI[trim]);
      }
    }
  }

  function navForRole(){const out=NAV.slice();if(workRole())out.splice(out.length-1,0,['pmworklog','◷','My work & hours']);return out;}
  App.nav.store_manager=NAV.slice();App.nav.project_manager=NAV.concat([['access_hub','◇','Passwords & access'],['pmworklog','◷','My work & hours']]);App.nav.management=NAV.concat([['access_hub','◇','Passwords & access'],['pmworklog','◷','Work & hours']]);App.nav.it_admin=NAV.concat([['access_hub','◇','Passwords & access'],['pmworklog','◷','My work & hours']]);App.nav.read_only=NAV.slice();
  renderNav=function(){const nav=document.querySelector('#sidebarNav');if(!nav)return;const items=navForRole();nav.innerHTML=items.map(([id,ic,l])=>'<button type="button" class="nav-btn '+(App.page===id?'active':'')+'" data-simple-nav="'+id+'"><span class="nav-icon">'+ic+'</span><span>'+safe(l)+'</span></button>').join('');};
  renderPage=function(){const root=document.querySelector('#pageRoot');if(!root||!App.data)return;const p=App.page;if(p==='pmworklog'){if(workRole())return window.IBPMWorklog.render(root);App.page='dashboard';}
    if(p==='activities')return activities(root);if(p==='partners')return partners(root);if(p==='systems_simple')return systems(root);if(p==='documents'||p==='docs_simple')return documents(root);if(p==='settings')return settings(root);if(p==='retail_simple')return retail(root);if(p==='pass_simple')return accessIndex(root);if(p==='users_simple')return userDirectory(root);if(p==='projects_simple')return projects(root);if(p==='access_hub')return accessHub(root);App.page='dashboard';return home(root);};
  const baseSimpleRender=renderPage;
  renderPage=function(){const result=baseSimpleRender();if(['dashboard','activities','partners','systems_simple','retail_simple','documents','docs_simple','settings','pass_simple','projects_simple','access_hub'].includes(App.page))localizeSimple(document.querySelector('#pageRoot'));return result;};
  document.addEventListener('click',e=>{const nav=e.target.closest('[data-simple-nav]');if(nav){navTo(nav.dataset.simpleNav);return;}const tab=e.target.closest('[data-filter]');if(tab){filter=tab.dataset.filter;renderPage();return;}const kind=e.target.closest('[data-kind]');if(kind){activityKind=kind.dataset.kind;filter=activityKind==='tasks'?'priority':'open';renderPage();return;}const control=e.target.closest('[data-simple]');if(!control)return;const action=control.dataset.simple||'';if(action.startsWith('page:'))return navTo(action.slice(5));if(action==='close-modal'){document.querySelector('#modalRoot').innerHTML='';return;}if(action==='refresh')return refresh();if(action.startsWith('language:')){window.IBI18n?.setLanguage?.(action.slice(9));return;}if(action.startsWith('approve-user:')||action.startsWith('reject-user:')){const approve=action.startsWith('approve-user:');const email=action.slice(approve?13:12);if(!['management','it_admin'].includes(role()))return;const current=window.IBAuth?.current?.()?.user?.email||'Authorized administrator';window.IBAccess.setUserStatus(email,approve?'Approved':'Rejected',current).then(()=>userDirectory(document.querySelector('#pageRoot'))).catch(err=>toast(err.message||'Access update failed'));return;}if(action==='new-task')return taskEditor();if(action==='new-issue')return openRequestModal('issue');if(action.startsWith('edit-task:'))return taskEditor(action.slice(10));if(action.startsWith('edit-vendor:'))return vendorEditor(action.slice(12));if(action.startsWith('edit-issue:'))return window.IBRequestEditor?.open(action.slice(11));if(action.startsWith('task-status:')){const match=/^task-status:(TSK-[^:]+):(.*)$/.exec(action);if(match)return updateStatus(match[1],match[2]);}},false);
  document.addEventListener('DOMContentLoaded',()=>{const input=document.querySelector('#globalSearch');if(input){input.placeholder='Search activities and issues…';input.addEventListener('input',()=>{query=input.value.trim().toLowerCase();if(['dashboard','activities'].includes(App.page))renderPage();});}const env=document.querySelector('#environmentBadge');if(env)env.title='Origine dati: '+String(window.IB_CONFIG?.dataMode||'');});
  document.addEventListener('ib-language-change',()=>{if(typeof App!=='undefined'&&App.data&&['dashboard','activities','partners','systems_simple','retail_simple','documents','docs_simple','settings','pass_simple','projects_simple','access_hub'].includes(App.page))render();});
  window.IBSimpleHub={refresh,navTo};
})();
