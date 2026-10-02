/**
 * North Pointe T/I Schedule API for the GitHub Pages dashboard.
 * Bound to the North Pointe Google Sheet, but intentionally uses openById()
 * so Web App executions do not depend on an "active" spreadsheet context.
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 */
const SPREADSHEET_ID = '1QonE-Gr2Xl0GB26-WyFPTI36NJxlBVxixasv1cW2LsI';
const SHEETS = {
  schedule: 'Schedule',
  phases: 'Phases',
  settings: 'Project Settings',
  baseline: 'Baseline',
  log: 'Change Log'
};

function ss_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }

function doGet(e) {
  const p = (e && e.parameter) || {};
  const callback = p.callback || p.prefix || '';
  try {
    const action = p.action || 'health';
    // Public health check contains no schedule data and lets the dashboard
    // distinguish deployment problems from token problems.
    if (action === 'health') {
      return output_({ok:true, service:'North Pointe Schedule API', serverTime:new Date().toISOString()}, callback);
    }

    ensureSheets_();
    requireToken_(p.token || '');

    if (action === 'ping') {
      return output_({ok:true, serverTime:new Date().toISOString()}, callback);
    }
    if (action === 'load') {
      return output_({
        ok: true,
        project: getSetting_('Project Name'),
        tasks: readSchedule_(),
        baseline: readBaseline_(),
        phases: readPhases_(),
        settings: readPublicSettings_(),
        revision: getRevision_(),
        serverTime: new Date().toISOString()
      }, callback);
    }
    return output_({ok:false,error:'Unknown action'}, callback);
  } catch (err) {
    return output_({ok:false,error:String(err && err.message ? err.message : err)}, callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    ensureSheets_();
    let raw = '';
    if (e && e.parameter && e.parameter.payload) raw = e.parameter.payload;
    else raw = (e && e.postData && e.postData.contents) || '{}';
    const body = JSON.parse(raw || '{}');
    requireToken_(body.token || '');

    if (body.action === 'replaceSchedule') {
      if (!Array.isArray(body.tasks)) throw new Error('tasks must be an array');
      writeSchedule_(body.tasks, body.actor || 'GitHub Dashboard');
      if (Array.isArray(body.baseline)) writeBaseline_(body.baseline);
      touchRevision_();
      setSetting_('Last Sync', new Date());
      log_('GitHub Dashboard','Replace schedule',body.reason || 'Dashboard save',body.tasks.length,body.tasks.map(t=>t.id).join(', '));
      return output_({ok:true,savedAt:new Date().toISOString(),taskCount:body.tasks.length,revision:getRevision_()}, '');
    }
    return output_({ok:false,error:'Unknown action'}, '');
  } catch (err) {
    return output_({ok:false,error:String(err && err.message ? err.message : err)}, '');
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function ensureSheets_() {
  const ss = ss_();
  ss.setSpreadsheetTimeZone('America/Denver');
  const defs = [
    [SHEETS.schedule,['Sort','Task ID','Phase ID','Phase','Task','Start Date','Duration (Workdays)','Finish Date','Assigned To','Progress','Tenant Impact','Work Window','Predecessor ID','Dependency Type','Access Critical','Constraint Group','Kind','Notes','Last Updated','Updated By']],
    [SHEETS.phases,['Phase ID','Sort','Phase Name','Active','Color']],
    [SHEETS.settings,['Setting','Value','Notes']],
    [SHEETS.baseline,['Task ID','Task','Start Date','Duration (Workdays)','Finish Date','Saved At']],
    [SHEETS.log,['Timestamp','Source','Action','Reason','Task Count','Details']]
  ];
  defs.forEach(([name,headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  });
}

function requireToken_(provided) {
  const expected = String(getSetting_('API Token') || '').trim();
  if (!expected) throw new Error('API Token is blank in Project Settings.');
  if (String(provided || '').trim() !== expected) throw new Error('Invalid API token.');
}

function readSchedule_() {
  const sh = ss_().getSheetByName(SHEETS.schedule);
  if (sh.getLastRow() < 2) return [];
  const values = sh.getRange(2,1,sh.getLastRow()-1,20).getValues();
  return values.filter(r=>r[1]).map(r=>({
    id:String(r[1]), phase:String(r[2]), title:String(r[4]), start:isoDate_(r[5]), duration:Number(r[6])||1,
    owner:String(r[8]||''), progress:Math.round((Number(r[9])||0)*100), impact:String(r[10]||'Low'),
    workWindow:String(r[11]||'Day'), dependsOn:r[12]?String(r[12]):null, dependencyType:String(r[13]||'FS'),
    accessCritical:Boolean(r[14]), constraintGroup:String(r[15]||''), kind:String(r[16]||'common'), notes:String(r[17]||'')
  }));
}

function writeSchedule_(tasks, actor) {
  const sh = ss_().getSheetByName(SHEETS.schedule);
  const phaseMap = {};
  readPhases_().forEach(p=>phaseMap[p.id]=p.name);
  const now = new Date();
  const rows = tasks.map((t,i)=>[
    i+1, String(t.id||''), String(t.phase||''), phaseMap[t.phase]||String(t.phase||''), String(t.title||''), parseISO_(t.start),
    Math.max(1,Number(t.duration)||1), endWorkday_(parseISO_(t.start),Math.max(1,Number(t.duration)||1)), String(t.owner||''),
    Math.max(0,Math.min(100,Number(t.progress)||0))/100, String(t.impact||'Low'), String(t.workWindow||'Day'), t.dependsOn?String(t.dependsOn):'',
    String(t.dependencyType||'FS'), Boolean(t.accessCritical), String(t.constraintGroup||''), String(t.kind||'common'), String(t.notes||''), now, String(actor||'GitHub Dashboard')
  ]);
  const existing = Math.max(sh.getLastRow()-1,0);
  if (existing) sh.getRange(2,1,existing,20).clearContent();
  if (rows.length) {
    sh.getRange(2,1,rows.length,20).setValues(rows);
    sh.getRange(2,6,rows.length,1).setNumberFormat('m/d/yyyy');
    sh.getRange(2,8,rows.length,1).setNumberFormat('m/d/yyyy');
    sh.getRange(2,10,rows.length,1).setNumberFormat('0%');
    sh.getRange(2,19,rows.length,1).setNumberFormat('m/d/yyyy h:mm AM/PM');
  }
}

function readBaseline_() {
  const sh = ss_().getSheetByName(SHEETS.baseline);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,6).getValues().filter(r=>r[0]).map(r=>({id:String(r[0]),start:isoDate_(r[2]),duration:Number(r[3])||1}));
}

function writeBaseline_(baseline) {
  const sh = ss_().getSheetByName(SHEETS.baseline);
  const titleMap = {}; readSchedule_().forEach(t=>titleMap[t.id]=t.title);
  const rows = baseline.map(b=>[String(b.id||''), titleMap[b.id]||'', parseISO_(b.start), Math.max(1,Number(b.duration)||1), endWorkday_(parseISO_(b.start),Math.max(1,Number(b.duration)||1)), new Date()]);
  const existing=Math.max(sh.getLastRow()-1,0);
  if(existing) sh.getRange(2,1,existing,6).clearContent();
  if(rows.length){
    sh.getRange(2,1,rows.length,6).setValues(rows);
    sh.getRange(2,3,rows.length,1).setNumberFormat('m/d/yyyy');
    sh.getRange(2,5,rows.length,1).setNumberFormat('m/d/yyyy');
    sh.getRange(2,6,rows.length,1).setNumberFormat('m/d/yyyy h:mm AM/PM');
  }
}

function readPhases_() {
  const sh=ss_().getSheetByName(SHEETS.phases);
  if(sh.getLastRow()<2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,5).getValues().filter(r=>r[0]).map(r=>({id:String(r[0]),sort:Number(r[1])||0,name:String(r[2]),active:r[3]!==false,color:String(r[4]||'')})).sort((a,b)=>a.sort-b.sort);
}

function readPublicSettings_() {
  return {tenantHours:getSetting_('Tenant Hours'),weekendWork:getSetting_('Weekend Work'),level2Use:getSetting_('Level 2 Use')};
}

function getSetting_(key) {
  const sh=ss_().getSheetByName(SHEETS.settings);
  if(!sh || sh.getLastRow()<2) return '';
  const vals=sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
  const row=vals.find(r=>String(r[0]).trim()===key);
  return row?row[1]:'';
}
function setSetting_(key,value) {
  const sh=ss_().getSheetByName(SHEETS.settings);
  const n=Math.max(sh.getLastRow()-1,1);
  const vals=sh.getRange(2,1,n,2).getValues();
  for(let i=0;i<vals.length;i++) if(String(vals[i][0]).trim()===key){sh.getRange(i+2,2).setValue(value);return;}
  sh.appendRow([key,value,'']);
}

function getRevision_() {
  return String(PropertiesService.getScriptProperties().getProperty('scheduleRevision') || '0');
}
function touchRevision_() {
  PropertiesService.getScriptProperties().setProperty('scheduleRevision', String(Date.now()));
}

function log_(source,action,reason,count,details) {
  ss_().getSheetByName(SHEETS.log).appendRow([new Date(),source,action,reason,count,details]);
}

function onEdit(e) {
  try {
    if(!e || !e.range) return;
    const sh=e.range.getSheet();
    if(sh.getParent().getId()!==SPREADSHEET_ID || sh.getName()!==SHEETS.schedule || e.range.getRow()<2) return;
    sh.getRange(e.range.getRow(),19).setValue(new Date());
    sh.getRange(e.range.getRow(),20).setValue('Google Sheet edit');
    touchRevision_();
    log_('Google Sheet','Manual edit','Cell '+e.range.getA1Notation(),1,String(e.oldValue||'')+' → '+String(e.value||''));
  } catch(err) {}
}

function parseISO_(s) {
  if (s instanceof Date) return new Date(s.getFullYear(),s.getMonth(),s.getDate(),12,0,0);
  const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return new Date();
  return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0);
}
function isoDate_(v) {
  if(!v) return '';
  const d=v instanceof Date?v:new Date(v);
  return Utilities.formatDate(d,'America/Denver','yyyy-MM-dd');
}
function endWorkday_(start,duration) {
  let d=new Date(start), left=Math.max(1,duration)-1;
  while(left>0){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)left--;}
  return d;
}
function output_(obj, callback) {
  const json=JSON.stringify(obj);
  if(callback){
    const safe=String(callback).replace(/[^A-Za-z0-9_$.]/g,'');
    return ContentService.createTextOutput(safe+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
