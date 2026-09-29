(() => {
  const MS = 86400000;
  const STORAGE_KEY = 'northPointeTISchedule_github_v1';
  const BASELINE_KEY = 'northPointeTIBaseline_github_v1';
  const SYNC_CONFIG_KEY = 'northPointeTISyncConfig_github_v1';
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const APP_CONFIG = window.NORTH_POINTE_CONFIG || {};
  const DEFAULT_API_URL = String(APP_CONFIG.apiUrl || '').trim();

  const phases = [{"id":"precon","name":"1. Preconstruction + Swing Space"},{"id":"units","name":"2. Units 302 + 304"},{"id":"f3common","name":"3. Level 3 Common Areas"},{"id":"f1common","name":"4. Level 1 Common Areas"},{"id":"move","name":"5. Arive Move Back / Turnover"},{"id":"f2common","name":"6. Level 2 Common Areas"},{"id":"closeout","name":"7. Final Closeout"}];

  const seedTasks = [
    t("logistics", "Final phasing plan + tenant logistics", "precon", "2026-10-26", 3, "GC", "Medium", "Day", "common", 0, null, "FS", "Confirm access routes, delivery path, noise controls, restroom sequencing and emergency contacts for all tenants.", true, ""),
    t("notice", "Issue tenant notices to 301 / 303 + building tenants", "precon", "2026-10-29", 2, "GC", "Low", "Day", "common", 0, "logistics", "FS", "Provide schedule, work-hour expectations and point of contact before mobilization.", false, ""),
    t("swingReady", "Level 2 swing-space / IT readiness", "precon", "2026-10-26", 5, "Arive / IT", "Low", "Day", "move", 0, null, "FS", "Make Level 2 functional before Arive vacates Units 302/304.", false, ""),
    t("moveDown", "Arive move to Level 2 swing space", "precon", "2026-11-02", 2, "Arive / Movers", "Medium", "After-hours preferred", "move", 0, "swingReady", "FS", "Complete move before demolition begins in 302/304.", false, ""),
    t("protect", "Dust protection, signage + protected tenant routes", "precon", "2026-11-02", 2, "GC", "High", "Day", "common", 0, "logistics", "FS", "Maintain continuous access to Units 301/303, elevator/stairs and at least one usable Level 3 restroom.", true, "f3-access"),
    t("isolate", "302/304 isolation + demo readiness", "precon", "2026-11-04", 1, "GC", "Medium", "Day", "unit", 0, "moveDown", "FS", "Verify Arive is fully out of the work area before demo starts.", false, ""),
    t("demo", "302 + 304 demolition", "units", "2026-11-05", 15, "Demo", "High", "Day / noisy work coordinated", "unit", 0, "isolate", "FS", "Three-week weekday-only demolition allowance. Maintain dust separation from occupied Units 301/303.", false, ""),
    t("layout", "Layout + framing", "units", "2026-11-26", 5, "Framing", "Low", "Day", "unit", 0, "demo", "FS", "Field verify layout before MEP rough-in.", false, ""),
    t("roughMEP", "Electrical / plumbing / HVAC / data rough", "units", "2026-12-03", 7, "MEP / Low Voltage", "Low", "Day", "unit", 0, "layout", "FS", "Coordinate all rough-ins before inspection.", false, ""),
    t("roughInspect", "Rough inspections + corrections", "units", "2026-12-14", 2, "GC / Inspectors", "Low", "Day", "unit", 0, "roughMEP", "FS", "Close rough corrections before walls are covered.", false, ""),
    t("drywallHang", "Insulation + drywall hang", "units", "2026-12-16", 6, "Drywall", "Medium", "Day", "unit", 0, "roughInspect", "FS", "Keep corridor clean and protected for 301/303.", false, ""),
    t("drywallFinish", "Tape / finish / texture", "units", "2026-12-24", 7, "Drywall", "Medium", "Day", "unit", 0, "drywallHang", "FS", "Ventilation and odor control required around occupied tenants.", false, ""),
    t("paint", "Prime + paint", "units", "2027-01-04", 6, "Paint", "Medium", "Day", "unit", 0, "drywallFinish", "FS", "Plan ventilation around occupied neighbors.", false, ""),
    t("finishInstall", "Ceilings / lighting / doors / glass / millwork", "units", "2027-01-12", 7, "Finish Trades", "Low", "Day", "unit", 0, "paint", "FS", "Sequence ceiling, lighting, doors, glazing and millwork without blocking corridor access.", false, ""),
    t("unitFlooring", "302/304 flooring", "units", "2027-01-21", 5, "Flooring", "Low", "Day", "unit", 0, "finishInstall", "FS", "Protect completed finishes after flooring installation.", false, ""),
    t("finalMEP", "Final MEP / data / devices", "units", "2027-01-28", 3, "MEP / Low Voltage", "Low", "Day", "unit", 0, "unitFlooring", "FS", "Final fixtures, devices, controls and testing.", false, ""),
    t("unitPunch", "302/304 final punch + clean", "units", "2027-02-02", 4, "GC / Cleaning", "Low", "Day", "unit", 0, "finalMEP", "FS", "Complete interior punch before Arive moves back upstairs.", false, ""),
    t("f3restA", "Level 3 restroom — Phase A", "f3common", "2027-01-11", 8, "GC / Restroom Trades", "High", "Day", "common", 0, "paint", "SS", "Keep the other Level 3 restroom operational for 301/303 while this room is down.", false, "f3-restroom"),
    t("f3restB", "Level 3 restroom — Phase B", "f3common", "2027-01-21", 8, "GC / Restroom Trades", "High", "Day", "common", 0, "f3restA", "FS", "Do not start until Phase A restroom is fully returned to service.", false, "f3-restroom"),
    t("f3hallA", "Level 3 hallway flooring — Zone A", "f3common", "2027-02-02", 3, "Flooring", "High", "After-hours preferred", "common", 0, "f3restB", "FS", "Remove tile / install flooring in one controlled zone. Maintain signed tenant route at all times.", true, "f3-access"),
    t("f3hallB", "Level 3 hallway flooring — Zone B", "f3common", "2027-02-05", 3, "Flooring", "High", "After-hours preferred", "common", 0, "f3hallA", "FS", "Second hallway zone only after Zone A is reopened and safe for 301/303.", true, "f3-access"),
    t("f1restA", "Level 1 restroom — Phase A", "f1common", "2026-12-07", 8, "GC / Restroom Trades", "Medium", "Day", "common", 0, "demo", "FS", "Keep one Level 1 restroom or alternate-floor restroom available.", false, "f1-restroom"),
    t("f1restB", "Level 1 restroom — Phase B", "f1common", "2026-12-17", 8, "GC / Restroom Trades", "Medium", "Day", "common", 0, "f1restA", "FS", "Start after Phase A is back in service.", false, "f1-restroom"),
    t("f1hallA", "Level 1 hallway flooring — Zone A", "f1common", "2026-12-29", 3, "Flooring", "Medium", "Day / phased", "common", 0, "f1restB", "FS", "Maintain building entry and elevator/stair access.", true, "f1-access"),
    t("f1hallB", "Level 1 hallway flooring — Zone B", "f1common", "2027-01-01", 3, "Flooring", "Medium", "Day / phased", "common", 0, "f1hallA", "FS", "Open Zone A before closing Zone B.", true, "f1-access"),
    t("movePrep", "Move-back prep / furniture / IT commissioning", "move", "2027-02-02", 4, "Arive / IT", "Low", "Day", "move", 0, "unitPunch", "SS", "Furniture and IT can stage while final Level 3 common work is finishing.", false, ""),
    t("moveBack", "Arive move from Level 2 back to 302/304", "move", "2027-02-10", 2, "Arive / Movers", "Medium", "After-hours preferred", "move", 0, "f3hallB", "FS", "Do not begin Level 2 common-area demolition until this move is complete.", false, ""),
    t("moveBuffer", "Level 3 occupancy confirmation / move punch", "move", "2027-02-12", 1, "GC / Arive", "Low", "Day", "move", 0, "moveBack", "FS", "Confirm Level 3 is fully operational before starting Level 2 common-area work.", false, ""),
    t("f2protect", "Level 2 common-area protection + temporary routes", "f2common", "2027-02-15", 1, "GC", "Medium", "Day", "common", 0, "moveBuffer", "FS", "Level 2 is now available for common-area remodel work.", true, "f2-access"),
    t("f2restA", "Level 2 restroom — Phase A", "f2common", "2027-02-16", 8, "GC / Restroom Trades", "Medium", "Day", "common", 0, "f2protect", "FS", "Keep alternate restroom available while Phase A is down.", false, "f2-restroom"),
    t("f2restB", "Level 2 restroom — Phase B", "f2common", "2027-02-26", 8, "GC / Restroom Trades", "Medium", "Day", "common", 0, "f2restA", "FS", "Start after Phase A is back in service.", false, "f2-restroom"),
    t("f2hallA", "Level 2 hallway flooring — Zone A", "f2common", "2027-03-10", 3, "Flooring", "Medium", "Day / phased", "common", 0, "f2restB", "FS", "Maintain elevator/stair access and a protected path.", true, "f2-access"),
    t("f2hallB", "Level 2 hallway flooring — Zone B", "f2common", "2027-03-15", 3, "Flooring", "Medium", "Day / phased", "common", 0, "f2hallA", "FS", "Open Zone A before closing Zone B.", true, "f2-access"),
    t("finalPunch", "Whole-building common-area punch + clean", "closeout", "2027-03-18", 4, "GC / Cleaning", "Low", "Day", "common", 0, "f2hallB", "FS", "Final clean, patch, touch-up and closeout of common areas.", false, ""),
    t("finalClose", "Final walkthrough / turnover", "closeout", "2027-03-24", 1, "GC / Arive", "Low", "Day", "move", 0, "finalPunch", "FS", "Final owner walkthrough and closeout.", false, ""),
  ];

  function t(id,title,phase,start,duration,owner,impact,workWindow,kind,progress=0,dependsOn=null,dependencyType='FS',notes='',accessCritical=false,constraintGroup=''){
    return {id,title,phase,start,duration,owner,impact,workWindow,kind,progress,dependsOn,dependencyType,notes,accessCritical,constraintGroup};
  }

  let tasks = loadSchedule();
  let baseline = loadBaseline();
  let history = [];
  let currentView = 'gantt';
  let zoom = 'week';
  let dayW = 30;
  let drag = null;
  let toastTimer;
  let syncConfig = loadSyncConfig();
  let syncState = 'local';
  let syncSaveTimer = null;
  let lastRemoteSavedAt = null;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const els = {
    taskRows: $('#taskRows'), timelineHeader: $('#timelineHeader'), timelineBody: $('#timelineBody'), timelinePane: $('#timelinePane'),
    listRows: $('#listRows'), agendaRows: $('#agendaRows'), phaseFilter: $('#phaseFilter'), search: $('#searchInput'),
    projectFinish: $('#projectFinishLabel'), projectStart: $('#projectStartLabel'), workdayCount: $('#workdayCount'), conflictCount: $('#conflictCount'), warning: $('#warningPanel'),
    taskDialog: $('#taskDialog'), taskForm: $('#taskForm'), taskId: $('#taskId'), taskTitle: $('#taskTitle'), taskPhase: $('#taskPhase'), taskOwner: $('#taskOwner'), taskStart: $('#taskStart'), taskDuration: $('#taskDuration'), taskProgress: $('#taskProgress'), taskImpact: $('#taskImpact'), taskDependency: $('#taskDependency'), taskDependencyType: $('#taskDependencyType'), taskNotes: $('#taskNotes'), taskWorkWindow: $('#taskWorkWindow'), taskAccessCritical: $('#taskAccessCritical'), taskConstraint: $('#taskConstraint'), deleteBtn: $('#deleteTaskBtn'), dialogTitle: $('#dialogTitle'),
    exportDialog: $('#exportDialog'), connectionDialog: $('#connectionDialog'), appsScriptUrl: $('#appsScriptUrl'), apiTokenInput: $('#apiTokenInput'), connectionStatus: $('#connectionStatus'), syncStatusBtn: $('#syncStatusBtn'), syncStatusText: $('#syncStatusText'), refreshBtn: $('#refreshBtn'), autoShift: $('#autoShiftToggle'), zoom: $('#zoomSelect'), toast: $('#toast')
  };

  init();

  function init(){
    phases.forEach(p=>{
      els.phaseFilter.insertAdjacentHTML('beforeend', `<option value="${p.id}">${esc(p.name.replace(/^\d+\.\s*/,''))}</option>`);
      els.taskPhase.insertAdjacentHTML('beforeend', `<option value="${p.id}">${esc(p.name)}</option>`);
    });
    bindEvents();
    render();
    hydrateConnectionForm();
    if(syncConfig.url && syncConfig.token) connectAndLoad(); else { setSyncStatus('local'); hydrateConnectionForm(); }
  }

  function bindEvents(){
    $$('.view-tab').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
    els.phaseFilter.addEventListener('change', render);
    els.search.addEventListener('input', render);
    els.zoom.addEventListener('change',()=>{ zoom=els.zoom.value; dayW=zoom==='day'?42:30; document.documentElement.style.setProperty('--day-w',dayW+'px'); renderGantt(); });
    $('#addTaskBtn').addEventListener('click',()=>openTaskDialog());
    els.syncStatusBtn.addEventListener('click',()=>els.connectionDialog.showModal());
    els.refreshBtn.addEventListener('click',()=>{ if(syncConfig.url && syncConfig.token) connectAndLoad(true); else els.connectionDialog.showModal(); });
    $('#closeConnectionBtn').addEventListener('click',()=>els.connectionDialog.close());
    $('#saveConnectionBtn').addEventListener('click',saveConnectionAndLoad);
    $('#testConnectionBtn').addEventListener('click',testConnection);
    $('#disconnectBtn').addEventListener('click',disconnectRemote);
    $('#closeDialogBtn').addEventListener('click',()=>els.taskDialog.close());
    $('#cancelTaskBtn').addEventListener('click',()=>els.taskDialog.close());
    els.taskForm.addEventListener('submit', saveTaskFromForm);
    els.deleteBtn.addEventListener('click', deleteCurrentTask);
    $('#baselineBtn').addEventListener('click', saveBaseline);
    $('#undoBtn').addEventListener('click', undo);
    $('#exportBtn').addEventListener('click',()=>els.exportDialog.showModal());
    $('#closeExportBtn').addEventListener('click',()=>els.exportDialog.close());
    $('#downloadJsonBtn').addEventListener('click', downloadJson);
    $('#downloadCsvBtn').addEventListener('click', downloadCsv);
    $('#importJsonInput').addEventListener('change', importJson);
    $('#resetBtn').addEventListener('click', resetSchedule);
    $('#todayBtn').addEventListener('click', scrollToProjectStart);
    window.addEventListener('resize', syncPaneScroll);
  }

  function switchView(view){
    currentView=view;
    $$('.view-tab').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
    $$('.view-panel').forEach(x=>x.classList.remove('active'));
    $('#'+view+'View').classList.add('active');
    render();
  }

  function render(){
    normalizeTasks();
    saveSchedule();
    renderStats();
    renderFilters();
    if(currentView==='gantt') renderGantt();
    if(currentView==='list') renderList();
    if(currentView==='agenda') renderAgenda();
  }

  function normalizeTasks(){
    tasks.forEach(x=>{ x.start = formatISO(adjustToWorkday(parseISO(x.start),1)); x.duration = Math.max(1, Number(x.duration)||1); });
    if(els.autoShift?.checked) autoShiftDependencies();
  }

  function autoShiftDependencies(){
    let changed=true, guard=0;
    while(changed && guard<100){
      changed=false; guard++;
      for(const task of tasks){
        if(!task.dependsOn) continue;
        const pred = tasks.find(x=>x.id===task.dependsOn);
        if(!pred) continue;
        const minStart = task.dependencyType==='SS' ? parseISO(pred.start) : nextWorkday(endDate(pred),1);
        if(parseISO(task.start) < minStart){ task.start=formatISO(minStart); changed=true; }
      }
    }
  }

  function getFilteredTasks(){
    const q=els.search.value.trim().toLowerCase(), pf=els.phaseFilter.value;
    return tasks.filter(x=>(pf==='all'||x.phase===pf) && (!q||[x.title,x.owner,x.notes,phaseName(x.phase)].join(' ').toLowerCase().includes(q)));
  }

  function renderFilters(){ /* intentionally stable */ }

  function renderStats(){
    if(!tasks.length) return;
    const starts=tasks.map(x=>parseISO(x.start));
    const finishes=tasks.map(endDate);
    const min=new Date(Math.min(...starts)), max=new Date(Math.max(...finishes));
    els.projectStart.textContent=formatDisplay(min);
    els.projectFinish.textContent=formatDisplay(max);
    els.workdayCount.textContent=countWorkdays(min,max)+' days';
    const conflicts=getConflicts();
    els.conflictCount.textContent=conflicts.length?`${conflicts.length} conflict${conflicts.length===1?'':'s'}`:'0 conflicts';
    els.conflictCount.className=conflicts.length?'status-bad':'status-good';
    if(conflicts.length){
      els.warning.classList.remove('hidden');
      els.warning.innerHTML=`<strong>Tenant access needs attention</strong>${conflicts.map(c=>`<div>• ${esc(c)}</div>`).join('')}`;
    } else {
      els.warning.classList.add('hidden'); els.warning.innerHTML='';
    }
  }

  function getConflicts(){
    const out=[];
    const groups=['f3-restroom','f3-access'];
    for(const g of groups){
      const arr=tasks.filter(x=>x.constraintGroup===g);
      for(let i=0;i<arr.length;i++) for(let j=i+1;j<arr.length;j++){
        if(overlap(arr[i],arr[j])) out.push(`${arr[i].title} overlaps ${arr[j].title}. ${g==='f3-restroom'?'Keep one Level 3 restroom in service.':'Maintain a clear access / egress route for Units 301 and 303.'}`);
      }
    }
    const move=tasks.find(x=>x.id==='moveBack');
    if(move){
      const moveEnd=endDate(move);
      tasks.filter(x=>x.phase==='f2common').forEach(x=>{ if(parseISO(x.start)<=moveEnd) out.push(`${x.title} starts before the Arive Level 2 → Level 3 move is complete.`); });
    }
    return [...new Set(out)];
  }

  function overlap(a,b){ return parseISO(a.start)<=endDate(b) && parseISO(b.start)<=endDate(a); }

  function getTimelineBounds(){
    const starts=tasks.map(x=>parseISO(x.start));
    const ends=tasks.map(endDate);
    let min=new Date(Math.min(...starts)), max=new Date(Math.max(...ends));
    min=addDays(min,-7); max=addDays(max,14);
    return {min:startOfWeek(min),max:endOfWeek(max)};
  }

  function renderGantt(){
    const filtered=getFilteredTasks();
    const {min,max}=getTimelineBounds();
    const totalDays=diffDays(min,max)+1;
    const width=totalDays*dayW;
    els.timelineHeader.style.width=width+'px';
    els.timelineBody.style.width=width+'px';

    const monthHtml=[]; let cursor=new Date(min);
    while(cursor<=max){
      const start=new Date(cursor); const monthEnd=new Date(cursor.getFullYear(),cursor.getMonth()+1,0);
      const end=monthEnd<max?monthEnd:max;
      const days=diffDays(start,end)+1;
      monthHtml.push(`<div class="month-cell" style="width:${days*dayW}px">${monthNames[start.getMonth()]} ${start.getFullYear()}</div>`);
      cursor=addDays(end,1);
    }
    let daysHtml=''; for(let d=new Date(min);d<=max;d=addDays(d,1)) daysHtml+=`<div class="day-cell ${isWeekend(d)?'weekend':''}" style="width:${dayW}px"><span>${dayNames[d.getDay()]}</span><strong>${d.getDate()}</strong></div>`;
    els.timelineHeader.innerHTML=`<div class="month-row">${monthHtml.join('')}</div><div class="day-row">${daysHtml}</div>`;

    let leftHtml='', timeHtml='';
    for(const phase of phases){
      const pt=filtered.filter(x=>x.phase===phase.id);
      if(!pt.length) continue;
      leftHtml+=`<div class="task-row phase-row grid-row"><div class="cell">${esc(phase.name)}</div></div>`;
      timeHtml+=`<div class="timeline-row phase-row" style="width:${width}px"></div>`;
      for(const task of pt){
        const end=endDate(task); const delta=diffDays(min,parseISO(task.start)); const span=diffDays(parseISO(task.start),end)+1;
        const x=delta*dayW, w=Math.max(18,span*dayW-4);
        const base=baseline?.find(b=>b.id===task.id); let baseHtml='';
        if(base){ const bx=diffDays(min,parseISO(base.start))*dayW, bw=(diffDays(parseISO(base.start),endDate(base))+1)*dayW-4; baseHtml=`<div class="baseline-bar" style="left:${bx}px;width:${Math.max(18,bw)}px" title="Baseline"></div>`; }
        leftHtml+=`<div class="task-row grid-row" data-id="${task.id}">
          <div class="cell task-title-col"><div class="task-main"><div class="task-name" title="${escAttr(task.title)}">${esc(task.title)}</div><div class="task-meta">${formatShort(parseISO(task.start))} – ${formatShort(end)}</div><div class="progress-mini"><i style="width:${task.progress}%"></i></div></div></div>
          <div class="cell owner-col"><span class="owner-avatar">${initials(task.owner)}</span><span class="owner-name">${esc(task.owner||'—')}</span></div>
          <div class="cell duration-col">${task.duration}</div>
          <div class="cell impact-col"><span class="impact-badge impact-${task.impact}">${task.impact}</span></div>
        </div>`;
        timeHtml+=`<div class="timeline-row" style="width:${width}px" data-id="${task.id}">${weekendBands(min,max)}${baseHtml}<div class="task-bar ${task.kind} ${task.impact==='High'?'high':''}" data-id="${task.id}" style="left:${x}px;width:${w}px" title="${escAttr(task.title)}\n${formatDisplay(parseISO(task.start))} → ${formatDisplay(end)}\n${task.duration} workdays"><span class="resize-handle left" data-resize="left"></span><span class="bar-label">${esc(task.title)}</span><span class="bar-progress" style="width:${task.progress}%"></span><span class="resize-handle right" data-resize="right"></span></div></div>`;
      }
    }
    els.taskRows.innerHTML=leftHtml; els.timelineBody.innerHTML=timeHtml;
    const today = new Date();
    if(today>=min && today<=max){ const x=diffDays(min,startOfDay(today))*dayW; els.timelineBody.insertAdjacentHTML('beforeend',`<div class="today-line" style="left:${x}px"></div>`); }
    bindGanttInteractions(min);
    syncPaneScroll();
  }

  function weekendBands(min,max){
    let h=''; for(let d=new Date(min);d<=max;d=addDays(d,1)) if(isWeekend(d)) h+=`<span class="weekend-band" style="left:${diffDays(min,d)*dayW}px;width:${dayW}px"></span>`; return h;
  }

  function bindGanttInteractions(timelineMin){
    $$('.task-row[data-id]').forEach(r=>r.addEventListener('dblclick',()=>openTaskDialog(r.dataset.id)));
    $$('.task-bar').forEach(bar=>{
      bar.addEventListener('dblclick',e=>{e.stopPropagation();openTaskDialog(bar.dataset.id)});
      bar.addEventListener('pointerdown',e=>{
        const id=bar.dataset.id, task=tasks.find(x=>x.id===id); if(!task) return;
        pushHistory();
        const mode=e.target.dataset.resize||'move';
        drag={id,mode,startX:e.clientX,origStart:parseISO(task.start),origDuration:task.duration,bar,timelineMin};
        bar.setPointerCapture(e.pointerId); e.preventDefault();
      });
      bar.addEventListener('pointermove',onDragMove);
      bar.addEventListener('pointerup',onDragEnd);
      bar.addEventListener('pointercancel',onDragEnd);
    });
  }

  function onDragMove(e){
    if(!drag) return; const task=tasks.find(x=>x.id===drag.id); if(!task) return;
    const deltaPx=e.clientX-drag.startX, deltaDays=Math.round(deltaPx/dayW);
    if(drag.mode==='move'){
      let newStart=addDays(drag.origStart,deltaDays); newStart=adjustToWorkday(newStart, deltaDays<0?-1:1); task.start=formatISO(newStart);
    } else if(drag.mode==='right'){
      let target=addDays(endDate({start:formatISO(drag.origStart),duration:drag.origDuration}),deltaDays); target=adjustToWorkday(target,deltaDays<0?-1:1);
      task.duration=Math.max(1,countWorkdays(drag.origStart,target));
    } else if(drag.mode==='left'){
      const origEnd=endDate({start:formatISO(drag.origStart),duration:drag.origDuration});
      let newStart=adjustToWorkday(addDays(drag.origStart,deltaDays),deltaDays<0?-1:1);
      if(newStart>origEnd) newStart=origEnd;
      task.start=formatISO(newStart); task.duration=Math.max(1,countWorkdays(newStart,origEnd));
    }
    if(els.autoShift.checked) autoShiftDependencies();
    renderLiveDrag();
  }

  function renderLiveDrag(){
    renderStats();
    const {min}=getTimelineBounds();
    for(const task of tasks){
      const bar=$(`.task-bar[data-id="${task.id}"]`); if(!bar) continue;
      const x=diffDays(min,parseISO(task.start))*dayW, span=diffDays(parseISO(task.start),endDate(task))+1;
      bar.style.left=x+'px'; bar.style.width=Math.max(18,span*dayW-4)+'px';
      const row=$(`.task-row[data-id="${task.id}"] .task-meta`); if(row) row.textContent=`${formatShort(parseISO(task.start))} – ${formatShort(endDate(task))}`;
      const dur=$(`.task-row[data-id="${task.id}"] .duration-col`); if(dur) dur.textContent=task.duration;
    }
  }

  function onDragEnd(){
    if(!drag) return; drag=null; saveSchedule(); render(); queueRemoteSave('Gantt drag / resize'); toast('Schedule updated');
  }

  function renderList(){
    const filtered=getFilteredTasks();
    els.listRows.innerHTML=filtered.map(task=>`<tr data-id="${task.id}"><td>${esc(task.title)}</td><td>${esc(phaseName(task.phase))}</td><td>${formatDisplay(parseISO(task.start))}</td><td>${formatDisplay(endDate(task))}</td><td>${task.duration}</td><td>${esc(task.owner||'—')}</td><td>${task.progress}%</td><td><span class="impact-badge impact-${task.impact}">${task.impact}</span></td><td>${esc(task.workWindow||'Day')}</td><td>${esc(tasks.find(x=>x.id===task.dependsOn)?.title||'—')}</td></tr>`).join('');
    $$('#listRows tr').forEach(r=>r.addEventListener('dblclick',()=>openTaskDialog(r.dataset.id)));
  }

  function renderAgenda(){
    const filtered=[...getFilteredTasks()].sort((a,b)=>parseISO(a.start)-parseISO(b.start));
    const groups={};
    filtered.forEach(task=>{ const wk=formatISO(startOfWeek(parseISO(task.start))); (groups[wk]??=[]).push(task); });
    els.agendaRows.innerHTML=Object.entries(groups).map(([wk,arr])=>`<div class="agenda-week"><h3>Week of ${formatDisplay(parseISO(wk))}</h3>${arr.map(task=>`<div class="agenda-item" data-id="${task.id}"><div><strong>${formatShort(parseISO(task.start))}</strong><small>${task.duration} days</small></div><div><strong>${esc(task.title)}</strong><small>${esc(phaseName(task.phase))}</small></div><div>${esc(task.owner||'—')}</div><div><span class="impact-badge impact-${task.impact}">${task.impact}</span></div></div>`).join('')}</div>`).join('') || '<p class="muted">No schedule items match this filter.</p>';
    $$('.agenda-item').forEach(r=>r.addEventListener('dblclick',()=>openTaskDialog(r.dataset.id)));
  }

  function openTaskDialog(id=null){
    const task=id?tasks.find(x=>x.id===id):null;
    els.dialogTitle.textContent=task?'Edit schedule item':'Add schedule item';
    els.taskId.value=task?.id||''; els.taskTitle.value=task?.title||''; els.taskPhase.value=task?.phase||'units'; els.taskOwner.value=task?.owner||''; els.taskStart.value=task?.start||formatISO(adjustToWorkday(new Date(),1)); els.taskDuration.value=task?.duration||1; els.taskProgress.value=String(task?.progress||0); els.taskImpact.value=task?.impact||'Low'; els.taskDependencyType.value=task?.dependencyType||'FS'; els.taskNotes.value=task?.notes||''; els.taskWorkWindow.value=task?.workWindow||'Day'; els.taskAccessCritical.checked=!!task?.accessCritical; els.taskConstraint.value=task?.constraintGroup||'';
    els.taskDependency.innerHTML='<option value="">None</option>'+tasks.filter(x=>x.id!==id).map(x=>`<option value="${x.id}">${esc(x.title)}</option>`).join(''); els.taskDependency.value=task?.dependsOn||'';
    els.deleteBtn.classList.toggle('hidden',!task);
    els.taskDialog.showModal();
    setTimeout(()=>els.taskTitle.focus(),50);
  }

  function saveTaskFromForm(e){
    e.preventDefault(); pushHistory();
    const id=els.taskId.value||('task_'+Date.now()); const existing=tasks.find(x=>x.id===id);
    const obj={id,title:els.taskTitle.value.trim(),phase:els.taskPhase.value,owner:els.taskOwner.value.trim()||'GC',start:formatISO(adjustToWorkday(parseISO(els.taskStart.value),1)),duration:Math.max(1,Number(els.taskDuration.value)||1),progress:Number(els.taskProgress.value)||0,impact:els.taskImpact.value,workWindow:els.taskWorkWindow.value.trim()||'Day',kind:els.taskPhase.value==='units'?'unit':els.taskPhase.value==='move'?'move':'common',dependsOn:els.taskDependency.value||null,dependencyType:els.taskDependencyType.value,notes:els.taskNotes.value.trim(),accessCritical:els.taskAccessCritical.checked,constraintGroup:els.taskConstraint.value};
    if(existing) Object.assign(existing,obj); else tasks.push(obj);
    if(els.autoShift.checked) autoShiftDependencies();
    els.taskDialog.close(); render(); queueRemoteSave(existing?'Schedule item updated':'Schedule item added'); toast(existing?'Schedule item updated':'Schedule item added');
  }

  function deleteCurrentTask(){
    const id=els.taskId.value; if(!id) return; pushHistory();
    tasks=tasks.filter(x=>x.id!==id); tasks.forEach(x=>{if(x.dependsOn===id)x.dependsOn=null}); els.taskDialog.close(); render(); queueRemoteSave('Schedule item deleted'); toast('Schedule item deleted');
  }

  function saveBaseline(){ baseline=tasks.map(x=>({id:x.id,start:x.start,duration:x.duration})); localStorage.setItem(BASELINE_KEY,JSON.stringify(baseline)); render(); queueRemoteSave('Baseline saved'); toast('Baseline saved'); }
  function loadBaseline(){ try{return JSON.parse(localStorage.getItem(BASELINE_KEY)||'null')}catch{return null} }

  function pushHistory(){ history.push(JSON.stringify(tasks)); if(history.length>30) history.shift(); }
  function undo(){ if(!history.length){toast('Nothing to undo');return} tasks=JSON.parse(history.pop()); render(); queueRemoteSave('Undo'); toast('Last change undone'); }

  function saveSchedule(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks)); }
  function loadSchedule(){ try{ const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); return Array.isArray(x)&&x.length?x:structuredClone(seedTasks); }catch{return structuredClone(seedTasks)} }

  function resetSchedule(){ if(!confirm('Reset all schedule changes back to the original North Pointe schedule?')) return; pushHistory(); tasks=structuredClone(seedTasks); baseline=null; localStorage.removeItem(BASELINE_KEY); render(); queueRemoteSave('Reset to original schedule'); els.exportDialog.close(); toast('Original schedule restored'); }

  function downloadJson(){ download('north-pointe-ti-schedule.json',JSON.stringify({project:'North Pointe T/I',exportedAt:new Date().toISOString(),tasks,baseline},null,2),'application/json'); }
  function downloadCsv(){
    const rows=[['Task','Phase','Start','Finish','Workdays','Assigned','Progress','Tenant Impact','Work Window','Predecessor','Notes'],...tasks.map(x=>[x.title,phaseName(x.phase),x.start,formatISO(endDate(x)),x.duration,x.owner,x.progress+'%',x.impact,x.workWindow||'Day',tasks.find(p=>p.id===x.dependsOn)?.title||'',x.notes||''])];
    download('north-pointe-ti-schedule.csv',rows.map(r=>r.map(csv).join(',')).join('\n'),'text/csv');
  }
  function importJson(e){ const f=e.target.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{try{const data=JSON.parse(reader.result); const imported=Array.isArray(data)?data:data.tasks;if(!Array.isArray(imported))throw 0;pushHistory();tasks=imported;render();queueRemoteSave('JSON schedule imported');els.exportDialog.close();toast('Schedule imported');}catch{alert('That file is not a valid schedule backup.')}};reader.readAsText(f);e.target.value=''; }
  function download(name,content,type){ const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); }


  function loadSyncConfig(){
    try{
      const saved=JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)||'{}')||{};
      return {url:String(saved.url||DEFAULT_API_URL||'').trim(),token:String(saved.token||'').trim()};
    }catch{return {url:DEFAULT_API_URL,token:''}}
  }
  function saveSyncConfig(){ localStorage.setItem(SYNC_CONFIG_KEY,JSON.stringify(syncConfig)); }
  function hydrateConnectionForm(){ els.appsScriptUrl.value=syncConfig.url||DEFAULT_API_URL||''; els.apiTokenInput.value=syncConfig.token||''; }
  function setSyncStatus(state,stamp=null){
    syncState=state; els.syncStatusBtn.classList.remove('local','saved','saving','error','connecting'); els.syncStatusBtn.classList.add(state);
    const labels={local:(syncConfig.url?'Connect Google Sheet':'Set up sync'),connecting:'Connecting…',saving:'Saving…',saved:stamp?`Saved ${formatTime(stamp)}`:'Saved to Google',error:'Sync problem'};
    els.syncStatusText.textContent=labels[state]||state;
    if(els.connectionStatus){ els.connectionStatus.className='connection-status '+(state==='saved'?'good':state==='error'?'bad':''); els.connectionStatus.textContent=state==='saved'?'Connected to Google Sheets.':state==='error'?'Could not connect. Check the URL/token and deployment access.':state==='local'?'Local-only mode.':'Working…'; }
  }
  function formatTime(stamp){ const d=stamp instanceof Date?stamp:new Date(stamp); if(isNaN(d))return ''; return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}); }
  async function saveConnectionAndLoad(){
    syncConfig={url:(els.appsScriptUrl.value.trim()||DEFAULT_API_URL),token:els.apiTokenInput.value.trim()};
    if(!syncConfig.url||!syncConfig.token){alert('Paste the API Token from the Project Settings tab. The Web App URL should already be filled in.');return;}
    saveSyncConfig(); await connectAndLoad(true); if(syncState==='saved') els.connectionDialog.close();
  }
  function jsonpRequest(url,action,token='',timeoutMs=12000){
    return new Promise((resolve,reject)=>{
      let done=false;
      const cb='__npSync_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      const timer=setTimeout(()=>finish(new Error('Timed out contacting Apps Script. Open the Web App URL directly and confirm it is deployed for Anyone.')),timeoutMs);
      function cleanup(){ clearTimeout(timer); try{delete window[cb]}catch{}; s.remove(); }
      function finish(err,data){ if(done)return; done=true; cleanup(); err?reject(err):resolve(data); }
      window[cb]=(data)=>finish(null,data);
      try{
        const u=new URL(url);
        u.searchParams.set('action',action);
        if(token) u.searchParams.set('token',token);
        u.searchParams.set('callback',cb);
        u.searchParams.set('_',Date.now());
        s.src=u.toString();
        s.async=true;
        s.onerror=()=>finish(new Error('Apps Script could not be reached. Confirm Deploy → Manage deployments → Web app → Execute as Me → Who has access: Anyone.'));
        document.head.appendChild(s);
      }catch(err){finish(err)}
    });
  }
  async function testConnection(){
    const url=els.appsScriptUrl.value.trim()||DEFAULT_API_URL;
    const token=els.apiTokenInput.value.trim();
    if(!url){alert('The Apps Script Web App URL is missing.');return;}
    setSyncStatus('connecting');
    try{
      const health=await jsonpRequest(url,'health','');
      if(!health.ok) throw new Error(health.error||'Web App health check failed');
      if(!token){
        setSyncStatus('local');
        els.connectionStatus.className='connection-status good';
        els.connectionStatus.textContent='Web App is reachable. Paste the API Token to finish connecting.';
        return;
      }
      const data=await jsonpRequest(url,'ping',token);
      if(!data.ok)throw new Error(data.error||'Token check failed');
      setSyncStatus('saved',data.serverTime||new Date());
      els.connectionStatus.className='connection-status good';
      els.connectionStatus.textContent='Connection successful. Click “Connect + Load Sheet”.';
    } catch(err){ setSyncStatus('error'); els.connectionStatus.textContent='Connection failed: '+err.message; }
  }
  function disconnectRemote(){ syncConfig={url:DEFAULT_API_URL,token:''};saveSyncConfig();hydrateConnectionForm();setSyncStatus('local');els.connectionDialog.close();toast('Google sync disconnected on this browser'); }
  async function connectAndLoad(){
    if(!syncConfig.url||!syncConfig.token){setSyncStatus('local');return;}
    setSyncStatus('connecting');
    try{
      const data=await jsonpRequest(syncConfig.url,'load',syncConfig.token); if(!data.ok)throw new Error(data.error||'Load failed');
      if(Array.isArray(data.tasks)&&data.tasks.length){tasks=data.tasks.map(x=>({...x,duration:Math.max(1,Number(x.duration)||1),progress:Number(x.progress)||0,workWindow:x.workWindow||'Day'}));saveSchedule();}
      if(Array.isArray(data.baseline)&&data.baseline.length){baseline=data.baseline;localStorage.setItem(BASELINE_KEY,JSON.stringify(baseline));}
      lastRemoteSavedAt=data.serverTime||new Date().toISOString(); setSyncStatus('saved',lastRemoteSavedAt); render(); toast('Loaded from Google Sheets');
    } catch(err){ setSyncStatus('error'); els.connectionStatus.textContent='Connection failed: '+err.message; toast('Could not load Google Sheet — browser backup is still safe'); }
  }
  function queueRemoteSave(reason='Dashboard update'){
    saveSchedule();
    if(!syncConfig.url||!syncConfig.token){setSyncStatus('local');return;}
    setSyncStatus('saving'); clearTimeout(syncSaveTimer); syncSaveTimer=setTimeout(()=>saveRemote(reason),450);
  }
  function postFormNoCors(url,payload){
    // Normal HTML form POSTs are allowed cross-origin even when fetch() is blocked by CORS.
    const frameName='np_post_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const iframe=document.createElement('iframe'); iframe.name=frameName; iframe.style.display='none';
    const form=document.createElement('form'); form.method='POST'; form.action=url; form.target=frameName; form.style.display='none';
    const input=document.createElement('input'); input.type='hidden'; input.name='payload'; input.value=JSON.stringify(payload); form.appendChild(input);
    const marker=document.createElement('input'); marker.type='hidden'; marker.name='source'; marker.value='github-pages'; form.appendChild(marker);
    document.body.append(iframe,form); form.submit();
    setTimeout(()=>{form.remove();iframe.remove();},10000);
  }
  function syncFingerprint(list){return JSON.stringify((list||[]).map(x=>[String(x.id),String(x.start),Number(x.duration)||1,Number(x.progress)||0,String(x.owner||''),String(x.title||'')]));}
  async function confirmRemoteSave(expectedFingerprint){
    let lastErr;
    for(let i=0;i<6;i++){
      await new Promise(r=>setTimeout(r,i===0?900:650));
      try{const data=await jsonpRequest(syncConfig.url,'load',syncConfig.token,9000); if(!data.ok)throw new Error(data.error||'Verify failed'); if(syncFingerprint(data.tasks)===expectedFingerprint)return data; lastErr=new Error('Google Sheet has not finished updating yet.');}
      catch(err){lastErr=err;}
    }
    throw lastErr||new Error('Could not verify save');
  }
  async function saveRemote(reason){
    try{
      const payload={action:'replaceSchedule',token:syncConfig.token,actor:'North Pointe Dashboard',reason,tasks,baseline:Array.isArray(baseline)?baseline:[]};
      const fp=syncFingerprint(tasks); postFormNoCors(syncConfig.url,payload);
      const data=await confirmRemoteSave(fp); lastRemoteSavedAt=data.serverTime||new Date().toISOString(); setSyncStatus('saved',lastRemoteSavedAt);
    } catch(err){ setSyncStatus('error'); els.connectionStatus.textContent='Save failed: '+err.message+' Your latest copy is still stored in this browser.'; }
  }

  function scrollToProjectStart(){ if(currentView!=='gantt')switchView('gantt'); setTimeout(()=>{const {min}=getTimelineBounds();const start=new Date(Math.min(...tasks.map(x=>parseISO(x.start))));els.timelinePane.scrollLeft=Math.max(0,diffDays(min,start)*dayW-dayW*2);},0); }
  function syncPaneScroll(){ /* pane has independent horizontal scroll by design */ }

  function phaseName(id){ return phases.find(p=>p.id===id)?.name.replace(/^\d+\.\s*/,'')||id; }
  function endDate(task){ return addWorkdays(parseISO(task.start),Number(task.duration)-1); }
  function addWorkdays(date,n){ let d=new Date(date); if(n===0)return adjustToWorkday(d,1); const step=n>0?1:-1; let left=Math.abs(n); while(left){d=addDays(d,step);if(!isWeekend(d))left--;} return d; }
  function nextWorkday(date,step=1){ let d=addDays(date,step); while(isWeekend(d))d=addDays(d,step); return d; }
  function adjustToWorkday(date,dir=1){ let d=startOfDay(date); while(isWeekend(d))d=addDays(d,dir<0?-1:1); return d; }
  function countWorkdays(a,b){ let start=a<=b?new Date(a):new Date(b), end=a<=b?new Date(b):new Date(a), n=0; for(let d=start;d<=end;d=addDays(d,1))if(!isWeekend(d))n++; return n; }
  function isWeekend(d){return d.getDay()===0||d.getDay()===6}
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return startOfDay(x)}
  function diffDays(a,b){return Math.round((startOfDay(b)-startOfDay(a))/MS)}
  function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function startOfWeek(d){const x=startOfDay(d);return addDays(x,-x.getDay())}
  function endOfWeek(d){const x=startOfDay(d);return addDays(x,6-x.getDay())}
  function parseISO(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
  function formatISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function formatDisplay(d){return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`}
  function formatShort(d){return `${monthNames[d.getMonth()]} ${d.getDate()}`}
  function initials(s=''){return s.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'—'}
  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function escAttr(s=''){return esc(s).replace(/\n/g,'&#10;')}
  function csv(v=''){const s=String(v).replace(/"/g,'""');return `"${s}"`}
  function toast(msg){clearTimeout(toastTimer);els.toast.textContent=msg;els.toast.classList.add('show');toastTimer=setTimeout(()=>els.toast.classList.remove('show'),1600)}
})();
