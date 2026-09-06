const SHEETS = {
  requests: 'REQUESTS',
  projects: 'PROJECTS',
  vendors: 'VENDORS',
  systems: 'SYSTEMS',
  sops: 'SOPS',
  decisions: 'DECISIONS',
  improvements: 'IMPROVEMENTS',
  activity: 'ACTIVITY_LOG',
  users: 'USERS',
  notifications: 'NOTIFICATIONS',
  rolePermissions: 'ROLE_PERMISSIONS',
  config: 'CONFIG'
};

function doGet() {
  return jsonResponse({ ok: true, service: 'Il Bisonte NYC Operations API', auth: authMode_() });
}

function doPost(e) {
  try {
    const action = (e.parameter && e.parameter.action) || '';
    const payload = JSON.parse((e.parameter && e.parameter.payload) || '{}');
    const idToken = (e.parameter && e.parameter.idToken) || '';
    const identity = authenticateIdentity_(idToken);
    let data;

    if (action === 'getSession') data = getSession_(identity);
    else if (action === 'requestAccess') data = requestAccess_(payload, identity);
    else {
      const session = requireApprovedSession_(identity);
      enforceActionPermission_(action, session.permissions);
      if (action === 'getAll') data = getAllData_();
      else if (action === 'createRequest') data = createRequest_(payload, session.user);
      else if (action === 'updateRequest') data = updateRequest_(payload.id, payload.patch || {}, session.user);
      else if (action === 'listUsers') data = readObjects_(SHEETS.users);
      else if (action === 'setUserStatus') data = setUserStatus_(payload, session.user);
      else if (action === 'setUserRole') data = setUserRole_(payload, session.user);
      else if (action === 'listNotifications') data = listNotifications_(session.user);
      else if (action === 'createNotification') data = createNotification_(payload);
      else if (action === 'markNotificationRead') data = markNotificationRead_(payload.id, session.user);
      else if (action === 'registerPushSubscription') data = registerPushSubscription_(payload, session.user);
      else throw new Error('Unsupported action: ' + action);
    }
    return jsonResponse({ ok: true, data: data });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || String(err) });
  }
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing Script Property SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function authMode_() {
  return String(PropertiesService.getScriptProperties().getProperty('AUTH_MODE') || 'google').toLowerCase();
}

function authenticateIdentity_(idToken) {
  if (authMode_() === 'demo') return { email:'demo.pm@ilbisonte.local', name:'Demo Project Manager', sub:'demo', emailVerified:true };
  if (!idToken) throw new Error('Authentication required');
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clientId) throw new Error('Missing Script Property GOOGLE_CLIENT_ID');
  const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions:true });
  if (response.getResponseCode() !== 200) throw new Error('Invalid or expired Google sign-in');
  const info = JSON.parse(response.getContentText() || '{}');
  if (String(info.aud || '') !== String(clientId)) throw new Error('Google token audience mismatch');
  if (String(info.email_verified) !== 'true') throw new Error('Google email is not verified');
  const email = String(info.email || '').trim().toLowerCase();
  if (!email) throw new Error('Google account email unavailable');
  enforceAllowedDomain_(email);
  return { email:email, name:info.name || email, sub:info.sub || '', picture:info.picture || '', emailVerified:true };
}

