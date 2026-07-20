const {useState,useRef}=React;
const U=window.DashUtils;

function LoginScreen({onLogin,team}){
  const [name,setName]=useState('');
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-mark">Plandeck</div>
        <h1>Welcome back</h1>
        <p className="login-sub">Enter your name to jump into the shared workspace. No password needed.</p>
        <form onSubmit={e=>{e.preventDefault(); if(name.trim()) onLogin(name.trim());}}>
          <input autoFocus className="input" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <button className="btn btn-primary btn-block" type="submit" disabled={!name.trim()}>Continue</button>
        </form>
        <div className="login-suggest">
          <span>Team members already here:</span>
          <div className="chip-row">
            {team.map(t=><button key={t} className="chip chip-clickable" onClick={()=>setName(t)}>{t}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toasts({toasts,onDismiss}){
  return (
    <div className="toast-stack">
      {toasts.map(t=>(
        <div key={t.id} className="toast">
          <span>{t.msg}</span>
          <button className="toast-close" onClick={()=>onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function StatusPill({status,onChange,size}){
  const [open,setOpen]=useState(false);
  const meta=U.statusMeta[status];
  return (
    <div className="status-pill-wrap">
      <button className={"status-pill "+(size||'')} style={{color:meta.color,background:meta.bg}} onClick={()=>setOpen(o=>!o)}>
        <span className="status-dot" style={{background:meta.color}}></span>{meta.label}
      </button>
      {open && (
        <div className="status-menu" onMouseLeave={()=>setOpen(false)}>
          {Object.keys(U.statusMeta).map(s=>(
            <button key={s} className="status-menu-item" style={{color:U.statusMeta[s].color}} onClick={()=>{onChange(s);setOpen(false);}}>
              <span className="status-dot" style={{background:U.statusMeta[s].color}}></span>{U.statusMeta[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityMiniCard({activity,onOpen,onDragStart}){
  const meta=U.statusMeta[activity.status];
  return (
    <div className={"mini-card"+(activity.claimedBy?' mini-card-live':'')} draggable onDragStart={e=>onDragStart(e,activity.id)} style={{background:meta.bg,borderLeft:'3px solid '+meta.color}} onClick={()=>onOpen(activity.id)}>
      <span className="mini-card-title">{activity.title}</span>
      {activity.time && <span className="mini-card-time">Due {activity.time}</span>}
      {activity.claimedBy && <span className="mini-card-live-tag"><span className="avatar avatar-xs">{U.initials(activity.claimedBy)}</span>Live · {activity.claimedBy}</span>}
    </div>
  );
}

function CalendarGrid({monthDate,activities,onOpenActivity,onMoveActivity,onNewActivity,filterFn}){
  const [expanded,setExpanded]=useState({});
  const year=monthDate.getFullYear(), month=monthDate.getMonth();
  const firstOfMonth=new Date(year,month,1);
  const startWeekday=firstOfMonth.getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<startWeekday;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const todayIso=U.todayIso();
  const byDate={};
  activities.filter(filterFn).forEach(a=>{(byDate[a.date]=byDate[a.date]||[]).push(a);});
  const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <div className="calendar">
      <div className="calendar-weekdays">{weekdays.map(w=><div key={w} className="weekday">{w}</div>)}</div>
      <div className="calendar-grid">
        {cells.map((d,i)=>{
          if(d===null) return <div key={i} className="day-cell day-cell-empty"></div>;
          const dateIso=U.iso(new Date(year,month,d));
          const dayActivities=byDate[dateIso]||[];
          const isToday=dateIso===todayIso;
          const isExpanded=expanded[dateIso];
          const visible=isExpanded?dayActivities:dayActivities.slice(0,3);
          const overflow=dayActivities.length-visible.length;
          return (
            <div key={i} className={"day-cell"+(isToday?' day-cell-today':'')}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{const id=e.dataTransfer.getData('text/plain'); onMoveActivity(id,dateIso);}}>
              <div className="day-cell-head">
                <span className={"day-num"+(isToday?' day-num-today':'')}>{d}</span>
                <button className="day-add" title="New activity" onClick={()=>onNewActivity(dateIso)}>+</button>
              </div>
              <div className="day-cards">
                {visible.map(a=><ActivityMiniCard key={a.id} activity={a} onOpen={onOpenActivity} onDragStart={(e,id)=>e.dataTransfer.setData('text/plain',id)} />)}
                {overflow>0 && <button className="day-more" onClick={()=>setExpanded(x=>({...x,[dateIso]:true}))}>+{overflow} more</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LiveActivityBar({activities,onOpenActivity}){
  const live=activities.filter(a=>a.claimedBy);
  if(live.length===0) return null;
  return (
    <section className="live-bar">
      <div className="live-bar-title">● Currently Active <span className="count-badge">{live.length}</span></div>
      <div className="live-bar-row">
        {live.map(a=>{
          const meta=U.statusMeta[a.status];
          return (
            <button key={a.id} className="live-card" onClick={()=>onOpenActivity(a.id)}>
              <span className="avatar">{U.initials(a.claimedBy)}</span>
              <span className="live-card-info">
                <span className="live-card-title">{a.title}</span>
                <span className="live-card-sub">{a.claimedBy} · since {U.fmtTimeOfDay(a.claimedAt)}</span>
              </span>
              <span className="status-dot-inline" style={{background:meta.color}}>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ParticipantChips({participants,team,onAdd,onRemove,onAddTeammate}){
  const [picking,setPicking]=useState(false);
  const [newName,setNewName]=useState('');
  const available=team.filter(t=>!participants.includes(t));
  return (
    <div className="participants">
      <div className="chip-row">
        {participants.map(p=>(
          <span key={p} className="chip chip-participant">
            {p}
            <button className="chip-x" onClick={()=>onRemove(p)}>×</button>
          </span>
        ))}
        <button className="chip chip-add" onClick={()=>setPicking(o=>!o)}>+ Add</button>
      </div>
      {picking && (
        <div className="picker-pop" onMouseLeave={()=>setPicking(false)}>
          {available.map(t=><button key={t} className="picker-item" onClick={()=>{onAdd(t);setPicking(false);}}>{t}</button>)}
          {available.length===0 && <div className="empty-hint">Everyone on the team is already added.</div>}
          <div className="picker-new">
            <input className="input input-sm" placeholder="New teammate name" value={newName} onChange={e=>setNewName(e.target.value)} />
            <button className="btn btn-secondary btn-sm" onClick={()=>{if(newName.trim()){onAddTeammate(newName.trim());setNewName('');setPicking(false);}}}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({task,onToggle,onRemove}){
  const overdue=U.isTaskOverdue(task);
  return (
    <div className={"task-row"+(overdue?' task-row-overdue':'')}>
      <input type="checkbox" checked={task.done} onChange={()=>onToggle(task.id)} />
      <div className="task-info">
        <span className={"task-title"+(task.done?' task-done':'')}>{task.title}</span>
        <span className="task-meta">{task.assignee||'Unassigned'} · <span className={overdue?'task-overdue':''}>{U.fmtDate(task.deadline)}{task.deadlineTime?' · '+task.deadlineTime:''}{overdue?' · Overdue':''}</span></span>
      </div>
      <button className="task-remove" onClick={()=>onRemove(task.id)}>×</button>
    </div>
  );
}

function NewTaskForm({team,onAdd}){
  const [title,setTitle]=useState('');
  const [assignee,setAssignee]=useState(team[0]||'');
  const [deadline,setDeadline]=useState(U.todayIso());
  return (
    <form className="new-task-form" onSubmit={e=>{e.preventDefault(); if(!title.trim())return; onAdd({title:title.trim(),assignee,deadline}); setTitle('');}}>
      <input className="input input-sm" placeholder="New task" value={title} onChange={e=>setTitle(e.target.value)} />
      <select className="input input-sm" value={assignee} onChange={e=>setAssignee(e.target.value)}>
        {team.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <input className="input input-sm" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} />
      <button className="btn btn-secondary btn-sm" type="submit">Add task</button>
    </form>
  );
}

function ActivityDrawer({activity,team,currentUser,onClose,onChangeStatus,onAddParticipant,onRemoveParticipant,onAddTeammate,onAddTask,onToggleTask,onRemoveTask,onDelete,onClaim,onUnclaim}){
  if(!activity) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e=>e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <StatusPill status={activity.status} onChange={s=>onChangeStatus(activity.id,s)} size="lg" />
        {activity.recurring && <span className="chip recurring-chip">↻ Recurring · {activity.recurringLabel}</span>}
        <h2 className="drawer-title">{activity.title}</h2>
        <div className="drawer-date">{U.fmtDateLong(activity.date)}{activity.time?' · Due '+activity.time:''}</div>
        {activity.claimedBy ? (
          <div className="live-badge">
            <span className="avatar avatar-sm">{U.initials(activity.claimedBy)}</span>
            <span>Currently Working <strong>{activity.claimedBy}</strong> · since {U.fmtTimeOfDay(activity.claimedAt)}</span>
            {activity.claimedBy===currentUser && <button className="btn btn-ghost btn-sm" onClick={()=>onUnclaim(activity.id)}>Release</button>}
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={()=>onClaim(activity.id)}>Claim Activity</button>
        )}
        <p className="drawer-desc">{activity.description}</p>
        <div className="drawer-section">
          <div className="drawer-section-label">Participants</div>
          <ParticipantChips participants={activity.participants} team={team}
            onAdd={p=>onAddParticipant(activity.id,p)} onRemove={p=>onRemoveParticipant(activity.id,p)}
            onAddTeammate={n=>onAddTeammate(n,activity.id)} />
        </div>
        <div className="drawer-section">
          <div className="drawer-section-label">Tasks</div>
          <div className="task-list">
            {activity.tasks.length===0 && <div className="empty-hint">No tasks yet.</div>}
            {activity.tasks.map(t=><TaskRow key={t.id} task={t} onToggle={id=>onToggleTask(activity.id,id)} onRemove={id=>onRemoveTask(activity.id,id)} />)}
          </div>
          <NewTaskForm team={team} onAdd={t=>onAddTask(activity.id,t)} />
        </div>
        <button className="btn btn-danger btn-block" onClick={()=>{if(confirm('Delete "'+activity.title+'"? This cannot be undone.')) onDelete(activity.id);}}>Delete activity</button>
      </div>
    </div>
  );
}

function NewActivityModal({date,team,onClose,onCreate,onAddTeammate}){
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [d,setD]=useState(date);
  const [status,setStatus]=useState('planned');
  const [participants,setParticipants]=useState([]);
  const [newName,setNewName]=useState('');
  const toggle=p=>setParticipants(ps=>ps.includes(p)?ps.filter(x=>x!==p):[...ps,p]);
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2 className="drawer-title">New activity</h2>
        <form onSubmit={e=>{e.preventDefault(); if(!title.trim())return; onCreate({title:title.trim(),description,date:d,status,participants});}}>
          <label className="field-label">Title</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />
          <label className="field-label">Description</label>
          <textarea className="input" rows="3" value={description} onChange={e=>setDescription(e.target.value)}></textarea>
          <label className="field-label">Date</label>
          <input className="input" type="date" value={d} onChange={e=>setD(e.target.value)} />
          <label className="field-label">Status</label>
          <div className="chip-row">
            {Object.keys(U.statusMeta).map(s=>(
              <button type="button" key={s} className={"chip chip-clickable"+(status===s?' chip-active':'')} style={status===s?{background:U.statusMeta[s].bg,color:U.statusMeta[s].color}:{}} onClick={()=>setStatus(s)}>{U.statusMeta[s].label}</button>
            ))}
          </div>
          <label className="field-label">Participants</label>
          <div className="chip-row">
            {team.map(t=>(
              <button type="button" key={t} className={"chip chip-clickable"+(participants.includes(t)?' chip-active':'')} style={participants.includes(t)?{background:'var(--planned-bg)',color:'var(--planned)'}:{}} onClick={()=>toggle(t)}>{t}</button>
            ))}
          </div>
          <div className="picker-new" style={{marginTop:'8px'}}>
            <input className="input input-sm" placeholder="New teammate name" value={newName} onChange={e=>setNewName(e.target.value)} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={()=>{if(newName.trim()){onAddTeammate(newName.trim());toggle(newName.trim());setNewName('');}}}>Add</button>
          </div>
          <button className="btn btn-primary btn-block" type="submit" style={{marginTop:'16px'}}>Create activity</button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({team,currentUser,activities,filters,setFilters,onOpenActivity,view,setView,onAddTeammate}){
  const myTasks=[];
  activities.forEach(a=>a.tasks.forEach(t=>{if(t.assignee===currentUser && !t.done) myTasks.push({...t,activityId:a.id,activityTitle:a.title});}));
  myTasks.sort((a,b)=>a.deadline<b.deadline?-1:1);
  const [newName,setNewName]=useState('');
  return (
    <aside className="sidebar">
      <nav className="side-nav">
        <button className={"side-nav-item"+(view==='calendar'?' side-nav-active':'')} onClick={()=>setView('calendar')}>Calendar</button>
        <button className={"side-nav-item"+(view==='personal'?' side-nav-active':'')} onClick={()=>setView('personal')}>My Space</button>
        <button className={"side-nav-item"+(view==='weekly'?' side-nav-active':'')} onClick={()=>setView('weekly')}>Weekly Summary</button>
      </nav>
      <div className="side-block">
        <div className="side-title">My Tasks</div>
        {myTasks.length===0 && <div className="empty-hint">Nothing assigned yet.</div>}
        {myTasks.slice(0,5).map(t=>(
          <button key={t.id} className="side-task" onClick={()=>onOpenActivity(t.activityId)}>
            <span className="side-task-title">{t.title}</span>
            <span className="side-task-sub">{t.activityTitle} · {U.fmtDate(t.deadline)}</span>
          </button>
        ))}
      </div>
      <div className="side-block">
        <div className="side-title">Filters</div>
        <input className="input input-sm" placeholder="Search activities…" value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} />
        <div className="filter-group">
          {Object.keys(U.statusMeta).map(s=>(
            <button key={s} className={"chip chip-clickable"+(filters.statuses.includes(s)?' chip-active':'')}
              style={filters.statuses.includes(s)?{background:U.statusMeta[s].bg,color:U.statusMeta[s].color}:{}}
              onClick={()=>setFilters(f=>({...f,statuses:f.statuses.includes(s)?f.statuses.filter(x=>x!==s):[...f.statuses,s]}))}>{U.statusMeta[s].label}</button>
          ))}
        </div>
        <select className="input input-sm" value={filters.participant} onChange={e=>setFilters(f=>({...f,participant:e.target.value}))}>
          <option value="">All participants</option>
          {team.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="side-block">
        <div className="side-title">Team</div>
        <div className="chip-row">{team.map(t=><span key={t} className="chip">{t}</span>)}</div>
        <div className="picker-new">
          <input className="input input-sm" placeholder="New participant name" value={newName} onChange={e=>setNewName(e.target.value)} />
          <button className="btn btn-secondary btn-sm" onClick={()=>{if(newName.trim()){onAddTeammate(newName.trim());setNewName('');}}}>Add</button>
        </div>
      </div>
    </aside>
  );
}

function PersonalView({currentUser,activities,onOpenActivity,onToggleTask}){
  const todayIso=U.todayIso();
  const nonRecurringMine=activities.filter(a=>!a.recurring && a.participants.includes(currentUser));
  const recurringMine=activities.filter(a=>a.recurring && a.participants.includes(currentUser));
  const byTitle={};
  recurringMine.forEach(a=>{(byTitle[a.title]=byTitle[a.title]||[]).push(a);});
  const activeRecurring=[];
  Object.values(byTitle).forEach(list=>{
    const upcoming=list.filter(a=>a.date>=todayIso).sort((a,b)=>a.date<b.date?-1:1);
    const active=upcoming.find(a=>a.status!=='done')||upcoming[0];
    if(active) activeRecurring.push(active);
  });
  const myActivities=[...nonRecurringMine,...activeRecurring].sort((a,b)=>a.date<b.date?-1:1);
  const myTasks=[];
  myActivities.forEach(a=>a.tasks.forEach(t=>{if(t.assignee===currentUser) myTasks.push({...t,activityId:a.id,activityTitle:a.title});}));
  const upcoming=myTasks.filter(t=>!t.done && U.daysBetween(t.deadline)>=0 && U.daysBetween(t.deadline)<=7).sort((a,b)=>a.deadline<b.deadline?-1:1);
  const overdue=myTasks.filter(t=>!t.done && U.daysBetween(t.deadline)<0).sort((a,b)=>a.deadline<b.deadline?-1:1);
  const completed=myTasks.filter(t=>t.done).sort((a,b)=>a.deadline<b.deadline?1:-1);
  return (
    <div className="personal-view">
      <section className="personal-section">
        <h3>My Activities</h3>
        <div className="personal-grid">
          {myActivities.length===0 && <div className="empty-hint">You're not on any activities yet.</div>}
          {myActivities.map(a=>{
            const meta=U.statusMeta[a.status];
            return (
              <button key={a.id} className={"activity-tile"+(a.claimedBy?' activity-tile-live':'')} style={{borderTop:'3px solid '+meta.color}} onClick={()=>onOpenActivity(a.id)}>
                <span className="activity-tile-title">{a.title}</span>
                <span className="activity-tile-date">{U.fmtDate(a.date)}</span>
                <span className="status-dot-inline" style={{background:meta.color}}>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <div className="personal-columns">
        <section className="personal-section">
          <h3>Overdue <span className="count-badge count-danger">{overdue.length}</span></h3>
          {overdue.length===0 && <div className="empty-hint">Nothing overdue. Nice.</div>}
          {overdue.map(t=><TaskRow key={t.id+t.activityId} task={t} onToggle={()=>onToggleTask(t.activityId,t.id)} onRemove={()=>{}} />)}
        </section>
        <section className="personal-section">
          <h3>Upcoming <span className="count-badge">{upcoming.length}</span></h3>
          {upcoming.length===0 && <div className="empty-hint">Nothing due in the next week.</div>}
          {upcoming.map(t=><TaskRow key={t.id+t.activityId} task={t} onToggle={()=>onToggleTask(t.activityId,t.id)} onRemove={()=>{}} />)}
        </section>
        <section className="personal-section">
          <h3>Completed <span className="count-badge count-done">{completed.length}</span></h3>
          {completed.length===0 && <div className="empty-hint">Nothing completed yet.</div>}
          {completed.map(t=><TaskRow key={t.id+t.activityId} task={t} onToggle={()=>onToggleTask(t.activityId,t.id)} onRemove={()=>{}} />)}
        </section>
      </div>
    </div>
  );
}

function WeeklySummary({activities,team,weekDate,setWeekDate,onOpenActivity,onToggleTask}){
  const start=U.startOfWeek(weekDate), end=U.endOfWeek(weekDate);
  const startIso=U.iso(start), endIso=U.iso(end);
  const inWeek=iso=>iso>=startIso && iso<=endIso;
  const weekActivities=activities.filter(a=>inWeek(a.date));
  const byStatus={planned:[],progress:[],done:[]};
  weekActivities.forEach(a=>byStatus[a.status].push(a));
  const weekTasks=[];
  activities.forEach(a=>a.tasks.forEach(t=>{if(inWeek(t.deadline)) weekTasks.push({...t,activityId:a.id,activityTitle:a.title});}));
  const tasksDone=weekTasks.filter(t=>t.done);
  const tasksOpen=weekTasks.filter(t=>!t.done);
  const byParticipant={};
  weekActivities.forEach(a=>a.participants.forEach(p=>{byParticipant[p]=(byParticipant[p]||0)+1;}));
  const cols=[['done','Completed'],['progress','In Progress'],['planned','Planned']];
  return (
    <div className="personal-view">
      <div className="weekly-header">
        <button className="nav-btn" onClick={()=>setWeekDate(d=>{const x=new Date(d);x.setDate(x.getDate()-7);return x;})}>‹</button>
        <div className="weekly-range">{U.fmtRange(start,end)}</div>
        <button className="nav-btn" onClick={()=>setWeekDate(d=>{const x=new Date(d);x.setDate(x.getDate()+7);return x;})}>›</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setWeekDate(new Date())}>This week</button>
      </div>
      <div className="weekly-stats">
        <div className="weekly-stat" style={{borderColor:'var(--done)'}}><span className="weekly-stat-num" style={{color:'var(--done)'}}>{byStatus.done.length}</span><span className="weekly-stat-label">Activities Done</span></div>
        <div className="weekly-stat" style={{borderColor:'var(--progress)'}}><span className="weekly-stat-num" style={{color:'var(--progress)'}}>{byStatus.progress.length}</span><span className="weekly-stat-label">In Progress</span></div>
        <div className="weekly-stat" style={{borderColor:'var(--planned)'}}><span className="weekly-stat-num" style={{color:'var(--planned)'}}>{byStatus.planned.length}</span><span className="weekly-stat-label">Planned</span></div>
        <div className="weekly-stat" style={{borderColor:'var(--brand)'}}><span className="weekly-stat-num" style={{color:'var(--brand)'}}>{tasksDone.length}/{weekTasks.length}</span><span className="weekly-stat-label">Tasks Done</span></div>
        <div className="weekly-stat" style={{borderColor:'var(--danger)'}}><span className="weekly-stat-num" style={{color:'var(--danger)'}}>{weekTasks.filter(t=>U.isTaskOverdue(t)).length}</span><span className="weekly-stat-label">Overdue</span></div>
      </div>
      <section className="personal-section">
        <h3>Activities this week</h3>
        {weekActivities.length===0 && <div className="empty-hint">No activities scheduled this week.</div>}
        <div className="weekly-columns">
          {cols.map(([key,label])=>(
            <div key={key} className="weekly-col">
              <div className="weekly-col-head"><span className="status-dot" style={{background:U.statusMeta[key].color}}></span>{label} <span className="count-badge">{byStatus[key].length}</span></div>
              {byStatus[key].map(a=>(
                <button key={a.id} className={"activity-tile"+(a.claimedBy?' activity-tile-live':'')} style={{borderTop:'3px solid '+U.statusMeta[key].color}} onClick={()=>onOpenActivity(a.id)}>
                  <span className="activity-tile-title">{a.title}</span>
                  <span className="activity-tile-date">{U.fmtDate(a.date)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
      <div className="personal-columns">
        <section className="personal-section">
          <h3>Overdue <span className="count-badge count-danger">{weekTasks.filter(t=>U.isTaskOverdue(t)).length}</span></h3>
          {weekTasks.filter(t=>U.isTaskOverdue(t)).length===0 && <div className="empty-hint">Nothing overdue this week.</div>}
          {weekTasks.filter(t=>U.isTaskOverdue(t)).map(t=><TaskRow key={t.id+t.activityId} task={t} onToggle={()=>onToggleTask(t.activityId,t.id)} onRemove={()=>{}} />)}
        </section>
        <section className="personal-section">
          <h3>Tasks Completed <span className="count-badge count-done">{tasksDone.length}</span></h3>
          {tasksDone.length===0 && <div className="empty-hint">Nothing completed this week.</div>}
          {tasksDone.map(t=><TaskRow key={t.id+t.activityId} task={t} onToggle={()=>onToggleTask(t.activityId,t.id)} onRemove={()=>{}} />)}
        </section>
        <section className="personal-section">
          <h3>Tasks Still Open <span className="count-badge">{tasksOpen.length}</span></h3>
          {tasksOpen.length===0 && <div className="empty-hint">Everything wrapped up.</div>}
          {tasksOpen.map(t=><TaskRow key={t.id+t.activityId} task={t} onToggle={()=>onToggleTask(t.activityId,t.id)} onRemove={()=>{}} />)}
        </section>
      </div>
      <div className="personal-columns">
        <section className="personal-section">
          <h3>By Participant</h3>
          {Object.keys(byParticipant).length===0 && <div className="empty-hint">No participants this week.</div>}
          <div className="chip-row">
            {Object.entries(byParticipant).map(([p,n])=><span key={p} className="chip">{p} <span className="count-badge">{n}</span></span>)}
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window,{LoginScreen,Toasts,StatusPill,CalendarGrid,ActivityDrawer,NewActivityModal,Sidebar,PersonalView,WeeklySummary,LiveActivityBar});
