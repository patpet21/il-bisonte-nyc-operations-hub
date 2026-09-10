(function(){
  const KEY='ib_nyc_ops_demo_v04';
  const DELIVERY_NOTE='Sep 10, 2026: Nirvan Ramoutar advised that equipment delivery is delayed but is expected before the weekend. eMazzanti is sourcing the hardware through Ingram Micro, an authorized U.S. distributor, rather than Amazon because hardware serial numbers purchased through non-authorized channels can occasionally be blacklisted and may affect WatchGuard support eligibility.';
  const project={id:'PRJ-0012',name:'eMazzanti Managed IT Assessment & Support',scope:'Managed IT / Infrastructure',owner:'Pietro / Damiano / eMazzanti',priority:'High',status:'In Progress',due:'2026-09-30',progress:'10',nextAction:'Confirm Ingram Micro equipment delivery and coordinate WatchGuard / Access Point installation as soon as the hardware arrives',description:"Evaluate eMazzanti as Il Bisonte NYC's structured managed IT partner for proactive monitoring, 24/7 support, WatchGuard management, Wi-Fi/network remediation, device maintenance and future U.S. store scalability.",objective:"Define a sustainable local IT support model that reduces dependence on Italy, gives the NYC store a reliable escalation path and clearly separates managed technical support from Il Bisonte's internal project/operations coordination.",stakeholders:"Damiano Ferraro, Pietro Forestieri, Nadege Konyn, Nirvan L. Ramoutar, Dylan E. D'Souza, Store Manager",deliverables:'Technical assessment; network/cabling review; WatchGuard audit; Wi-Fi/AP recommendations; device inventory; monitoring/patching proposal; 24/7 support/SLA model; prioritized remediation list; commercial proposal; scalable U.S. store standard',risks:'Equipment delivery delay; cost sensitivity; unclear service scope/SLA; overlap with Italy IT responsibilities; managed service may exceed actual needs of a single small U.S. store; support model must remain proportionate to business size',dependencies:'Ingram Micro equipment delivery; eMazzanti technical assessment; access to store/network equipment; confirmation of Italy IT responsibilities; commercial terms and SLA',notes:'Meeting recap received Sep 7, 2026. '+DELIVERY_NOTE,links:'',attachments:'Nadege meeting recap / Nirvan follow-up - Sep 7, 2026; Nirvan equipment delivery update - Sep 10, 2026'};
  const tasks=[
    {id:'TSK-0031',projectId:'PRJ-0012',title:'Schedule eMazzanti technical deep-dive and onsite assessment',owner:'Pietro / Nirvan',status:'In Progress',priority:'High',due:'2026-09-11',notes:'Technical session requested in meeting recap; Pietro is local coordination point.'},
    {id:'TSK-0032',projectId:'PRJ-0012',title:'Complete network, cabling, Wi-Fi and device assessment',owner:'eMazzanti / Pietro',status:'Not Started',priority:'High',due:'2026-09-18',notes:'Include current topology, AP coverage, three store PCs, network devices and operational dependencies.'},
    {id:'TSK-0033',projectId:'PRJ-0012',title:'Perform WatchGuard security and configuration audit',owner:'eMazzanti / Damiano',status:'Not Started',priority:'High',due:'2026-09-18',notes:'Review policies, unnecessary open ports, firmware, best practices and U.S.-store-specific requirements.'},
    {id:'TSK-0034',projectId:'PRJ-0012',title:'Define managed monitoring, patching, 24/7 support and escalation model',owner:'eMazzanti / Pietro / Damiano',status:'Not Started',priority:'High',due:'2026-09-23',notes:'Clarify monitored assets, response times, onsite coverage, after-hours support, exclusions, escalation and coordination with Italy IT.'},
    {id:'TSK-0035',projectId:'PRJ-0012',title:'Review findings, remediation priorities, SLA and commercial proposal',owner:'Pietro / Damiano',status:'Not Started',priority:'High',due:'2026-09-30',notes:'Compare proposed managed service against actual NYC store needs and cost constraints before approval.'},
    {id:'TSK-0036',projectId:'PRJ-0012',title:'Confirm delayed equipment delivery and coordinate WatchGuard / AP installation',owner:'Nirvan / Pietro',status:'In Progress',priority:'High',due:'2026-09-11',notes:DELIVERY_NOTE+' Next step: confirm actual delivery date and installation schedule once the hardware is received.'}
  ];
  function patch(data){
    if(!data||typeof data!=='object')return data;
    if(!Array.isArray(data.projects))data.projects=[];
    const existingProject=data.projects.find(x=>x.id===project.id);
    if(!existingProject){
      data.projects.push(project);
    }else{
      existingProject.nextAction=project.nextAction;
      if(!String(existingProject.risks||'').includes('Equipment delivery delay'))existingProject.risks='Equipment delivery delay; '+String(existingProject.risks||'');
      if(!String(existingProject.dependencies||'').includes('Ingram Micro'))existingProject.dependencies='Ingram Micro equipment delivery; '+String(existingProject.dependencies||'');
      if(!String(existingProject.notes||'').includes('Sep 10, 2026: Nirvan Ramoutar'))existingProject.notes=(String(existingProject.notes||'').trim()+' '+DELIVERY_NOTE).trim();
      if(!String(existingProject.attachments||'').includes('Nirvan equipment delivery update'))existingProject.attachments=(String(existingProject.attachments||'').trim()+'; Nirvan equipment delivery update - Sep 10, 2026').replace(/^;\s*/, '');
    }
    if(!Array.isArray(data.tasks))data.tasks=[];
    tasks.forEach(t=>{if(!data.tasks.some(x=>x.id===t.id))data.tasks.push(t)});
    if(Array.isArray(data.vendors)){
      const vendor=data.vendors.find(x=>x.id==='VEN-0001');
      if(vendor)Object.assign(vendor,{name:'eMazzanti Technologies',service:'Managed IT / Network / 24x7 Support / WatchGuard',contact:"Nirvan L. Ramoutar / Nadege Konyn / Dylan E. D'Souza",status:'Equipment ordered / Awaiting delivery',supplier:'Ingram Micro',nextAction:'Confirm equipment delivery and coordinate WatchGuard / Access Point installation once hardware arrives',notes:(String(vendor.notes||'').includes('Ingram Micro')?vendor.notes:(String(vendor.notes||'').trim()+' '+DELIVERY_NOTE).trim())});
    }
    return data;
  }
  function loadWorkspaceAssets(){
    if(!document.querySelector('link[data-emazzanti-workspace]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href='emazzanti-page.css?v=20260910';link.dataset.emazzantiWorkspace='1';document.head.appendChild(link);
    }
    const loadScript=()=>{
      if(window.__IB_EMAZZANTI_PAGE_LOADING||window.__IB_EMAZZANTI_PAGE_READY)return;
      window.__IB_EMAZZANTI_PAGE_LOADING=true;
      const script=document.createElement('script');script.src='emazzanti-page.js?v=20260910';script.async=true;
      script.onload=()=>{window.__IB_EMAZZANTI_PAGE_LOADING=false;window.__IB_EMAZZANTI_PAGE_READY=true;};
      script.onerror=()=>{window.__IB_EMAZZANTI_PAGE_LOADING=false;console.warn('Unable to load eMazzanti workspace');};
      document.body.appendChild(script);
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadScript,{once:true});else loadScript();
  }
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const data=patch(JSON.parse(raw));localStorage.setItem(KEY,JSON.stringify(data));}
  }catch(e){console.warn('eMazzanti demo migration skipped',e)}
  if(window.IBData){
    const baseGetAll=window.IBData.getAll.bind(window.IBData);
    window.IBData.getAll=async function(){return patch(await baseGetAll())};
    if(typeof window.IBData.reset==='function'){
      const baseReset=window.IBData.reset.bind(window.IBData);
      window.IBData.reset=async function(){const data=patch(await baseReset());try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}return data};
    }
  }
  loadWorkspaceAssets();
})();