const I18N_ITALIAN_VIEW_EMAIL='dferraro@ilbisonte.net';
const I18N_CACHE_SECONDS=21600;
const I18N_MAX_BATCH_ITEMS=40;
const I18N_MAX_ITEM_CHARS=3500;
const I18N_MAX_BATCH_CHARS=24000;

function translateBatch_(payload,user){
  const email=String(user&&user.email||'').trim().toLowerCase();
  if(email!==I18N_ITALIAN_VIEW_EMAIL)throw new Error('Italian translation is not enabled for this account');
  const source=String(payload&&payload.source||'en').toLowerCase();
  const target=String(payload&&payload.target||'it').toLowerCase();
  if(source!=='en'||target!=='it')throw new Error('Only English to Italian translation is enabled');
  const incoming=Array.isArray(payload&&payload.texts)?payload.texts:[];
  const texts=[];let total=0;
  for(let i=0;i<incoming.length&&texts.length<I18N_MAX_BATCH_ITEMS;i++){
    const text=String(incoming[i]||'').trim();
    if(!text||text.length>I18N_MAX_ITEM_CHARS)continue;
    if(total+text.length>I18N_MAX_BATCH_CHARS)break;
    total+=text.length;texts.push(text);
  }
  if(!texts.length)return {source:source,target:target,items:[]};

  const cache=CacheService.getScriptCache();
  const keys=texts.map(text=>i18nCacheKey_(source,target,text));
  let cached={};try{cached=cache.getAll(keys)||{}}catch(e){}
  const pendingCache={};
  const items=texts.map((text,index)=>{
    const key=keys[index];
    if(cached[key])return {source:text,translated:cached[key],cached:true};
    const translated=i18nTranslateProtected_(text,source,target);
    pendingCache[key]=translated;
    return {source:text,translated:translated,cached:false};
  });
  try{if(Object.keys(pendingCache).length)cache.putAll(pendingCache,I18N_CACHE_SECONDS)}catch(e){}
  return {source:source,target:target,items:items};
}

function i18nCacheKey_(source,target,text){
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,source+'|'+target+'|'+text,Utilities.Charset.UTF_8);
  return 'i18n:'+digest.slice(0,18).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}

function i18nTranslateProtected_(text,source,target){
  const protectedValues=[];
  const tokenFor=index=>'ZQXIBKEEP'+String(index).padStart(3,'0')+'ZQX';
  const protect=value=>{const token=tokenFor(protectedValues.length);protectedValues.push(String(value));return token;};
  let masked=String(text);
  masked=masked.replace(/https?:\/\/[^\s<>()]+/gi,protect);
  masked=masked.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,protect);
  masked=masked.replace(/\b(?:PRJ|REQ|TSK|PML|ACT|VEN|SYS|SOP|NTF|PH)-[A-Z0-9-]+\b/gi,protect);
  masked=masked.replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g,protect);
  masked=masked.replace(/\b(?:8081|BE600M1|T125-W)\b/gi,protect);
  const brands=['Il Bisonte','eMazzanti','WatchGuard','Retail Pro Prism','Retail Pro','PrismProxy','Spectrum','Verizon','Firebase','Apps Script','Google Sheets','Google','Wi-Fi','VLAN','DHCP','VPN','POS','UPS','APC Back-UPS','Deda Group','DigiGuard'];
  brands.sort((a,b)=>b.length-a.length).forEach(brand=>{
    const re=new RegExp(i18nEscapeRegex_(brand),'gi');
    masked=masked.replace(re,protect);
  });
  let translated;
  try{translated=LanguageApp.translate(masked,source,target)}catch(e){translated=text;}
  protectedValues.forEach((value,index)=>{translated=String(translated).split(tokenFor(index)).join(value);});
  return String(translated||text);
}

function i18nEscapeRegex_(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
