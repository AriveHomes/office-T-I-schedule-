/* ARIVE shared-link portal: keeps Stephen's Gantt & Tasks tied to the original drag scheduler. */
(() => {
  'use strict';
  // The original scheduler declares shared schedule state in the preceding classic script.
  const tabNames = [{id:'visual',label:'Interactive Calendar'},{id:'gantt',label:"Stephen's Gantt"},{id:'tasks',label:"Stephen's Tasks"}];
  const start = document.querySelector('.page-head');
  const page = document.querySelector('.page');
  if (!start || !page || typeof tasks === 'undefined' || typeof applyChanges !== 'function') return;
  document.title = 'ARIVE HOMES | Office T.I. Live Schedule';
  const nav = document.createElement('nav');
  nav.className = 'portal-tabs';
  nav.setAttribute('aria-label','Schedule views');
  nav.innerHTML = tabNames.map((t,i)=>`<button type="button" class="portal-tab ${i===0?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('')+
    '<span class="portal-spacer"></span><span class="portal-sharing"><i></i>Shareable project view</span><button class="btn tiny secondary" type="button" id="shareLinkBtn">Copy link</button>';
  start.insertAdjacentElement('afterend',nav);
  const visual = document.createElement('div');visual.id='portal-visual';visual.className='portal-panel active';
  const stats = page.querySelector('.stats');
  const baseCard = page.querySelector('.stats + .card');
  const footerHelp = page.querySelector('.bottomhelp');
  for (const el of [stats,baseCard,footerHelp]) if (el) visual.appendChild(el);
  nav.insertAdjacentElement('afterend',visual);
  const gantt = document.createElement('section');gantt.id='portal-gantt';gantt.className='portal-panel';
  const edit = document.createElement('section');edit.id='portal-tasks';edit.className='portal-panel';
  gantt.innerHTML = '<div class="portal-intro"><div><div class="eyebrow">Stephen\'s original Gantt structure</div><h2>Construction Gantt</h2><p>Original task IDs, dates, critical path and float—linked to the interactive calendar.</p></div><button class="btn secondary" type="button" data-go="visual">↗ Open interactive bars</button></div><div class="portal-kpis" id="portalGanttStats"></div><div class="portal-gantt-wrap" id="portalGanttGrid"></div><p class="portal-guide">Red = <strong>critical path</strong>. Blue = other tasks. Light blue = available float. Click any activity to open the same task editor. This is a readable online version of Stephen\'s Gantt; the Excel export preserves his original worksheet.</p>';
  edit.innerHTML = '<div class="portal-intro"><div><div class="eyebrow">Stephen\'s original Tasks columns</div><h2>Tasks &amp; Predecessors</h2><p>Edit durations, links and start overrides here—changes instantly cascade across every view.</p></div><button class="btn secondary" type="button" data-go="visual">↗ Open interactive calendar</button></div><div class="portal-kpis" id="portalTaskStats"></div><div class="portal-sheet" id="portalTaskGrid"></div><p class="portal-guide"><strong>To edit:</strong> change the amber duration, predecessor or requested start cells, then press Enter or click elsewhere. All dates use a Monday–Friday workweek. Changes flow to the calendar and original Gantt, and the “Download updated Excel” button transfers them into Stephen\'s linked workbook.</p>';
  visual.insertAdjacentElement('afterend',gantt);gantt.insertAdjacentElement('afterend',edit);
  const el=id=>document.getElementById(id);
  let active = 'visual';
  function showTab(v){active=v;for(const t of tabNames){el('portal-'+t.id).classList.toggle('active',t.id===v);nav.querySelector('[data-tab="'+t.id+'"]').classList.toggle('active',t.id===v)}if(v==='gantt')renderStephenGantt();if(v==='tasks')renderStephenTasks();if(v==='visual'&&typeof render==='function')render();try{history.replaceState({},'',location.pathname+location.search+'#'+v)}catch(e){}}
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)showTab(b.dataset.tab)});
  page.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)showTab(b.dataset.go)});
  el('shareLinkBtn').addEventListener('click',async()=>{const url=location.href.split('#')[0]+'#visual';try{if(location.protocol==='file:')throw Error('Not hosted');await navigator.clipboard.writeText(url);toast('Share link copied to clipboard')}catch(e){const ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Link copied')}catch(e){toast('Use your browser address bar to copy the link')}ta.remove()}});
  function baseSchedule(){return compute(tasks).rows}
  const phaseColor = n=>COLORS[n]||'#217c71';
  const phaseHeader=(n,count,columns)=>`<tr class="phase-group"><td colspan="${columns}"><span class="portal-accent" style="background:${phaseColor(n)}"></span>PHASE 0${n} · ${esc(NAMES[n])} <span style="font-weight:600;color:#65837f">(${count} tasks)</span></td></tr>`;
  const predVal=(p,k)=>p[k]||'';
  function dateValue(str){return str||''}
  function updateKpis(which){const s=compute(tasks),labels=['<strong>'+s.rows.length+'</strong> activities','<strong>'+s.crit+'</strong> critical path','Finish <strong>'+nice(s.finish)+'</strong>','<strong>'+s.total+'</strong> workdays'];el(which).innerHTML=labels.map(x=>'<span class="portal-pill">'+x+'</span>').join('')}
  function renderStephenTasks(){updateKpis('portalTaskStats');const rows=baseSchedule();let html='<table class="portal-table"><thead><tr><th>ID</th><th>Task name</th><th>Days ✎</th><th>Pred 1 ✎</th><th>Pred 2 ✎</th><th>Pred 3 ✎</th><th>Pred 4 ✎</th><th>Successors</th><th>Requested start ✎</th><th>Start date</th><th>Finish date</th><th>Start day</th><th>Finish day</th><th>Latest start</th><th>Latest finish</th><th>Float days</th><th>Path</th><th>Status</th></tr></thead><tbody>';
  for(let ph=1;ph<=3;ph++){const phaseRows=rows.filter(t=>t.phase===ph);html+=phaseHeader(ph,phaseRows.length,18);for(const t of phaseRows){const startDay=bizCount(BASE_START,t.start),finishDay=bizCount(BASE_START,t.finish),lateStart=bizCount(BASE_START,t.latestStart),lateEnd=bizCount(BASE_START,t.latestFinish);html+=`<tr data-schedule-id="${t.id}"><td><b>${t.id}</b></td><td><button class="task-link" data-open="${t.id}">${esc(t.name)}</button></td><td><input class="duration-input" title="Edit duration in workdays" type="number" min="1" max="365" step="1" data-field="days" value="${t.days}" /></td>${[0,1,2,3].map(k=>`<td><input class="pred-input" title="Predecessor ${k+1}" inputmode="numeric" data-field="pred${k}" value="${predVal(t.preds,k)}" /></td>`).join('')}<td>${t.children?.join(', ')||'—'}</td><td><input class="date-input" type="date" data-field="requested" value="${dateValue(t.requested)}" /></td><td>${short(t.start)}</td><td>${short(t.finish)}</td><td>${startDay}</td><td>${finishDay}</td><td>${lateStart}</td><td>${lateEnd}</td><td class="${t.critical?'critical':'float'}">${t.float}</td><td class="${t.critical?'critical':'float'}">${t.critical?'Critical':'Non-critical'}</td><td>${esc(t.status||'Not started')}</td></tr>`}}
  el('portalTaskGrid').innerHTML=html+'</tbody></table>'}
  el('portalTaskGrid').addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openDrawer(+b.dataset.open)});
  el('portalTaskGrid').addEventListener('change',e=>{const input=e.target.closest('[data-field]');if(!input)return;const id=+input.closest('tr').dataset.scheduleId;const t=baseSchedule().find(t=>t.id===id);if(!t)return;let mod={id};const field=input.dataset.field;let val=input.value.trim();if(field==='days'){const days=Number(val);if(!Number.isInteger(days)||days<1||days>365){toast('Duration must be 1–365 whole workdays');renderStephenTasks();return}mod.days=days}else if(field.startsWith('pred')){let preds=[...t.preds];const k=Number(field.slice(-1));while(preds.length<=k)preds.push(null);if(val&&(!/^\d+$/.test(val))){toast('Predecessor must be a numeric task ID');renderStephenTasks();return}preds[k]=val?Number(val):null;mod.preds=preds.filter(v=>v!=null)}else if(field==='requested'){mod.requested=val;}if(!applyChanges(mod))renderStephenTasks();});
  function renderStephenGantt(){updateKpis('portalGanttStats');const rows=baseSchedule();const start=BASE_START,end=rows.map(t=>t.finish).sort().at(-1);const maxEnd=addDays(end,14);const px=14;const total=diffDays(start,maxEnd)+1;const bw=total*px;
    let header=`<div class="portal-gantt-row header"><div class="gantt-meta"><span>ID</span><span>Task</span><span>Start</span><span>Finish</span><span>Float</span><span>Path</span></div><div class="portal-gantt-time" style="width:${bw}px">`;
    for(let d=start;d<=maxEnd;){const nextMonth=iso(new Date(Date.UTC(+d.slice(0,4),+d.slice(5,7),1))),segEnd=nextMonth>maxEnd?addDays(maxEnd,1):nextMonth;const left=diffDays(start,d)*px,width=diffDays(d,segEnd)*px;header+=`<div class="month-label" style="left:${left}px;width:${width}px">${isoDate(d).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})}</div>`;d=segEnd;}
    for(let d=start;d<=maxEnd;d=addDays(d,7)){const left=diffDays(start,d)*px;header+=`<div class="week-label" style="left:${left}px;width:${Math.min(7,total-diffDays(start,d))*px}px">${short(d)}</div>`;}
    header+='</div></div>';let html=header;
    for(let ph=1;ph<=3;ph++){const group=rows.filter(t=>t.phase===ph);html+=`<div class="portal-gantt-row phase"><div class="gantt-meta" style="color:${phaseColor(ph)};font-weight:900;grid-column:1/-1;display:flex">PHASE 0${ph} · ${esc(NAMES[ph])} (${group.length} tasks)</div><div class="portal-gantt-time" style="width:${bw}px"></div></div>`;
    for(const t of group){const left=diffDays(start,t.start)*px,width=(diffDays(t.start,t.finish)+1)*px,remain=Math.min(t.float,50)*px;html+=`<div class="portal-gantt-row" data-open="${t.id}"><div class="gantt-meta"><b>${t.id}</b><b title="${esc(t.name)}">${esc(t.name)}</b><span>${short(t.start)}</span><span>${short(t.finish)}</span><span class="${t.critical?'crit':'noncrit'}">${t.float} d</span><span class="${t.critical?'crit':'noncrit'}">${t.critical?'Critical':'Non-critical'}</span></div><div class="portal-gantt-time" style="width:${bw}px">${!t.critical?`<div class="portal-gantt-float" style="left:${left+width}px;width:${remain}px"></div>`:''}<div class="portal-gantt-bar ${t.critical?'critical':'other'}" style="left:${left}px;width:${Math.max(5,width-2)}px" title="Task ${t.id}: ${esc(t.name)} | ${short(t.start)} – ${short(t.finish)}">${width>=92?'<span>'+esc(t.name)+'</span>':''}</div></div></div>`}}
    el('portalGanttGrid').innerHTML=html;
  }
  el('portalGanttGrid').addEventListener('click',e=>{const r=e.target.closest('[data-open]');if(r)openDrawer(+r.dataset.open)});
  // Preserve existing drag/drawer mechanisms but refresh both Stephen views whenever a task is recalculated.
  const oldRender=render;
  render=function(...args){const out=oldRender(...args);if(active==='gantt')renderStephenGantt();else if(active==='tasks')renderStephenTasks();return out};
  const fromHash=location.hash.replace('#','');showTab(tabNames.some(t=>t.id===fromHash)?fromHash:'visual');
  window.addEventListener('hashchange',()=>{const h=location.hash.replace('#','');if(tabNames.some(t=>t.id===h))showTab(h)});
})();