function enforceAllowedDomain_(email) {
  const raw = PropertiesService.getScriptProperties().getProperty('ALLOWED_DOMAINS') || '';
  const domains = raw.split(/[;,]/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  if (!domains.length) return;
  const domain = String(email).split('@')[1] || '';
  if (domains.indexOf(domain.toLowerCase()) < 0) throw new Error('This Google account domain is not allowed');
}

function getSession_(identity) {
  const user = findUserByEmail_(identity.email);
  if (!user) return { identity:identity, user:{email:identity.email,displayName:identity.name,status:'Unregistered',role:'',store:''}, permissions:{} };
  touchUserLogin_(identity);
  const refreshed = findUserByEmail_(identity.email) || user;
  return { identity:identity, user:refreshed, permissions:permissionsForRole_(refreshed.role) };
}

function requireApprovedSession_(identity) {
  const user = findUserByEmail_(identity.email);
  if (!user) throw new Error('Access has not been requested');
  if (String(user.status || '').toLowerCase() !== 'approved') throw new Error('Access is not approved');
  touchUserLogin_(identity);
  return { user:findUserByEmail_(identity.email) || user, permissions:permissionsForRole_(user.role) };
}

function findUserByEmail_(email) {
  const rows = readObjects_(SHEETS.users);
  return rows.find(u=>String(u.email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase()) || null;
}

function touchUserLogin_(identity) {
  const sh = spreadsheet_().getSheetByName(SHEETS.users);if(!sh)return;
  const values=sh.getDataRange().getValues();if(values.length<2)return;
  const headers=values[0], map=headerMap_(headers);
  const idx=values.findIndex((r,i)=>i>0&&String(r[map.email]||'').trim().toLowerCase()===identity.email);
  if(idx<1)return;
  if(map.lastLogin!==undefined)values[idx][map.lastLogin]=date_('yyyy-MM-dd HH:mm');
  if(map.googleSub!==undefined)values[idx][map.googleSub]=identity.sub||'';
  sh.getRange(idx+1,1,1,headers.length).setValues([values[idx]]);
}

function permissionsForRole_(role) {
  const rows = readObjects_(SHEETS.rolePermissions);
  const row = rows.find(r=>String(r.role)===String(role) && truthy_(r.active));
  if (!row) return {};
  const out={};Object.keys(row).forEach(k=>{if(k!=='role'&&k!=='label'&&k!=='active')out[k]=truthy_(row[k])});return out;
}

function enforceActionPermission_(action, p) {
  const required={
    createRequest:'manageRequests', updateRequest:'manageRequests', listUsers:'manageUsers',
    setUserStatus:'approveUsers', setUserRole:'approveUsers', createNotification:'manageUsers'
  }[action];
  if(required&&!p[required])throw new Error('Your role is not authorized for this action');
}

function getAllData_() {
  return {
    requests: readObjects_(SHEETS.requests),
    projects: readObjects_(SHEETS.projects),
    vendors: readObjects_(SHEETS.vendors),
    systems: readObjects_(SHEETS.systems),
    sops: readObjects_(SHEETS.sops),
    decisions: readObjects_(SHEETS.decisions),
    improvements: readObjects_(SHEETS.improvements),
    activity: readActivity_()
  };
}

function readObjects_(sheetName) {
  const sh = spreadsheet_().getSheetByName(sheetName);
  if (!sh) return [];
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r => r.some(Boolean)).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[toCamel_(h)] = row[i]);
    return normalizeObject_(obj);
  });
}

function readActivity_() {
  return readObjects_(SHEETS.activity).map(x => ({ id: x.id, text: x.details || x.action, by: x.actor, at: x.timestamp }));
}

function createRequest_(payload, actorUser) {
  const sh = spreadsheet_().getSheetByName(SHEETS.requests);
  if (!sh) throw new Error('REQUESTS sheet not found');
  const id = nextId_(sh, 'REQ');
  const now = date_('yyyy-MM-dd');
  const requester = payload.requester || actorUser.displayName || actorUser.email || 'Store';
  const row = [id,payload.title || '',payload.category || 'Store Operations',payload.priority || 'Normal','New','Unassigned',requester,now,now,'PM triage',payload.description || '',payload.attachment || ''];
  sh.appendRow(row);
  logActivity_('Request created', 'REQUEST', id, `${id} created: ${payload.title || ''}`, requester);
  createNotification_({recipient:'role:project_manager',title:`New request ${id}`,message:payload.title || 'New store request',type:'request',entityType:'REQUEST',entityId:id,sendEmail:false});
  if (['High','Urgent'].indexOf(payload.priority) >= 0) createNotification_({recipient:'role:management',title:`${payload.priority} request ${id}`,message:payload.title || 'Store request requires attention',type:'request_priority',entityType:'REQUEST',entityId:id,sendEmail:payload.priority === 'Urgent'});
  return rowToRequest_(row);
}

