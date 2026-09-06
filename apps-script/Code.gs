const SHEETS = {
  requests: 'REQUESTS',
  projects: 'PROJECTS',
  vendors: 'VENDORS',
  systems: 'SYSTEMS',
  sops: 'SOPS',
  decisions: 'DECISIONS',
  improvements: 'IMPROVEMENTS',
  activity: 'ACTIVITY_LOG'
};

function doGet(e) {
  return jsonResponse({ ok: true, data: getAllData_() });
}

function doPost(e) {
  try {
    const action = (e.parameter && e.parameter.action) || '';
    const payload = JSON.parse((e.parameter && e.parameter.payload) || '{}');
    let data;
    if (action === 'getAll') data = getAllData_();
    else if (action === 'createRequest') data = createRequest_(payload);
    else if (action === 'updateRequest') data = updateRequest_(payload.id, payload.patch || {});
    else throw new Error('Unsupported action: ' + action);
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
  return readObjects_(SHEETS.activity).map(x => ({
    id: x.id,
    text: x.details || x.action,
    by: x.actor,
    at: x.timestamp
  }));
}

function createRequest_(payload) {
  const sh = spreadsheet_().getSheetByName(SHEETS.requests);
  if (!sh) throw new Error('REQUESTS sheet not found');
  const id = nextId_(sh, 'REQ');
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/New_York', 'yyyy-MM-dd');
  const row = [
    id,
    payload.title || '',
    payload.category || 'Store Operations',
    payload.priority || 'Normal',
    'New',
    'Unassigned',
    payload.requester || 'Store',
    now,
    now,
    'PM triage',
    payload.description || '',
    payload.attachment || ''
  ];
  sh.appendRow(row);
  logActivity_('Request created', 'REQUEST', id, `${id} created: ${payload.title || ''}`, payload.requester || 'Store');
  return rowToRequest_(row);
}

function updateRequest_(id, patch) {
  if (!id) throw new Error('Missing request id');
  const sh = spreadsheet_().getSheetByName(SHEETS.requests);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const rowIndex = values.findIndex((r, idx) => idx > 0 && String(r[0]) === String(id));
  if (rowIndex < 1) throw new Error('Request not found: ' + id);
  const map = {};
  headers.forEach((h, i) => map[toCamel_(h)] = i);
  const editable = ['title','category','priority','status','owner','requester','nextAction','description','attachmentRef'];
  editable.forEach(key => {
    if (patch[key] !== undefined && map[key] !== undefined) values[rowIndex][map[key]] = patch[key];
  });
  if (map.updatedAt !== undefined) values[rowIndex][map.updatedAt] = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/New_York', 'yyyy-MM-dd');
  sh.getRange(rowIndex + 1, 1, 1, headers.length).setValues([values[rowIndex]]);
  logActivity_('Request updated', 'REQUEST', id, `${id} updated to ${patch.status || 'updated'}`, 'Project Manager');
  return normalizeObject_(objectFromRow_(headers, values[rowIndex]));
}

function logActivity_(action, entityType, entityId, details, actor) {
  const sh = spreadsheet_().getSheetByName(SHEETS.activity);
  if (!sh) return;
  const id = nextId_(sh, 'ACT');
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/New_York', 'yyyy-MM-dd HH:mm');
  sh.appendRow([id, ts, actor || 'System', action, entityType, entityId, details || '']);
}

function nextId_(sheet, prefix) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return `${prefix}-0001`;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat();
  const max = ids.reduce((m, id) => {
    const n = Number(String(id).split('-')[1]) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

function rowToRequest_(row) {
  return {
    id: row[0], title: row[1], category: row[2], priority: row[3], status: row[4], owner: row[5],
    requester: row[6], createdAt: row[7], updatedAt: row[8], nextAction: row[9], description: row[10], attachmentRef: row[11]
  };
}

function objectFromRow_(headers, row) {
  const obj = {};
  headers.forEach((h, i) => obj[toCamel_(h)] = row[i]);
  return obj;
}

function normalizeObject_(obj) {
  if (obj.dueDate && !obj.due) obj.due = obj.dueDate;
  if (obj.credentialLocation === undefined && obj.credentialLocation !== '') obj.credentialLocation = obj.credentialLocation;
  return obj;
}

function toCamel_(s) {
  const parts = String(s || '').trim().toLowerCase().split(/[_\s]+/);
  return parts.map((p, i) => i ? p.charAt(0).toUpperCase() + p.slice(1) : p).join('');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
