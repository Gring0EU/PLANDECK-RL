function MiniDonut({segments,size,centerLabel,centerSub}){
  const s=size||140, r=s*0.36, stroke=s*0.16, c=s/2, circ=2*Math.PI*r;
  const total=segments.reduce((n,x)=>n+x.value,0);
  let offset=0;
  return (
    <div className="donut-wrap" style={{width:s}}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {total>0 && segments.filter(x=>x.value>0).map((seg,i)=>{
          const frac=seg.value/total;
          const dash=frac*circ;
          const el=(
            <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`} strokeLinecap="butt" />
          );
          offset+=dash;
          return el;
        })}
        <text x={c} y={c-4} textAnchor="middle" fontSize={s*0.16} fontWeight="800" fill="var(--text)">{centerLabel}</text>
        {centerSub && <text x={c} y={c+14} textAnchor="middle" fontSize={s*0.075} fontWeight="300" fill="var(--text-soft)">{centerSub}</text>}
      </svg>
    </div>
  );
}

function copyRowsToClipboard(header,rows,setCopied){
  const text=[header,...rows].map(r=>r.join('\t')).join('\n');
  const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html='<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">'
    +'<thead><tr>'+header.map(h=>'<th style="background:#f2f2f5;text-align:left;padding:8px 12px">'+escape(h)+'</th>').join('')+'</tr></thead>'
    +'<tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td style="padding:8px 12px">'+escape(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  const done=()=>{setCopied(true);setTimeout(()=>setCopied(false),1800);};
  if(navigator.clipboard && window.ClipboardItem){
    const item=new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})});
    navigator.clipboard.write([item]).then(done).catch(()=>{fallbackCopyPersonal(html,text);done();});
  } else {
    fallbackCopyPersonal(html,text);done();
  }
}
function fallbackCopyPersonal(html,text){
  const holder=document.createElement('div');
  holder.contentEditable='true';
  holder.style.position='fixed'; holder.style.opacity='0'; holder.style.pointerEvents='none';
  holder.innerHTML=html;
  document.body.appendChild(holder);
  const range=document.createRange(); range.selectNodeContents(holder);
  const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  try{document.execCommand('copy');}catch(e){}
  sel.removeAllRanges();
  document.body.removeChild(holder);
}

function PersonalLogTable({rows,periodLabel,onOpenActivity}){
  const [copied,setCopied]=React.useState(false);
  const byCategory={};
  rows.forEach(r=>{(byCategory[r.category]=byCategory[r.category]||[]).push(r);});
  const categories=Object.keys(byCategory).sort((a,b)=>a.localeCompare(b));
  function copy(){
    const header=['Category','Activity','Date','Status','Tasks'];
    const data=[]; categories.forEach(cat=>{byCategory[cat].forEach(r=>data.push([cat,r.title,r.date,r.status,r.tasksLabel]));});
    copyRowsToClipboard(header,data,setCopied);
  }
  return (
    <section className="personal-section">
      <div className="weekly-col-head" style={{justifyContent:'space-between',display:'flex',alignItems:'center'}}>
        <h3 style={{margin:0}}>Activity Log — {periodLabel}</h3>
        <button className="btn btn-secondary btn-sm" onClick={copy}>{copied?'Copied!':'Copy table'}</button>
      </div>
      {rows.length===0 ? <div className="empty-hint">Nothing recorded for this period.</div> : (
        <table className="summary-table">
          <thead><tr><th>Category</th><th>Activity</th><th>Date</th><th>Status</th><th>Tasks</th></tr></thead>
          <tbody>
            {categories.map(cat=>byCategory[cat].map((r,i)=>(
              <tr key={r.id} className="summary-row" onClick={()=>onOpenActivity(r.id)}>
                {i===0 && <td className="summary-cat" rowSpan={byCategory[cat].length}>{cat}</td>}
                <td>{r.title}</td>
                <td>{r.date}</td>
                <td><span className="status-dot-inline" style={{color:r.statusColor}}>{r.status}</span></td>
                <td>{r.tasksLabel}</td>
              </tr>
            )))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function PersonalDashboard({currentUser,activities,onOpenActivity,period,setPeriod,weekDate,setWeekDate,monthDate,setMonthDate}){
  const U=window.DashUtils;
  const todayIso=U.todayIso();
  const mine=activities.filter(a=>a.participants.includes(currentUser));
  let rangeActivities,rangeLabel,tasksInRange;
  if(period==='week'){
    const start=U.startOfWeek(weekDate),end=U.endOfWeek(weekDate);
    const s=U.iso(start),e=U.iso(end);
    rangeActivities=mine.filter(a=>a.date>=s&&a.date<=e);
    rangeLabel=U.fmtRange(start,end);
  } else if(period==='month'){
    const start=U.startOfMonth(monthDate),end=U.endOfMonth(monthDate);
    const s=U.iso(start),e=U.iso(end);
    rangeActivities=mine.filter(a=>a.date>=s&&a.date<=e);
    rangeLabel=U.fmtMonth(monthDate);
  } else {
    rangeActivities=mine.filter(a=>a.date<=todayIso);
    rangeLabel='All time';
  }
  tasksInRange=[];
  rangeActivities.forEach(a=>{a.tasks.forEach(t=>{if(t.assignee===currentUser||!t.assignee) tasksInRange.push(t);});});
  const uniqueRange=U.uniqueActivities(rangeActivities).sort((a,b)=>a.date<b.date?1:-1);
  const byCat={};
  uniqueRange.forEach(a=>{const c=a.category||'Uncategorized'; byCat[c]=(byCat[c]||0)+1;});
  const categorySegments=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,n])=>({label:cat,value:n,color:U.categoryColors[cat]||'var(--text-soft)'}));
  const byStatus={planned:0,progress:0,done:0};
  uniqueRange.forEach(a=>{byStatus[a.status]++;});
  const statusSegments=[
    {label:'Planned',value:byStatus.planned,color:U.statusMeta.planned.color},
    {label:'In Progress',value:byStatus.progress,color:U.statusMeta.progress.color},
    {label:'Done',value:byStatus.done,color:U.statusMeta.done.color}
  ];
  const tasksDone=tasksInRange.filter(t=>t.done);
  const tasksOpen=tasksInRange.filter(t=>!t.done);
  const tasksOverdue=tasksInRange.filter(t=>U.isTaskOverdue(t));
  const completionRate=tasksInRange.length?Math.round(tasksDone.length/tasksInRange.length*100):0;
  const rows=uniqueRange.map(a=>{
    const myTasks=a.tasks.filter(t=>t.assignee===currentUser||!t.assignee);
    const meta=U.statusMeta[a.status];
    return {id:a.id,category:a.category||'Uncategorized',title:a.title,date:U.fmtDate(a.date),status:meta.label,statusColor:meta.color,tasksLabel:myTasks.length?myTasks.filter(t=>t.done).length+'/'+myTasks.length:'\u2014'};
  });
  return (
    <div className="personal-view">
      <div className="weekly-header">
        <div className="chip-row" style={{margin:0}}>
          <button className={"chip chip-clickable"+(period==='week'?' chip-active':'')} onClick={()=>setPeriod('week')}>Weekly</button>
          <button className={"chip chip-clickable"+(period==='month'?' chip-active':'')} onClick={()=>setPeriod('month')}>Monthly</button>
          <button className={"chip chip-clickable"+(period==='all'?' chip-active':'')} onClick={()=>setPeriod('all')}>Overall</button>
        </div>
        {period==='week' && (
          <React.Fragment>
            <button className="nav-btn" onClick={()=>setWeekDate(d=>{const x=new Date(d);x.setDate(x.getDate()-7);return x;})}>‹</button>
            <div className="weekly-range">{rangeLabel}</div>
            <button className="nav-btn" onClick={()=>setWeekDate(d=>{const x=new Date(d);x.setDate(x.getDate()+7);return x;})}>›</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setWeekDate(new Date())}>This week</button>
          </React.Fragment>
        )}
        {period==='month' && (
          <React.Fragment>
            <button className="nav-btn" onClick={()=>setMonthDate(d=>{const x=new Date(d);x.setMonth(x.getMonth()-1);return x;})}>‹</button>
            <div className="weekly-range">{rangeLabel}</div>
            <button className="nav-btn" onClick={()=>setMonthDate(d=>{const x=new Date(d);x.setMonth(x.getMonth()+1);return x;})}>›</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setMonthDate(new Date())}>This month</button>
          </React.Fragment>
        )}
        {period==='all' && <div className="weekly-range">{rangeLabel}</div>}
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-title">By Category</div>
          <div className="analytics-card-body">
            <MiniDonut segments={categorySegments} centerLabel={uniqueRange.length} centerSub="activities" />
            <div className="legend">
              {categorySegments.length===0 && <div className="empty-hint">Nothing in this period.</div>}
              {categorySegments.map(s=>(
                <div key={s.label} className="legend-row"><span className="legend-dot" style={{background:s.color}}></span><span className="legend-label">{s.label}</span><span className="legend-val">{s.value} · {Math.round(s.value/(uniqueRange.length||1)*100)}%</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title">Status Breakdown</div>
          <div className="analytics-card-body">
            <MiniDonut segments={statusSegments} centerLabel={uniqueRange.length} centerSub="activities" />
            <div className="legend">
              {statusSegments.map(s=>(
                <div key={s.label} className="legend-row"><span className="legend-dot" style={{background:s.color}}></span><span className="legend-label">{s.label}</span><span className="legend-val">{s.value} · {Math.round(s.value/(uniqueRange.length||1)*100)}%</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title">Task Completion</div>
          <div className="task-stat-grid">
            <div className="task-stat"><span className="task-stat-num">{tasksInRange.length}</span><span className="task-stat-label">Total</span></div>
            <div className="task-stat"><span className="task-stat-num" style={{color:'var(--done)'}}>{tasksDone.length}</span><span className="task-stat-label">Completed</span></div>
            <div className="task-stat"><span className="task-stat-num" style={{color:'var(--planned)'}}>{tasksOpen.length}</span><span className="task-stat-label">Remaining</span></div>
            <div className="task-stat"><span className="task-stat-num" style={{color:'var(--danger)'}}>{tasksOverdue.length}</span><span className="task-stat-label">Overdue</span></div>
          </div>
          <div className="progress-bar"><div className="progress-bar-fill" style={{width:completionRate+'%'}}></div></div>
          <div className="progress-bar-label">{completionRate}% of tasks complete</div>
        </div>
      </div>
      <PersonalLogTable rows={rows} periodLabel={rangeLabel} onOpenActivity={onOpenActivity} />
    </div>
  );
}
Object.assign(window,{PersonalDashboard});