function updateRequest_(id, patch, actorUser) {
  if (!id) throw new Error('Missing request id');
  const sh = spreadsheet_().getSheetByName(SHEETS.requests);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const rowIndex = values.findIndex((r, idx) => idx > 0 && String(r[0]) === String(id));
  if (rowIndex < 1) throw new Error('Request not found: ' + id);
  const map = headerMap_(headers);
  const editable = ['title','category','priority','status','owner','requester','nextAction','description','attachmentRef'];
  editable.forEach(key => { if (patch[key] !== undefined && map[key] !== undefined) values[rowIndex][map[key]] = patch[key]; });
  if (map.updatedAt !== undefined) values[rowIndex][map.updatedAt] = date_('yyyy-MM-dd');
  sh.getRange(rowIndex + 1, 1, 1, headers.length).setValues([values[rowIndex]]);
  const actor=actorUser.displayName||actorUser.email||'Project Manager';
  logActivity_('Request updated', 'REQUEST', id, `${id} updated to ${patch.status || 'updated'}`, actor);
  createNotification_({recipient:'role:project_manager',title:`${id} updated`,message:`Status: ${patch.status || 'updated'}`,type:'request_update',entityType:'REQUEST',entityId:id,sendEmail:false});
  return normalizeObject_(objectFromRow_(headers, values[rowIndex]));
}

function requestAccess_(payload, identity) {
  const email = identity.email;
  const sh = spreadsheet_().getSheetByName(SHEETS.users);
  if (!sh) throw new Error('USERS sheet not found');
  const role = validateRole_(payload.role || 'store_manager');
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const map = headerMap_(headers);
  const idx = values.findIndex((r,i)=>i>0 && String(r[map.email] || '').toLowerCase() === email);
  const rowObj = {
    email: email, displayName: payload.displayName || identity.name || email, role: role, status: 'Pending',
    requestedAt: date_('yyyy-MM-dd HH:mm'), approvedBy: '', approvedAt: '', store: payload.store || 'New York',
    pushSubscription: '', lastLogin:date_('yyyy-MM-dd HH:mm'), googleSub:identity.sub||'', department:payload.department||'', notes:'', accessVersion:'1'
  };
  if (idx > 0) {
    Object.keys(rowObj).forEach(k=>{if(map[k]!==undefined) values[idx][map[k]]=rowObj[k]});
    sh.getRange(idx+1,1,1,headers.length).setValues([values[idx]]);
  } else sh.appendRow(headers.map(h=>rowObj[toCamel_(h)] || ''));
  logActivity_('Access requested','USER',email,`${rowObj.displayName} requested ${rowObj.role} access`,rowObj.displayName);
  createNotification_({recipient:'role:project_manager',title:'New access request',message:`${rowObj.displayName} requested ${prettyRole_(rowObj.role)} access.`,type:'access_request',entityType:'USER',entityId:email,sendEmail:false});
  createNotification_({recipient:'role:management',title:'Approval required',message:`${rowObj.displayName} is waiting for access approval.`,type:'approval',entityType:'USER',entityId:email,sendEmail:false});
  sendAdminEmail_('Il Bisonte Operations — new access request',`${rowObj.displayName} (${email}) requested ${prettyRole_(rowObj.role)} access for ${rowObj.store}. Open Access & Users to approve, reject or change the role.`);
  return rowObj;
}

