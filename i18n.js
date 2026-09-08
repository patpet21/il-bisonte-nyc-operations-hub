/* Bilingual presentation layer for Damiano. Canonical operational data remains English. */
(function(){
  const DAMIANO_EMAIL='dferraro@ilbisonte.net';
  const CACHE_KEY='ib_i18n_it_cache_v1';
  const PREF_PREFIX='ib_language_';
  const MAX_LOCAL_CACHE=1400;
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const sources=new WeakMap();
  const lastApplied=new WeakMap();
  const inflight=new Set();
  let cache=loadCache();
  let enabled=false;
  let language='en';
  let observer=null;
  let timer=null;
  let generation=0;
  let busyCount=0;
  let lastError='';

  const STATIC_IT={
    'Home':'Home',
    'PM Control Center':'Centro di Controllo PM',
    'IT & Operations Overview':'Panoramica IT e Operazioni',
    'Operations Overview':'Panoramica Operativa',
    'Executive Dashboard':'Dashboard Direzionale',
    'Projects':'Progetti',
    'Issues':'Problemi',
    'Issues & Requests':'Problemi e Richieste',
    'Critical Issues':'Problemi Critici',
    'Requests':'Richieste',
    'Vendors':'Fornitori',
    'Systems':'Sistemi',
    'Systems & Assets':'Sistemi e Asset',
    'Procedures':'Procedure',
    'SOP Library':'Libreria SOP',
    'Procedure Library':'Libreria Procedure',
    'Process Improvement':'Miglioramento Processi',
    'Activity Log':'Registro Attività',
    'Recent Activity':'Attività Recenti',
    'Decisions':'Decisioni',
    'Roadmap':'Roadmap',
    'Store Health':'Stato Negozio',
    'Purchases & Visits':'Acquisti e Interventi',
    'Pass & Access':'Password e Accessi',
    'Peter Work Tracking':'Tracciamento Attività Peter',
    'Peter Work & Time':'Attività e Ore di Peter',
    'Peter work':'Attività Peter',
    'Store status':'Stato negozio',
    'Health & service status':'Stato servizi e operatività',
    'Open requests & problems':'Richieste e problemi aperti',
    'Current work & next steps':'Attività correnti e prossimi passi',
    'Hours, activity & billing':'Ore, attività e fatturazione',
    'Active projects':'Progetti attivi',
    'Open issues & requests':'Problemi e richieste aperti',
    'Vendor follow-ups':'Follow-up fornitori',
    'Activity records':'Registrazioni attività',
    'Project work currently moving':'Progetti attualmente in corso',
    'Items still needing action':'Elementi che richiedono ancora un’azione',
    'External actions still open':'Azioni esterne ancora aperte',
    'Operational history available':'Storico operativo disponibile',
    'Needs attention':'Richiede attenzione',
    'The items most likely to need a decision, follow-up or next action.':'Gli elementi che richiedono più probabilmente una decisione, un follow-up o una prossima azione.',
    'View all issues':'Vedi tutti i problemi',
    'Current work, status and next step without opening the full project workspace.':'Attività correnti, stato e prossimo passo senza aprire l’intero spazio del progetto.',
    'Open projects':'Apri progetti',
    'What is open, who owns it and what happens next.':'Cosa è aperto, chi ne è responsabile e cosa succede dopo.',
    'Open register':'Apri registro',
    'Store, IT & vendors':'Negozio, IT e fornitori',
    'A compact operating picture. Details remain in their dedicated workspaces.':'Una vista operativa compatta. I dettagli restano nelle rispettive aree.',
    'SYSTEMS':'SISTEMI',
    'VENDOR COORDINATION':'COORDINAMENTO FORNITORI',
    'RECENT ACTIVITY':'ATTIVITÀ RECENTI',
    'All tools':'Tutti gli strumenti',
    'Every capability remains available here.':'Tutte le funzionalità restano disponibili qui.',
    'Current store service status':'Stato attuale dei servizi del negozio',
    'Hardware, invoices and onsite work':'Hardware, fatture e interventi onsite',
    'Infrastructure and application register':'Registro infrastruttura e applicazioni',
    'Credentials and access workspace':'Area credenziali e accessi',
    'Time, activities, billing and records':'Ore, attività, fatturazione e registrazioni',
    'Phases, dependencies and next steps':'Fasi, dipendenze e prossimi passi',
    'Store procedures and repeatable actions':'Procedure del negozio e attività ripetibili',
    'Full history and audit trail':'Storico completo e audit trail',
    'Open complete project portfolio':'Apri il portafoglio completo dei progetti',
    'Everything important is here. Use the quick routes first, then open a section when you need full detail or edit controls.':'Tutto ciò che conta è qui. Usa prima i collegamenti rapidi, poi apri una sezione quando servono dettagli completi o controlli di modifica.',
    'Activities, hours, billing and supporting records in one working register.':'Attività, ore, fatturazione e registrazioni di supporto in un unico registro operativo.',
    'WORK & TIME TRACKING':'TRACCIAMENTO ATTIVITÀ E ORE',
    'Project Portfolio':'Portafoglio Progetti',
    'Request Register':'Registro Richieste',
    'Vendor Register':'Registro Fornitori',
    'System Register':'Registro Sistemi',
    'Decision Queue':'Coda Decisioni',
    'Requires Attention':'Richiede Attenzione',
    'Next Action':'Prossima Azione',
    'Next action':'Prossima azione',
    'Owner':'Responsabile',
    'Status':'Stato',
    'Priority':'Priorità',
    'Target':'Scadenza',
    'Project':'Progetto',
    'Request':'Richiesta',
    'Service':'Servizio',
    'Contact':'Contatto',
    'System':'Sistema',
    'Vendor':'Fornitore',
    'Scope':'Ambito',
    'Category':'Categoria',
    'Version':'Versione',
    'Purpose':'Scopo',
    'Credential Location':'Posizione Credenziali',
    'Description':'Descrizione',
    'Objective':'Obiettivo',
    'Stakeholders':'Stakeholder',
    'Deliverables':'Deliverable',
    'Risks':'Rischi',
    'Dependencies':'Dipendenze',
    'Notes':'Note',
    'Due date':'Scadenza',
    'Due Date':'Scadenza',
    'Assigned to':'Assegnato a',
    'View all':'Vedi tutti',
    'View library':'Apri libreria',
    'View issues':'Vedi problemi',
    'View backlog':'Apri backlog',
    'Open register':'Apri registro',
    'Open projects':'Apri progetti',
    'Edit':'Modifica',
    'Save':'Salva',
    'Cancel':'Annulla',
    'Delete':'Elimina',
    'Close':'Chiudi',
    'Start':'Avvia',
    'Resolve':'Risolvi',
    'Reopen':'Riapri',
    'New Request':'Nuova Richiesta',
    '+ New Request':'+ Nuova Richiesta',
    '+ New issue':'+ Nuovo problema',
    'Report an Issue':'Segnala un Problema',
    'Sign out':'Esci',
    'Request access':'Richiedi accesso',
    'Install app':'Installa app',
    'Search projects, requests, vendors, or procedures...':'Cerca progetti, richieste, fornitori o procedure...',
    'High':'Alta',
    'Medium':'Media',
    'Low':'Bassa',
    'Urgent':'Urgente',
    'Normal':'Normale',
    'New':'Nuovo',
    'In Progress':'In Corso',
    'In Review':'In Revisione',
    'Not Started':'Non Iniziato',
    'Completed':'Completato',
    'Closed':'Chiuso',
    'Resolved':'Risolto',
    'Pending':'In Attesa',
    'Pending Vendor':'In Attesa del Fornitore',
    'Planned':'Pianificato',
    'Backlog':'Backlog',
    'Deferred':'Rinviato',
    'Required':'Richiesto',
    'Active':'Attivo',
    'Review':'Revisione',
    'Assessment':'Valutazione',
    'No records.':'Nessun record.',
    'No active projects.':'Nessun progetto attivo.',
    'No open issues or requests.':'Nessun problema o richiesta aperta.',
    'No recent activity.':'Nessuna attività recente.',
    'No systems recorded.':'Nessun sistema registrato.',
    'No vendor follow-up currently open.':'Nessun follow-up fornitore attualmente aperto.',
    'Nothing currently needs special attention.':'Al momento nulla richiede attenzione particolare.',
    'Passwords are not stored here':'Le password non sono archiviate qui',
    'Current operational view':'Vista operativa attuale'
  };

  function userEmail(){
    const session=window.IBAuth?.current?.()||{};
    return String(session?.user?.email||window.IB_CURRENT_USER?.email||session?.profile?.email||'').trim().toLowerCase();
  }
  function prefKey(){return PREF_PREFIX+DAMIANO_EMAIL.replace(/[^a-z0-9]/g,'_')}
  function loadCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}}catch(e){return {}}}
  function saveCache(){
    try{
      const keys=Object.keys(cache);
      if(keys.length>MAX_LOCAL_CACHE){keys.slice(0,Math.max(200,keys.length-MAX_LOCAL_CACHE)).forEach(k=>delete cache[k]);}
      localStorage.setItem(CACHE_KEY,JSON.stringify(cache));
    }catch(e){}
  }
  function setBusy(delta){busyCount=Math.max(0,busyCount+delta);updateControl()}
  function setError(message){lastError=String(message||'');updateControl()}

  function start(){
    const auth=window.IBAuth;
    if(!auth?.whenAuthorized){setTimeout(start,60);return}
    auth.whenAuthorized().then(()=>{
      if(userEmail()!==DAMIANO_EMAIL){enabled=false;language='en';document.documentElement.lang='en';return}
      enabled=true;
      language=localStorage.getItem(prefKey())==='it'?'it':'en';
      mountControl();
      installObserver();
      setLanguage(language,false);
    }).catch(()=>{});
  }

  function mountControl(){
    if(q('#ibLanguageSwitch'))return;
    const sidebar=q('.sidebar');if(!sidebar)return;
    const wrap=document.createElement('section');
    wrap.id='ibLanguageSwitch';wrap.className='ib-language-switch';wrap.dataset.i18nSkip='1';
    wrap.innerHTML=`<div class="ib-language-head"><span class="ib-language-label"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg><span id="ibLanguageLabel">Language</span></span></div><div class="ib-language-options" role="group" aria-label="Language"><button type="button" class="ib-language-btn" data-lang="en">EN</button><button type="button" class="ib-language-btn" data-lang="it">IT</button></div><div class="ib-language-status" id="ibLanguageStatus"></div>`;
    const anchor=q('#hubMobileTools',sidebar)||q('.sidebar-foot',sidebar);
    sidebar.insertBefore(wrap,anchor||null);
    qa('[data-lang]',wrap).forEach(btn=>btn.onclick=()=>setLanguage(btn.dataset.lang,true));
    updateControl();
  }

  function updateControl(){
    const wrap=q('#ibLanguageSwitch');if(!wrap)return;
    wrap.dataset.busy=busyCount?'1':'0';
    qa('[data-lang]',wrap).forEach(btn=>{const active=btn.dataset.lang===language;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active))});
    const label=q('#ibLanguageLabel',wrap);if(label)label.textContent=language==='it'?'Lingua':'Language';
    const status=q('#ibLanguageStatus',wrap);if(!status)return;
    if(lastError&&language==='it'){
      status.textContent='Traduzione dinamica non disponibile finché il backend aggiornato non viene pubblicato.';
      status.className='ib-language-status visible error';
    }else if(busyCount&&language==='it'){
      status.textContent='Traduzione in corso…';status.className='ib-language-status visible';
    }else{status.textContent='';status.className='ib-language-status';}
  }

  function setLanguage(next,persist=true){
    if(!enabled)return;
    next=next==='it'?'it':'en';
    language=next;generation++;lastError='';
    if(persist)localStorage.setItem(prefKey(),language);
    document.documentElement.lang=language;
    updateControl();
    if(language==='en')restoreEnglish();else scheduleTranslate(0);
  }

  function installObserver(){
    if(observer)return;
    observer=new MutationObserver(()=>{
      if(!enabled)return;
      if(language==='it')scheduleTranslate(70);
      else restoreEnglish();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  function scheduleTranslate(delay=80){clearTimeout(timer);timer=setTimeout(translateNow,delay)}

  function textNodes(){
    const out=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const parent=node.parentElement;if(!parent)return NodeFilter.FILTER_REJECT;
      if(parent.closest('[data-i18n-skip],script,style,svg,input,textarea,code,pre,[contenteditable="true"],.nav-icon,.brand,.avatar'))return NodeFilter.FILTER_REJECT;
      const text=String(node.nodeValue||'');if(!text.trim())return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    while(walker.nextNode())out.push(walker.currentNode);
    return out;
  }

  function normalizeNodeSource(node){
    const current=String(node.nodeValue||'');
    if(!sources.has(node)){sources.set(node,current);return current;}
    const source=sources.get(node),applied=lastApplied.get(node);
    if(language==='it'&&current!==source&&current!==applied){sources.set(node,current);lastApplied.delete(node);return current;}
    return source;
  }

  function applyNode(node,value){
    const source=sources.get(node)||String(node.nodeValue||'');
    const leading=(source.match(/^\s*/)||[''])[0],trailing=(source.match(/\s*$/)||[''])[0];
    const next=leading+String(value)+trailing;
    lastApplied.set(node,next);
    if(node.nodeValue!==next)node.nodeValue=next;
  }

  function restoreEnglish(){
    textNodes().forEach(node=>{
      const source=sources.get(node);if(source===undefined)return;
      lastApplied.delete(node);if(node.nodeValue!==source)node.nodeValue=source;
    });
    restoreAttributes();
  }

  function shouldTranslate(text){
    const t=String(text||'').trim();
    if(!t||t.length<2||t.length>3500)return false;
    if(!/[A-Za-z]/.test(t))return false;
    if(/^(?:https?:\/\/|www\.|mailto:)/i.test(t))return false;
    if(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(t))return false;
    if(/^(?:PRJ|REQ|TSK|PML|ACT|VEN|SYS|SOP|NTF|PH)-[A-Z0-9-]+$/i.test(t))return false;
    if(/^\$?[\d.,%:/-]+$/.test(t))return false;
    if(['IL BISONTE','NEW YORK','NYC','eMazzanti','WatchGuard','Retail Pro Prism','Spectrum','Verizon'].includes(t))return false;
    return true;
  }

  function localTranslation(text){
    const t=String(text||'').trim();
    return STATIC_IT[t]||cache[t]||'';
  }

  async function translateNow(){
    if(!enabled||language!=='it')return;
    const run=generation;
    mountControl();
    translateAttributes();
    const nodes=textNodes();
    const waiting=new Map();
    nodes.forEach(node=>{
      const raw=normalizeNodeSource(node),source=raw.trim();
      if(!shouldTranslate(source))return;
      const local=localTranslation(source);
      if(local){applyNode(node,local);return;}
      if(!waiting.has(source))waiting.set(source,[]);
      waiting.get(source).push(node);
    });
    const missing=[...waiting.keys()].filter(text=>!inflight.has(text));
    if(!missing.length)return;
    missing.forEach(text=>inflight.add(text));
    setBusy(1);
    try{
      for(let i=0;i<missing.length;i+=32){
        if(language!=='it'||run!==generation)break;
        const chunk=missing.slice(i,i+32);
        const result=await window.IBAuth.backend('translateBatch',{source:'en',target:'it',texts:chunk});
        (result?.items||[]).forEach(item=>{if(item?.source&&item?.translated)cache[String(item.source)]=String(item.translated)});
        saveCache();
        if(language==='it'&&run===generation){
          chunk.forEach(source=>{
            const translated=cache[source];if(!translated)return;
            (waiting.get(source)||[]).forEach(node=>{if(node.isConnected)applyNode(node,translated)});
          });
        }
      }
      setError('');
    }catch(err){setError(err?.message||String(err));}
    finally{missing.forEach(text=>inflight.delete(text));setBusy(-1)}
  }

  function translateAttributes(){
    const input=q('#globalSearch');if(input){
      if(!input.dataset.ibI18nPlaceholderSource)input.dataset.ibI18nPlaceholderSource=input.getAttribute('placeholder')||'';
      const source=input.dataset.ibI18nPlaceholderSource;
      input.setAttribute('placeholder',STATIC_IT[source]||source);
    }
    qa('[aria-label]').forEach(el=>{
      if(el.closest('[data-i18n-skip]'))return;
      if(!el.dataset.ibI18nAriaSource)el.dataset.ibI18nAriaSource=el.getAttribute('aria-label')||'';
      const source=el.dataset.ibI18nAriaSource;if(STATIC_IT[source])el.setAttribute('aria-label',STATIC_IT[source]);
    });
  }

  function restoreAttributes(){
    const input=q('#globalSearch');if(input?.dataset.ibI18nPlaceholderSource)input.setAttribute('placeholder',input.dataset.ibI18nPlaceholderSource);
    qa('[data-ib-i18n-aria-source]').forEach(el=>el.setAttribute('aria-label',el.dataset.ibI18nAriaSource||''));
  }

  window.IBI18n={
    enabled:()=>enabled,
    language:()=>language,
    setLanguage:lang=>setLanguage(lang,true),
    translateNow,
    clearCache:()=>{cache={};try{localStorage.removeItem(CACHE_KEY)}catch(e){}}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
