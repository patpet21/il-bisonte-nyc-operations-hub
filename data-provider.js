(function(){
  const DEMO_KEY = 'ib_nyc_ops_demo_v01';
  const seed = {
    requests:[
      {id:'REQ-0001',title:'Retail Pro connectivity intermittent',category:'Retail / POS',priority:'High',status:'In Progress',owner:'Pietro',requester:'Lisa',createdAt:'2026-09-04',updatedAt:'2026-09-05',nextAction:'Vendor validation and store retest'},
      {id:'REQ-0002',title:'Upstairs Wi-Fi coverage check',category:'Network / Connectivity',priority:'High',status:'Pending',owner:'Vendor',requester:'Lisa',createdAt:'2026-09-03',updatedAt:'2026-09-05',nextAction:'Schedule onsite AP assessment'},
      {id:'REQ-0003',title:'Printer mapping verification',category:'Hardware',priority:'Normal',status:'Resolved',owner:'Pietro',requester:'Store Team',createdAt:'2026-09-02',updatedAt:'2026-09-04',nextAction:'Closed'}
    ],
    projects:[
      {id:'PRJ-0001',name:'NYC Network Stabilization',scope:'Store Operations',owner:'Pietro / Damiano',priority:'High',status:'In Progress',due:'2026-09-15',nextAction:'Final firewall and connectivity validation'},
      {id:'PRJ-0002',name:'Upstairs Wi-Fi Improvement',scope:'Store Operations',owner:'Pietro',priority:'High',status:'Not Started',due:'2026-09-20',nextAction:'Validate access point requirement'},
      {id:'PRJ-0003',name:'Inventory Workflow Mapping',scope:'Process Improvement',owner:'Pietro',priority:'Medium',status:'In Review',due:'2026-09-28',nextAction:'Interview Damiano and store manager'},
      {id:'PRJ-0004',name:'Credential Governance Cleanup',scope:'Governance',owner:'Pietro',priority:'Medium',status:'Not Started',due:'2026-10-05',nextAction:'Define password-manager migration plan'},
      {id:'PRJ-0005',name:'Store Operations Hub Prototype',scope:'Process Improvement',owner:'Pietro',priority:'Medium',status:'In Progress',due:'2026-09-18',nextAction:'Validate workflow with stakeholders'},
      {id:'PRJ-0006',name:'Vendor Contact Baseline',scope:'Vendor Management',owner:'Pietro',priority:'Low',status:'Completed',due:'2026-09-04',nextAction:'Monitor and maintain'}
    ],
    vendors:[
      {id:'VEN-0001',name:'eMazzanti',service:'Network / IT vendor',contact:'US Support',status:'Active',nextAction:'Close current hardware/network items'},
      {id:'VEN-0002',name:'Spectrum',service:'Primary ISP',contact:'Business Support',status:'Active',nextAction:'Document support and escalation path'},
      {id:'VEN-0003',name:'Verizon',service:'Secondary connectivity',contact:'Business Support',status:'Review',nextAction:'Clarify backup role'},
      {id:'VEN-0004',name:'Retail Pro Support',service:'Retail Pro Prism',contact:'Application Support',status:'Active',nextAction:'Document escalation process'}
    ],
    systems:[
      {id:'SYS-0001',name:'Retail Pro Prism',owner:'Damiano / Italy IT',vendor:'Retail Pro Support',status:'Operational',credentialLocation:'Approved password manager (target)'},
      {id:'SYS-0002',name:'WatchGuard Firewall',owner:'Italy IT',vendor:'eMazzanti / assigned specialist',status:'Implementation',credentialLocation:'Corporate IT'},
      {id:'SYS-0003',name:'Spectrum Internet',owner:'Store / Corporate',vendor:'Spectrum',status:'Operational',credentialLocation:'Corporate IT'},
      {id:'SYS-0004',name:'Store Wi-Fi',owner:'Italy IT',vendor:'Network vendor',status:'Monitoring',credentialLocation:'Corporate IT'}
    ],
    sops:[
      {id:'SOP-0001',title:'Store Internet Failure',category:'Connectivity',version:'0.1',status:'Draft'},
      {id:'SOP-0002',title:'Retail Pro Unavailable',category:'Retail / POS',version:'0.1',status:'Draft'},
      {id:'SOP-0003',title:'Vendor Onsite Visit',category:'Vendor Management',version:'0.1',status:'Draft'},
      {id:'SOP-0004',title:'New Employee Access Request',category:'Access',version:'0.1',status:'Planned'}
    ],
    decisions:[
      {id:'DEC-0001',title:'Confirm final network segmentation approach',owner:'Damiano',status:'Required',due:'2026-09-09'},
      {id:'DEC-0002',title:'Approve password manager standard',owner:'Company / IT',status:'Planned',due:'2026-09-30'}
    ],
    improvements:[
      {id:'IMP-0001',title:'Centralize vendor requests',type:'Process',priority:'High',status:'Candidate'},
      {id:'IMP-0002',title:'Automated weekly PM summary',type:'Automation',priority:'Medium',status:'Candidate'},
      {id:'IMP-0003',title:'Inventory workflow automation',type:'AI / Automation',priority:'Medium',status:'Discovery'}
    ],
    activity:[
      {id:'ACT-0001',text:'Network Stabilization project updated',by:'Pietro',at:'2026-09-05 17:10'},
      {id:'ACT-0002',text:'Retail Pro issue moved to In Progress',by:'Pietro',at:'2026-09-05 15:42'},
      {id:'ACT-0003',text:'Vendor follow-up recorded',by:'Pietro',at:'2026-09-05 13:05'},
      {id:'ACT-0004',text:'New issue submitted by store',by:'Lisa',at:'2026-09-04 10:21'}
    ]
  };

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function loadLocal(){
    const existing=localStorage.getItem(DEMO_KEY);
    if(existing){try{return JSON.parse(existing);}catch(e){}}
    localStorage.setItem(DEMO_KEY,JSON.stringify(seed));
    return clone(seed);
  }
  function saveLocal(data){localStorage.setItem(DEMO_KEY,JSON.stringify(data));}
  function nextId(prefix,rows){
    const max=rows.reduce((m,r)=>Math.max(m,Number(String(r.id||'').split('-')[1])||0),0);
    return `${prefix}-${String(max+1).padStart(4,'0')}`;
  }
  function addActivity(data,text,by='System'){
    data.activity.unshift({id:nextId('ACT',data.activity),text,by,at:new Date().toLocaleString()});
    data.activity=data.activity.slice(0,100);
  }

  const demoProvider={
    async getAll(){return loadLocal();},
    async createRequest(payload){
      const data=loadLocal();
      const row={id:nextId('REQ',data.requests),status:'New',owner:'Unassigned',requester:payload.requester||'Store',createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10),nextAction:'PM triage',...payload};
      data.requests.unshift(row);addActivity(data,`${row.id} created: ${row.title}`,row.requester);saveLocal(data);return row;
    },
    async updateRequest(id,patch){
      const data=loadLocal();const row=data.requests.find(x=>x.id===id);if(!row)throw new Error('Request not found');Object.assign(row,patch,{updatedAt:new Date().toISOString().slice(0,10)});addActivity(data,`${id} updated to ${row.status||'updated'}`,'Pietro');saveLocal(data);return row;
    },
    async reset(){localStorage.removeItem(DEMO_KEY);return loadLocal();}
  };

  const appsScriptProvider={
    async call(action,payload={}){
      const url=window.IB_CONFIG.appsScriptUrl;if(!url)throw new Error('Apps Script URL is not configured');
      const body=new URLSearchParams({action,payload:JSON.stringify(payload)});
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});
      if(!res.ok)throw new Error(`Backend error ${res.status}`);const json=await res.json();if(json.error)throw new Error(json.error);return json.data;
    },
    getAll(){return this.call('getAll')},
    createRequest(payload){return this.call('createRequest',payload)},
    updateRequest(id,patch){return this.call('updateRequest',{id,patch})},
    reset(){throw new Error('Reset is disabled in production')}
  };

  window.IBData=(window.IB_CONFIG.dataMode==='apps_script'&&window.IB_CONFIG.appsScriptUrl)?appsScriptProvider:demoProvider;
})();