function setUserStatus_(payload, actorUser) {
  const email = String(payload.email || '').trim().toLowerCase();
  const status = payload.status || 'Pending';
  const actor = actorUser.displayName || actorUser.email || 'Management';
  const sh = spreadsheet_().getSheetByName(SHEETS.users);
  const values = sh.getDataRange().getValues();
  const headers = values[0];const map = headerMap_(headers);
  const idx = values.findIndex((r,i)=>i>0 && String(r[map.email] || '').toLowerCase() === email);
  if (idx < 1) throw new Error('User not found: ' + email);
  if(payload.role&&map.role!==undefined)values[idx][map.role]=validateRole_(payload.role);
  if (map.status !== undefined) values[idx][map.status] = status;
  if (map.approvedBy !== undefined) values[idx][map.approvedBy] = actor;
  if (map.approvedAt !== undefined) values[idx][map.approvedAt] = date_('yyyy-MM-dd HH:mm');
  sh.getRange(idx+1,1,1,headers.length).setValues([values[idx]]);
  const displayName = map.displayName !== undefined ? values[idx][map.displayName] : email;
  const finalRole = map.role !== undefined ? values[idx][map.role] : '';
  logActivity_(`Access ${status.toLowerCase()}`,'USER',email,`${email} ${status.toLowerCase()} as ${finalRole} by ${actor}`,actor);
  createNotification_({recipient:email,title:`Access ${status.toLowerCase()}`,message:`Your NYC Operations Hub access request was ${status.toLowerCase()} as ${prettyRole_(finalRole)}.`,type:'access_status',entityType:'USER',entityId:email,sendEmail:false});
  safeSendEmail_(email,`Il Bisonte Operations — access ${status.toLowerCase()}`,`Hello ${displayName || ''},\n\nYour access request for the Il Bisonte NYC Operations Hub was ${status.toLowerCase()}.\n\nRole: ${prettyRole_(finalRole)}\nApproved by: ${actor}\n\nIl Bisonte NYC Operations`);
  return normalizeObject_(objectFromRow_(headers, values[idx]));
}

function setUserRole_(payload, actorUser){
  const email=String(payload.email||'').trim().toLowerCase();const role=validateRole_(payload.role);const sh=spreadsheet_().getSheetByName(SHEETS.users);
  const values=sh.getDataRange().getValues(),headers=values[0],map=headerMap_(headers);const idx=values.findIndex((r,i)=>i>0&&String(r[map.email]||'').toLowerCase()===email);if(idx<1)throw new Error('User not found');
  values[idx][map.role]=role;if(map.accessVersion!==undefined)values[idx][map.accessVersion]=String((Number(values[idx][map.accessVersion])||0)+1);sh.getRange(idx+1,1,1,headers.length).setValues([values[idx]]);
  const actor=actorUser.displayName||actorUser.email||'Management';logActivity_('Role changed','USER',email,`${email} role changed to ${role}`,actor);return normalizeObject_(objectFromRow_(headers,values[idx]));
}

function validateRole_(role){const allowed=readObjects_(SHEETS.rolePermissions).filter(r=>truthy_(r.active)).map(r=>r.role);if(allowed.indexOf(role)<0)throw new Error('Invalid or inactive role');return role;}

function listNotifications_(user) {
  const role = user.role || '';const email = String(user.email || '').toLowerCase();
  return readObjects_(SHEETS.notifications).filter(n=>n.recipient==='all'||String(n.recipient).toLowerCase()===email||n.recipient===`role:${role}`);
}

function createNotification_(payload) {
  const sh = spreadsheet_().getSheetByName(SHEETS.notifications);if (!sh) return payload;
  const id = nextId_(sh,'NTF');
  const row = [id,payload.recipient || 'all',payload.title || 'Notification',payload.message || '',payload.type || 'general','FALSE',date_('yyyy-MM-dd HH:mm'),payload.entityType || '',payload.entityId || '',payload.sendEmail ? 'Requested' : 'Not requested'];
  sh.appendRow(row);
  if (payload.sendEmail) {if (String(payload.recipient || '').indexOf('@') > 0) safeSendEmail_(payload.recipient,payload.title,payload.message);else sendAdminEmail_(payload.title,payload.message);}
  return {id:id,recipient:row[1],title:row[2],message:row[3],type:row[4],read:false,createdAt:row[6],entityType:row[7],entityId:row[8]};
}

