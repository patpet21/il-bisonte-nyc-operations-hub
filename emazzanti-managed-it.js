(function(){
  const KEY='ib_nyc_ops_demo_v04';
  const project={id:'PRJ-0012',name:'eMazzanti Managed IT Assessment & Support',scope:'Managed IT / Infrastructure',owner:'Pietro / Damiano / eMazzanti',priority:'High',status:'In Progress',due:'2026-09-30',progress:'10',nextAction:'Schedule technical deep-dive and onsite assessment; obtain written findings, support model and commercial proposal',description:"Evaluate eMazzanti as Il Bisonte NYC's structured managed IT partner for proactive monitoring, 24/7 support, WatchGuard management, Wi-Fi/network remediation, device maintenance and future U.S. store scalability.",objective:"Define a sustainable local IT support model that reduces dependence on Italy, gives the NYC store a reliable escalation path and clearly separates managed technical support from Il Bisonte's internal project/operations coordination.",stakeholders:"Damiano Ferraro, Pietro Forestieri, Nadege Konyn, Nirvan L. Ramoutar, Dylan E. D'Souza, Store Manager",deliverables:'Technical assessment; network/cabling review; WatchGuard audit; Wi-Fi/AP recommendations; device inventory; monitoring/patching proposal; 24/7 support/SLA model; prioritized remediation list; commercial proposal; scalable U.S. store standard',risks:'Cost sensitivity; unclear service scope/SLA; overlap with Italy IT responsibilities; managed service may exceed actual needs of a single small U.S. store; support model must remain proportionate to business size',dependencies:'eMazzanti technical assessment; access to store/network equipment; confirmation of Italy IT responsibilities; commercial terms and SLA',notes:'Meeting recap received Sep 7, 2026. Email describes managed-service capabilities and next steps but does not yet include pricing, final SLA, contract term or detailed commercial scope.',links:'',attachments:'Nadege meeting recap / Nirvan follow-up - Sep 7, 2026'};
  const tasks=[
    {id:'TSK-0031',projectId:'PRJ-0012',title:'Schedule eMazzanti technical deep-dive and onsite assessment',owner:'Pietro / Nirvan',status:'In Progress',priority:'High',due:'2026-09-11',notes:'Technical session requested in meeting recap; Pietro is local coordination point.'},
    {id:'TSK-0032',projectId:'PRJ-0012',title:'Complete network, cabling, Wi-Fi and device assessment',owner:'eMazzanti / Pietro',status:'Not Started',priority:'High',due:'2026-09-18',notes:'Include current topology, AP coverage, three store PCs, network devices and operational dependencies.'},
    {id:'TSK-0033',projectId:'PRJ-0012',title:'Perform WatchGuard security and configuration audit',owner:'eMazzanti / Damiano',status:'Not Started',priority:'High',due:'2026-09-18',notes:'Review policies, unnecessary open ports, firmware, best practices and U.S.-store-specific requirements.'},
    {id:'TSK-0034',projectId:'PRJ-0012',title:'Define managed monitoring, patching, 24/7 support and escalation model',owner:'eMazzanti / Pietro / Damiano',status:'Not Started',priority:'High',due:'2026-09-23',notes:'Clarify monitored assets, response times, onsite coverage, after-hours support, exclusions, escalation and coordination with Italy IT.'},
    {id:'TSK-0035',projectId:'PRJ-0012',title:'Review findings, remediation priorities, SLA and commercial proposal',owner:'Pietro / Damiano',status:'Not Started',priority:'High',due:'2026-09-30',notes:'Compare proposed managed service against actual NYC store needs and cost constraints before approval.'}
  ];
  function patch(data){
    if(!data||typeof data!=='object')return data;
    if(!Array.isArray(data.projects))data.projects=[];
    if(!data.projects.some(x=>x.id===project.id))data.projects.push(project);
    if(!Array.isArray(data.tasks))data.tasks=[];
    tasks.forEach(t=>{if(!data.tasks.some(x=>x.id===t.id))data.tasks.push(t)});
    if(Array.isArray(data.vendors)){
      const vendor=data.vendors.find(x=>x.id==='VEN-0001');
      if(vendor)Object.assign(vendor,{name:'eMazzanti Technologies',service:'Managed IT / Network / 24x7 Support / WatchGuard',contact:"Nirvan L. Ramoutar / Nadege Konyn / Dylan E. D'Souza",status:'Assessment / Proposal',nextAction:'Schedule technical deep-dive and onsite assessment; obtain remediation list, monitoring/SLA model and commercial proposal'});
    }
    return data;
  }
  function loadWorkspaceAssets(){
    if(!document.querySelector('link[data-emazzanti-workspace]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href='emazzanti-page.css?v=20260907';link.dataset.emazzantiWorkspace='1';document.head.appendChild(link);
    }
    const loadScript=()=>{
      if(window.__IB_EMAZZANTI_PAGE_LOADING||window.__IB_EMAZZANTI_PAGE_READY)return;
      window.__IB_EMAZZANTI_PAGE_LOADING=true;
      const script=document.createElement('script');script.src='emazzanti-page.js?v=20260907';script.async=true;
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