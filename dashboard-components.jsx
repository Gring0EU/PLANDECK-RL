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
      {(activity.time || activity.category) && <span className="mini-card-subrow">{activity.time && <span className="mini-card-time">Due {activity.time}</span>}{activity.category && <span className="category-tag">{activity.category}</span>}</span>}
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
  const filteredActivities=activities.filter(filterFn);
  filteredActivities.forEach(a=>{(byDate[a.date]=byDate[a.date]||[]).push(a);});
  const multiDayTasksByDate={};
  filteredActivities.forEach(a=>a.tasks.forEach(t=>{
    const start=t.startDate||t.deadline;
    if(start===t.deadline) return;
    for(let d=new Date(start+'T00:00:00');U.iso(d)<=t.deadline;d.setDate(d.getDate()+1)){
      const dIso=U.iso(d);
      (multiDayTasksByDate[dIso]=multiDayTasksByDate[dIso]||[]).push({...t,activityId:a.id,activityTitle:a.title,activityStatus:a.status});
    }
  }));
  const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <div className="calendar">
      <div className="calendar-weekdays">{weekdays.map(w=><div key={w} className="weekday">{w}</div>)}</div>
      <div className="calendar-grid">
        {cells.map((d,i)=>{
          if(d===null) return <div key={i} className="day-cell day-cell-empty"></div>;
          const dateIso=U.iso(new Date(year,month,d));
          const dayActivities=byDate[dateIso]||[];
          const dayTasks=multiDayTasksByDate[dateIso]||[];
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
                {dayTasks.map(t=>(
                  <button key={t.id+dateIso} className={"task-chip"+(t.done?' task-chip-done':'')} title={t.title+' \u2014 '+(t.assignee||'Unassigned')} onClick={()=>onOpenActivity(t.activityId)}>
                    <span className="task-chip-dot" style={{background:U.statusMeta[t.activityStatus].color}}></span>
                    <span className="task-chip-title">{t.title}</span>
                  </button>
                ))}
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

function TaskRow({task,onToggle,onRemove,onEditDates}){
  const overdue=U.isTaskOverdue(task);
  const spansDays=task.startDate && task.startDate!==task.deadline;
  const [editing,setEditing]=useState(false);
  const [start,setStart]=useState(task.startDate||task.deadline);
  const [end,setEnd]=useState(task.deadline);
  return (
    <div className={"task-row"+(overdue?' task-row-overdue':'')}>
      <input type="checkbox" checked={task.done} onChange={()=>onToggle(task.id)} />
      <div className="task-info">
        <span className={"task-title"+(task.done?' task-done':'')}>{task.title}{spansDays && <span className="task-range-badge">Multi-day</span>}</span>
        {editing ? (
          <div className="task-date-range">
            <input className="input input-sm" type="date" value={start} onChange={e=>setStart(e.target.value)} />
            <span className="task-date-arrow">{'\u2192'}</span>
            <input className="input input-sm" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
            <button className="btn btn-secondary btn-sm" onClick={()=>{const s=start,e2=end<s?s:end; onEditDates(task.id,s,e2); setEditing(false);}}>Save</button>
          </div>
        ) : (
          <span className="task-meta">{task.assignee||'Unassigned'} · <span className={overdue?'task-overdue':''}>{spansDays?U.fmtDate(task.startDate)+' \u2192 '+U.fmtDate(task.deadline):U.fmtDate(task.deadline)}{task.deadlineTime?' · '+task.deadlineTime:''}{overdue?' · Overdue':''}</span>{onEditDates && <button className="task-edit-dates" onClick={()=>setEditing(true)}>edit dates</button>}</span>
        )}
      </div>
      <button className="task-remove" onClick={()=>onRemove(task.id)}>×</button>
    </div>
  );
}

function NewTaskForm({team,onAdd}){
  const [title,setTitle]=useState('');
  const [assignee,setAssignee]=useState(team[0]||'');
  const [startDate,setStartDate]=useState(U.todayIso());
  const [deadline,setDeadline]=useState(U.todayIso());
  return (
    <form className="new-task-form" onSubmit={e=>{e.preventDefault(); if(!title.trim())return; const end=deadline<startDate?startDate:deadline; onAdd({title:title.trim(),assignee,startDate,deadline:end}); setTitle('');}}>
      <input className="input input-sm" placeholder="New task" value={title} onChange={e=>setTitle(e.target.value)} />
      <select className="input input-sm" value={assignee} onChange={e=>setAssignee(e.target.value)}>
        {team.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <div className="task-date-range">
        <input className="input input-sm" type="date" title="Start date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <span className="task-date-arrow">→</span>
        <input className="input input-sm" type="date" title="Deadline" value={deadline} onChange={e=>setDeadline(e.target.value)} />
      </div>
      <button className="btn btn-secondary btn-sm" type="submit">Add task</button>
    </form>
  );
}

function CategoryPicker({category,onChange}){
  const [open,setOpen]=useState(false);
  return (
    <div className="status-pill-wrap">
      <button className="category-badge category-badge-lg" onClick={()=>setOpen(o=>!o)}>{category||'No category'}</button>
      {open && (
        <div className="status-menu" onMouseLeave={()=>setOpen(false)}>
          {U.categories.map(c=>(
            <button key={c} className="status-menu-item" onClick={()=>{onChange(c);setOpen(false);}}>{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityDrawer({activity,team,currentUser,onClose,onChangeStatus,onChangeCategory,onAddParticipant,onRemoveParticipant,onAddTeammate,onAddTask,onToggleTask,onRemoveTask,onEditTaskDates,onDelete,onClaim,onUnclaim}){
  if(!activity) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e=>e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <div className="drawer-tags">
          <StatusPill status={activity.status} onChange={s=>onChangeStatus(activity.id,s)} size="lg" />
          <CategoryPicker category={activity.category} onChange={c=>onChangeCategory(activity.id,c)} />
        </div>
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
            {activity.tasks.map(t=><TaskRow key={t.id} task={t} onToggle={id=>onToggleTask(activity.id,id)} onRemove={id=>onRemoveTask(activity.id,id)} onEditDates={(id,s,e)=>onEditTaskDates(activity.id,id,s,e)} />)}
          </div>
          <NewTaskForm team={team} onAdd={t=>onAddTask(activity.id,t)} />
        </div>
        {activity.history && activity.history.length>0 && (
          <div className="drawer-section">
            <div className="drawer-section-label">History</div>
            <div className="history-list">
              {[...activity.history].reverse().map(h=>(
                <div key={h.id} className="history-row">
                  <span className="history-text">{h.text}</span>
                  <span className="history-meta">{h.by?h.by+' \u00b7 ':''}{U.fmtTimeOfDay(h.at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const [category,setCategory]=useState('');
  const [participants,setParticipants]=useState([]);
  const [newName,setNewName]=useState('');
  const toggle=p=>setParticipants(ps=>ps.includes(p)?ps.filter(x=>x!==p):[...ps,p]);
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2 className="drawer-title">New activity</h2>
        <form onSubmit={e=>{e.preventDefault(); if(!title.trim())return; onCreate({title:title.trim(),description,date:d,status,category,participants});}}>
          <label className="field-label">Title</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />
          <label className="field-label">Description</label>
          <textarea className="input" rows="3" value={description} onChange={e=>setDescription(e.target.value)}></textarea>
          <label className="field-label">Date</label>
          <input className="input" type="date" value={d} onChange={e=>setD(e.target.value)} />
          <label className="field-label">Category</label>
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">No category</option>
            {U.categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
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

function ConfirmRemoveModal({name,onConfirm,onCancel}){
  const [text,setText]=useState('');
  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
        <button className="drawer-close" onClick={onCancel}>×</button>
        <h2 className="drawer-title">Remove {name}?</h2>
        <p className="drawer-desc">This removes {name} from the team and reassigns all their tasks to Assia.D. This can't be undone. Type <strong>remove</strong> to confirm.</p>
        <input className="input" autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Type remove" />
        <button className="btn btn-danger btn-block" disabled={text.trim().toLowerCase()!=='remove'} onClick={onConfirm} style={{marginTop:'12px'}}>Remove {name}</button>
      </div>
    </div>
  );
}

function Sidebar({team,currentUser,activities,filters,setFilters,onOpenActivity,view,setView,onAddTeammate,onRemoveTeammate,onlineUsers}){
  const myTasksRaw=[];
  activities.forEach(a=>a.tasks.forEach(t=>{if((t.assignee===currentUser || (!t.assignee && a.participants.includes(currentUser))) && !t.done) myTasksRaw.push({...t,activityId:a.id,activityTitle:a.title,recurring:a.recurring,date:a.date});}));
  const seenRecurring=new Set();
  const myTasks=[];
  myTasksRaw.sort((a,b)=>a.date<b.date?-1:1).forEach(t=>{
    if(t.recurring){
      const key=t.activityTitle;
      if(seenRecurring.has(key)) return;
      seenRecurring.add(key);
    }
    myTasks.push(t);
  });
  myTasks.sort((a,b)=>a.deadline<b.deadline?-1:1);
  const [newName,setNewName]=useState('');
  const [pendingRemove,setPendingRemove]=useState(null);
  const claimedByName={};
  activities.forEach(a=>{if(a.claimedBy) claimedByName[a.claimedBy]=a.title;});
  const onlineSet=new Set(onlineUsers||[]);
  return (
    <aside className="sidebar">
      <nav className="side-nav">
        <button className={"side-nav-item"+(view==='calendar'?' side-nav-active':'')} onClick={()=>setView('calendar')}>Calendar</button>
        <button className={"side-nav-item"+(view==='personal'?' side-nav-active':'')} onClick={()=>setView('personal')}>My Space</button>
        <button className={"side-nav-item"+(view==='weekly'?' side-nav-active':'')} onClick={()=>setView('weekly')}>Weekly Summary</button>
        <button className={"side-nav-item"+(view==='tutorials'?' side-nav-active':'')} onClick={()=>setView('tutorials')}>Tutorial Library</button>
      </nav>
      <div className="side-block">
        <div className="side-title">Team Presence</div>
        {onlineSet.size===0 && <div className="empty-hint">No one else online.</div>}
        <div className="presence-list">
          {team.filter(t=>onlineSet.has(t)).map(t=>(
            <div key={t} className="presence-row">
              <span className="presence-avatar-wrap"><span className="avatar avatar-sm">{U.initials(t)}</span><span className="presence-dot"></span></span>
              <span className="presence-info">
                <span className="presence-name">{t}{t===currentUser?' (you)':''}</span>
                <span className="presence-activity">{claimedByName[t]?'Working on '+claimedByName[t]:'Online'}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="side-block">
        <div className="side-title">My Tasks</div>
        {myTasks.length===0 && <div className="empty-hint">Nothing assigned yet.</div>}
        {myTasks.slice(0,5).map(t=>(
          <button key={t.id+t.activityId} className="side-task" onClick={()=>onOpenActivity(t.activityId)}>
            <span className="side-task-title">{t.recurring?t.activityTitle:t.title}</span>
            <span className="side-task-sub">{t.recurring?t.title:t.activityTitle} {'\u00b7'} {U.fmtDate(t.deadline)}</span>
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
        <select className="input input-sm" value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))}>
          <option value="">All categories</option>
          {U.categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="side-block">
        <div className="side-title">Team</div>
        <div className="chip-row">{team.map(t=>(
          <span key={t} className="chip chip-participant">{t}
            {t!=='Assia.D' && <button className="chip-x" title="Remove from team" onClick={()=>setPendingRemove(t)}>{'\u00d7'}</button>}
          </span>
        ))}</div>
        <div className="picker-new">
          <input className="input input-sm" placeholder="New participant name" value={newName} onChange={e=>setNewName(e.target.value)} />
          <button className="btn btn-secondary btn-sm" onClick={()=>{if(newName.trim()){onAddTeammate(newName.trim());setNewName('');}}}>Add</button>
        </div>
      </div>
      {pendingRemove && <ConfirmRemoveModal name={pendingRemove} onCancel={()=>setPendingRemove(null)} onConfirm={()=>{onRemoveTeammate(pendingRemove);setPendingRemove(null);}} />}
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
  myActivities.forEach(a=>a.tasks.forEach(t=>{if(t.assignee===currentUser || (!t.assignee && a.participants.includes(currentUser))) myTasks.push({...t,activityId:a.id,activityTitle:a.title});}));
  const upcoming=myTasks.filter(t=>!t.done && U.daysBetween(t.deadline)>=0 && U.daysBetween(t.deadline)<=7).sort((a,b)=>a.deadline<b.deadline?-1:1);
  const overdue=myTasks.filter(t=>!t.done && U.daysBetween(t.deadline)<0).sort((a,b)=>a.deadline<b.deadline?-1:1);
  const completed=myTasks.filter(t=>t.done).sort((a,b)=>a.deadline<b.deadline?1:-1);
  return (
    <div className="personal-view">
      <section className="personal-section">
        <h3>My Activities</h3>
        <div className="my-activities-list">
          {myActivities.length===0 && <div className="empty-hint">You're not on any activities yet.</div>}
          {myActivities.map(a=>{
            const meta=U.statusMeta[a.status];
            return (
              <button key={a.id} className={"my-activity-row"+(a.claimedBy?' my-activity-row-live':'')} onClick={()=>onOpenActivity(a.id)}>
                <span className="my-activity-bar" style={{background:meta.color}}></span>
                <span className="my-activity-main">
                  <span className="my-activity-title">{a.title}</span>
                  <span className="my-activity-meta">{U.fmtDate(a.date)}{a.time?' \u00b7 Due '+a.time:''}{a.claimedBy?' \u00b7 '+a.claimedBy+' working now':''}</span>
                </span>
                {a.category && <span className="category-tag">{a.category}</span>}
                <span className="status-badge" style={{background:meta.bg,color:meta.color}}>{meta.label}</span>
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

function DonutChart({segments,size,centerLabel,centerSub}){
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

function WeeklySummary({activities,team,weekDate,setWeekDate,onOpenActivity,onToggleTask}){
  const start=U.startOfWeek(weekDate), end=U.endOfWeek(weekDate);
  const startIso=U.iso(start), endIso=U.iso(end);
  const inWeek=iso=>iso>=startIso && iso<=endIso;
  const weekActivities=activities.filter(a=>inWeek(a.date));
  const uniqueWeekActivities=U.uniqueActivities(weekActivities);
  const byStatus={planned:[],progress:[],done:[]};
  weekActivities.forEach(a=>byStatus[a.status].push(a));
  const uniqueByStatus={planned:0,progress:0,done:0};
  uniqueWeekActivities.forEach(a=>{uniqueByStatus[a.status]++;});
  const byCategoryUnique={};
  uniqueWeekActivities.forEach(a=>{const c=a.category||'Uncategorized'; byCategoryUnique[c]=(byCategoryUnique[c]||0)+1;});
  const weekTasks=[];
  activities.forEach(a=>a.tasks.forEach(t=>{if(inWeek(t.deadline)) weekTasks.push({...t,activityId:a.id,activityTitle:a.title});}));
  const tasksDone=weekTasks.filter(t=>t.done);
  const tasksOpen=weekTasks.filter(t=>!t.done);
  const tasksOverdue=weekTasks.filter(t=>U.isTaskOverdue(t));
  const byParticipant={};
  uniqueWeekActivities.forEach(a=>a.participants.forEach(p=>{byParticipant[p]=(byParticipant[p]||0)+1;}));
  const maxParticipant=Math.max(1,...Object.values(byParticipant));
  const cols=[['done','Completed'],['progress','In Progress'],['planned','Planned']];
  const categorySegments=Object.entries(byCategoryUnique).sort((a,b)=>b[1]-a[1]).map(([cat,n])=>({label:cat,value:n,color:U.categoryColors[cat]||'var(--text-soft)'}));
  const statusSegments=[
    {label:'Planned',value:uniqueByStatus.planned,color:U.statusMeta.planned.color},
    {label:'In Progress',value:uniqueByStatus.progress,color:U.statusMeta.progress.color},
    {label:'Done',value:uniqueByStatus.done,color:U.statusMeta.done.color}
  ];
  return (
    <div className="personal-view">
      <div className="weekly-header">
        <button className="nav-btn" onClick={()=>setWeekDate(d=>{const x=new Date(d);x.setDate(x.getDate()-7);return x;})}>‹</button>
        <div className="weekly-range">{U.fmtRange(start,end)}</div>
        <button className="nav-btn" onClick={()=>setWeekDate(d=>{const x=new Date(d);x.setDate(x.getDate()+7);return x;})}>›</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setWeekDate(new Date())}>This week</button>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-title">Activity by Category</div>
          <div className="analytics-card-body">
            <DonutChart segments={categorySegments} centerLabel={uniqueWeekActivities.length} centerSub="activities" />
            <div className="legend">
              {categorySegments.length===0 && <div className="empty-hint">No activities this week.</div>}
              {categorySegments.map(s=>(
                <div key={s.label} className="legend-row"><span className="legend-dot" style={{background:s.color}}></span><span className="legend-label">{s.label}</span><span className="legend-val">{s.value} · {Math.round(s.value/uniqueWeekActivities.length*100)||0}%</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title">Activity Status Overview</div>
          <div className="analytics-card-body">
            <DonutChart segments={statusSegments} centerLabel={uniqueWeekActivities.length} centerSub="activities" />
            <div className="legend">
              {statusSegments.map(s=>(
                <div key={s.label} className="legend-row"><span className="legend-dot" style={{background:s.color}}></span><span className="legend-label">{s.label}</span><span className="legend-val">{s.value} · {Math.round(s.value/(uniqueWeekActivities.length||1)*100)}%</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title">Task Completion</div>
          <div className="task-stat-grid">
            <div className="task-stat"><span className="task-stat-num">{weekTasks.length}</span><span className="task-stat-label">Total</span></div>
            <div className="task-stat"><span className="task-stat-num" style={{color:'var(--done)'}}>{tasksDone.length}</span><span className="task-stat-label">Completed</span></div>
            <div className="task-stat"><span className="task-stat-num" style={{color:'var(--planned)'}}>{tasksOpen.length}</span><span className="task-stat-label">Remaining</span></div>
            <div className="task-stat"><span className="task-stat-num" style={{color:'var(--danger)'}}>{tasksOverdue.length}</span><span className="task-stat-label">Overdue</span></div>
          </div>
          <div className="progress-bar"><div className="progress-bar-fill" style={{width:(weekTasks.length?Math.round(tasksDone.length/weekTasks.length*100):0)+'%'}}></div></div>
          <div className="progress-bar-label">{weekTasks.length?Math.round(tasksDone.length/weekTasks.length*100):0}% complete</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title">Team Activity</div>
          <div className="team-activity-list">
            {Object.keys(byParticipant).length===0 && <div className="empty-hint">No participants this week.</div>}
            {Object.entries(byParticipant).sort((a,b)=>b[1]-a[1]).map(([p,n],i,arr)=>(
              <div key={p} className="team-activity-row">
                <span className="avatar avatar-sm">{U.initials(p)}</span>
                <span className="team-activity-name">{p}{arr.length>1 && i===0 && n>arr[arr.length-1][1] && <span className="team-activity-badge" title="Top contributor">{'\ud83d\udc51'}</span>}{arr.length>1 && i===arr.length-1 && n<arr[0][1] && <span className="team-activity-badge" title="Lowest activity">{'\ud83d\ude1e'}</span>}</span>
                <div className="team-activity-bar-track"><div className="team-activity-bar-fill" style={{width:(n/maxParticipant*100)+'%'}}></div></div>
                <span className="team-activity-count">{n}</span>
              </div>
            ))}
          </div>
        </div>
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
    </div>
  );
}

Object.assign(window,{LoginScreen,Toasts,StatusPill,CalendarGrid,ActivityDrawer,NewActivityModal,Sidebar,PersonalView,WeeklySummary,LiveActivityBar});