function markNotificationRead_(id,user) {
  const sh = spreadsheet_().getSheetByName(SHEETS.notifications);if (!sh) throw new Error('NOTIFICATIONS sheet not found');
  const values=sh.getDataRange().getValues();const headers=values[0];const map=headerMap_(headers);const idx=values.findIndex((r,i)=>i>0&&String(r[map.id])===String(id));if(idx<1)throw new Error('Notification not found');
  const recipient=String(values[idx][map.recipient]||'');if(!(recipient==='all'||recipient===user.email||recipient===`role:${user.role}`))throw new Error('Notification access denied');
  values[idx][map.read]='TRUE';sh.getRange(idx+1,1,1,headers.length).setValues([values[idx]]);return normalizeObject_(objectFromRow_(headers,values[idx]));
}

function registerPushSubscription_(payload,user) {
  const email=String(user.email||'').trim().toLowerCase();const sh=spreadsheet_().getSheetByName(SHEETS.users);const values=sh.getDataRange().getValues();const headers=values[0];const map=headerMap_(headers);
  const idx=values.findIndex((r,i)=>i>0&&String(r[map.email]||'').toLowerCase()===email);if(idx<1)throw new Error('User not found');
  if(map.pushSubscription!==undefined){values[idx][map.pushSubscription]=JSON.stringify(payload.subscription||{});sh.getRange(idx+1,1,1,headers.length).setValues([values[idx]])}return {ok:true,stored:true};
}

function logActivity_(action, entityType, entityId, details, actor) {const sh = spreadsheet_().getSheetByName(SHEETS.activity);if (!sh) return;const id = nextId_(sh, 'ACT');sh.appendRow([id, date_('yyyy-MM-dd HH:mm'), actor || 'System', action, entityType, entityId, details || '']);}
function adminEmails_(){const sh=spreadsheet_().getSheetByName(SHEETS.config);if(!sh)return [];const values=sh.getDataRange().getDisplayValues();const row=values.find((r,i)=>i>0&&String(r[0]).trim().toUpperCase()==='ADMIN_EMAILS');return row&&row[1]?String(row[1]).split(/[;,]/).map(x=>x.trim()).filter(Boolean):[];}
function sendAdminEmail_(subject,body){adminEmails_().forEach(email=>safeSendEmail_(email,subject,body));}
function safeSendEmail_(email,subject,body){try{if(!email||String(email).toLowerCase().endsWith('.local'))return false;MailApp.sendEmail({to:email,subject:subject||'Il Bisonte Operations',body:body||''});return true}catch(e){console.warn('Email failed: '+e.message);return false}}
function nextId_(sheet, prefix) {const lastRow = sheet.getLastRow();if (lastRow < 2) return `${prefix}-0001`;const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat();const max = ids.reduce((m, id) => Math.max(m, Number(String(id).split('-')[1]) || 0), 0);return `${prefix}-${String(max + 1).padStart(4, '0')}`;}
function rowToRequest_(row) { return {id:row[0],title:row[1],category:row[2],priority:row[3],status:row[4],owner:row[5],requester:row[6],createdAt:row[7],updatedAt:row[8],nextAction:row[9],description:row[10],attachmentRef:row[11]}; }
function objectFromRow_(headers,row){const obj={};headers.forEach((h,i)=>obj[toCamel_(h)]=row[i]);return obj;}
function headerMap_(headers){const map={};headers.forEach((h,i)=>map[toCamel_(h)]=i);return map;}
function normalizeObject_(obj){if(obj.dueDate&&!obj.due)obj.due=obj.dueDate;return obj;}
function toCamel_(s){const parts=String(s||'').trim().toLowerCase().split(/[_\s]+/);return parts.map((p,i)=>i?p.charAt(0).toUpperCase()+p.slice(1):p).join('');}
function prettyRole_(role){return ({store_manager:'Store Manager',project_manager:'Project Manager',management:'Management',it_admin:'IT Admin',read_only:'Read Only'})[role]||role;}
function truthy_(v){return v===true||String(v).toLowerCase()==='true'||String(v).toLowerCase()==='yes'||String(v)==='1';}
function date_(pattern){return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/New_York', pattern);}
function jsonResponse(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
