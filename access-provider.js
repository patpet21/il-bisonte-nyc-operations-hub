(function(){
  const USERS_KEY='ib_nyc_ops_users_v02';
  const NOTIFS_KEY='ib_nyc_ops_notifications_v02';

  const userSeed=[
    {email:'demo.store@ilbisonte.local',displayName:'Store Manager',role:'store_manager',status:'Approved',requestedAt:'2026-09-01 09:00',approvedBy:'Demo Admin',approvedAt:'2026-09-01 09:05',store:'SoHo / Bleecker Street'},
    {email:'demo.pm@ilbisonte.local',displayName:'Project Manager',role:'project_manager',status:'Approved',requestedAt:'2026-09-01 09:00',approvedBy:'Demo Admin',approvedAt:'2026-09-01 09:05',store:'New York'},
    {email:'demo.management@ilbisonte.local',displayName:'Management',role:'management',status:'Approved',requestedAt:'2026-09-01 09:00',approvedBy:'Demo Admin',approvedAt:'2026-09-01 09:05',store:'Corporate'},
    {email:'new.user@demo.local',displayName:'Demo New User',role:'store_manager',status:'Pending',requestedAt:'2026-09-06 12:30',approvedBy:'',approvedAt:'',store:'SoHo / Bleecker Street'}
  ];

  const notificationSeed=[
    {id:'NTF-0001',recipient:'role:project_manager',title:'New access request',message:'Demo New User requested Store Manager access.',type:'access_request',read:false,createdAt:'2026-09-06 12:30',entityType:'USER',entityId:'new.user@demo.local'},
    {id:'NTF-0002',recipient:'role:management',title:'Approval required',message:'A new user is waiting for approval for the NYC Operations Hub.',type:'approval',read:false,createdAt:'2026-09-06 12:30',entityType:'USER',entityId:'new.user@demo.local'}
  ];

  const clone=v=>JSON.parse(JSON.stringify(v));
  function load(key,seed){const raw=localStorage.getItem(key);if(raw){try{return JSON.parse(raw)}catch(e){}}localStorage.setItem(key,JSON.stringify(seed));return clone(seed)}
  function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function nextId(rows){const max=rows.reduce((m,r)=>Math.max(m,Number(String(r.id||'').split('-')[1])||0),0);return `NTF-${String(max+1).padStart(4,'0')}`}
  function now(){return new Date().toLocaleString()}

  function backendCall(action,payload={}){
    const url=window.IB_CONFIG.appsScriptUrl;
    if(!url) return Promise.reject(new Error('Apps Script URL is not configured'));
    const body=new URLSearchParams({action,payload:JSON.stringify(payload)});
    return fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body})
      .then(r=>{if(!r.ok)throw new Error(`Backend error ${r.status}`);return r.json()})
      .then(j=>{if(j.error)throw new Error(j.error);return j.data});
  }

  const demo={
    async listUsers(){return load(USERS_KEY,userSeed)},
    async requestAccess(payload){
      const users=load(USERS_KEY,userSeed);
      const email=String(payload.email||'').trim().toLowerCase();
      if(!email)throw new Error('Email is required');
      const existing=users.find(u=>String(u.email).toLowerCase()===email);
      const row={email,displayName:payload.displayName||email,role:payload.role||'store_manager',status:'Pending',requestedAt:now(),approvedBy:'',approvedAt:'',store:payload.store||window.IB_CONFIG.storeName};
      if(existing)Object.assign(existing,row);else users.unshift(row);
      save(USERS_KEY,users);
      await this.createNotification({recipient:'role:project_manager',title:'New access request',message:`${row.displayName} requested ${prettyRole(row.role)} access.`,type:'access_request',entityType:'USER',entityId:row.email});
      await this.createNotification({recipient:'role:management',title:'Approval required',message:`${row.displayName} is waiting for access approval.`,type:'approval',entityType:'USER',entityId:row.email});
      return row;
    },
    async setUserStatus(email,status,actor='Project Manager'){
      const users=load(USERS_KEY,userSeed);const row=users.find(u=>u.email===email);if(!row)throw new Error('User not found');
      row.status=status;row.approvedBy=actor;row.approvedAt=now();save(USERS_KEY,users);
      await this.createNotification({recipient:email,title:`Access ${status.toLowerCase()}`,message:`Your NYC Operations Hub access request was ${status.toLowerCase()}.`,type:'access_status',entityType:'USER',entityId:email});
      return row;
    },
    async listNotifications(context={}){
      const rows=load(NOTIFS_KEY,notificationSeed);const role=context.role||'';const email=context.email||'';
      return rows.filter(n=>n.recipient==='all'||n.recipient===email||n.recipient===`role:${role}`);
    },
    async createNotification(payload){
      const rows=load(NOTIFS_KEY,notificationSeed);const row={id:nextId(rows),recipient:payload.recipient||'all',title:payload.title||'Notification',message:payload.message||'',type:payload.type||'general',read:false,createdAt:now(),entityType:payload.entityType||'',entityId:payload.entityId||''};rows.unshift(row);save(NOTIFS_KEY,rows);return row;
    },
    async markNotificationRead(id){const rows=load(NOTIFS_KEY,notificationSeed);const row=rows.find(n=>n.id===id);if(row)row.read=true;save(NOTIFS_KEY,rows);return row},
    async registerPushSubscription(email,subscription){const users=load(USERS_KEY,userSeed);const row=users.find(u=>u.email===email);if(row){row.pushSubscription=JSON.stringify(subscription);save(USERS_KEY,users)}return {ok:true}}
  };

  const backend={
    listUsers(){return backendCall('listUsers')},
    requestAccess(payload){return backendCall('requestAccess',payload)},
    setUserStatus(email,status,actor){return backendCall('setUserStatus',{email,status,actor})},
    listNotifications(context){return backendCall('listNotifications',context)},
    createNotification(payload){return backendCall('createNotification',payload)},
    markNotificationRead(id){return backendCall('markNotificationRead',{id})},
    registerPushSubscription(email,subscription){return backendCall('registerPushSubscription',{email,subscription})}
  };

  function prettyRole(role){return ({store_manager:'Store Manager',project_manager:'Project Manager',management:'Management'})[role]||role}
  window.IBAccess=(window.IB_CONFIG.dataMode==='apps_script'&&window.IB_CONFIG.appsScriptUrl)?backend:demo;
  window.IBPrettyRole=prettyRole;
})();
