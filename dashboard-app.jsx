const {useState,useEffect,useRef}=React;
const U=window.DashUtils;
const STORAGE_KEY='plandeck-state-v1';

function loadStored(){
  try{const raw=localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):null;}catch(e){return null;}
}
function saveStored(data){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){}
}

function App(){
  const [seed]=useState(()=>{const stored=loadStored(); return stored||window.DashData.buildSeedData();});
  const [team,setTeam]=useState(()=>window.DashData.normalizeTeam(seed.team));
  const [activities,setActivities]=useState(()=>window.DashData.syncRecurringActivities(window.DashData.normalizeActivities(seed.activities),seed.team));
  const [currentUser,setCurrentUser]=useState(seed.currentUser||null);
  const [synced,setSynced]=useState(false);
  const skipNextSave=useRef(false);
  const [view,setView]=useState('calendar');
  const [monthDate,setMonthDate]=useState(new Date());
  const [weekDate,setWeekDate]=useState(new Date());
  const [selectedId,setSelectedId]=useState(null);
  const [newActivityDate,setNewActivityDate]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [filters,setFilters]=useState({search:'',statuses:[],participant:'',category:''});
  const [userMenuOpen,setUserMenuOpen]=useState(false);
  const [onlineUsers,setOnlineUsers]=useState([]);

  useEffect(()=>{saveStored({team,activities,currentUser});},[team,activities,currentUser]);

  useEffect(()=>{
    const unsub=window.DashDB.subscribe(remote=>{
      if(!remote){setSynced(true); return;}
      skipNextSave.current=true;
      const remoteTeam=window.DashData.normalizeTeam(remote.team);
      setTeam(remoteTeam);
      setActivities(window.DashData.syncRecurringActivities(window.DashData.normalizeActivities(remote.activities),remoteTeam));
      setSynced(true);
    });
    return unsub;
  },[]);

  useEffect(()=>{
    if(!synced && !skipNextSave.current) return;
    if(skipNextSave.current){skipNextSave.current=false; return;}
    window.DashDB.save({team,activities});
  },[team,activities]);

  useEffect(()=>{
    if(!currentUser) return;
    const stopPresence=window.DashDB.goOnline(currentUser);
    const unsub=window.DashDB.subscribePresence(setOnlineUsers);
    return ()=>{stopPresence();unsub();};
  },[currentUser]);

  function toast(msg){
    const id=U.uid();
    setToasts(ts=>[...ts,{id,msg}]);
    setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)),3500);
  }

  function ensureTeammate(name){
    setTeam(t=>t.includes(name)?t:[...t,name]);
    setActivities(as=>as.map(a=>a.recurring && !a.participants.includes(name)?{...a,participants:[...a.participants,name]}:a));
  }

  function handleLogin(name){
    ensureTeammate(name);
    setCurrentUser(name);
    toast('Welcome, '+name+'!');
  }

  function changeStatus(id,status){
    setActivities(as=>as.map(a=>a.id===id?{...a,status}:a));
    toast('Status changed to '+U.statusMeta[status].label);
  }
  function changeCategory(id,category){
    setActivities(as=>as.map(a=>a.id===id?{...a,category}:a));
    toast('Category set to '+(category||'None'));
  }

  function moveActivity(id,date){
    setActivities(as=>as.map(a=>{
      if(a.id!==id) return a;
      const oldStart=new Date(a.date+'T00:00:00');
      const oldEnd=new Date((a.endDate||a.date)+'T00:00:00');
      const span=Math.round((oldEnd-oldStart)/86400000);
      const newStart=new Date(date+'T00:00:00');
      const newEnd=new Date(newStart); newEnd.setDate(newEnd.getDate()+span);
      return {...a,date,endDate:U.iso(newEnd)};
    }));
    const a=activities.find(x=>x.id===id);
    if(a) toast('Moved "'+a.title+'" to '+U.fmtDate(date));
  }
  function editActivity(id,data){
    setActivities(as=>as.map(a=>a.id===id?{...a,...data,endDate:data.endDate||data.date||a.endDate}:a));
    toast('"'+data.title+'" updated');
  }

  function addParticipant(activityId,name){
    setActivities(as=>as.map(a=>a.id===activityId?{...a,participants:[...a.participants,name]}:a));
    toast(name+' added to activity');
  }
  function removeTeammate(name){
    if(name==='Assia.D'){ toast('Assia.D cannot be removed'); return; }
    setActivities(as=>as.map(a=>{
      if(!a.participants.includes(name) && !a.tasks.some(t=>t.assignee===name)) return a;
      const reassignTo='Assia.D';
      let reassignedCount=0;
      const tasks=a.tasks.map(t=>{
        if(t.assignee===name){ reassignedCount++; return {...t,assignee:reassignTo}; }
        return t;
      });
      const historyEntry={id:U.uid(),at:new Date().toISOString(),by:currentUser,text:name+' removed from the team'+(reassignedCount?' \u2014 '+reassignedCount+' task'+(reassignedCount>1?'s':'')+' reassigned to '+reassignTo:'')};
      return {...a,participants:a.participants.filter(p=>p!==name),tasks,history:[...(a.history||[]),historyEntry]};
    }));
    setTeam(t=>t.filter(x=>x!==name));
    toast(name+' removed from the team \u2014 tasks reassigned to Assia.D');
  }
  function removeParticipant(activityId,name){
    setActivities(as=>as.map(a=>{
      if(a.id!==activityId) return a;
      const reassignTo='Assia.D';
      let reassignedCount=0;
      const tasks=a.tasks.map(t=>{
        if(t.assignee===name && name!==reassignTo){ reassignedCount++; return {...t,assignee:reassignTo}; }
        return t;
      });
      const historyEntry={id:U.uid(),at:new Date().toISOString(),by:currentUser,text:name+' removed from participants'+(reassignedCount?' \u2014 '+reassignedCount+' task'+(reassignedCount>1?'s':'')+' reassigned to '+reassignTo:'')};
      return {...a,participants:a.participants.filter(p=>p!==name),tasks,history:[...(a.history||[]),historyEntry]};
    }));
    toast(name+' removed'+(name!=='Assia.D'?' \u2014 tasks reassigned to Assia.D':''));
  }
  function addTeammateAndParticipant(name,activityId){
    ensureTeammate(name);
    addParticipant(activityId,name);
  }
  function addTask(activityId,task){
    setActivities(as=>as.map(a=>a.id===activityId?{...a,tasks:[...a.tasks,{...task,id:U.uid(),done:false}]}:a));
    toast('Task added');
  }
  function editTaskDeadline(activityId,taskId,deadline){
    setActivities(as=>as.map(a=>a.id!==activityId?a:{...a,tasks:a.tasks.map(t=>t.id===taskId?{...t,deadline}:t)}));
  }
  function toggleTask(activityId,taskId){
    setActivities(as=>as.map(a=>a.id!==activityId?a:{...a,tasks:a.tasks.map(t=>t.id===taskId?{...t,done:!t.done}:t)}));
  }
  function removeTask(activityId,taskId){
    setActivities(as=>as.map(a=>a.id!==activityId?a:{...a,tasks:a.tasks.filter(t=>t.id!==taskId)}));
  }
  function createActivity(data){
    const a={...data,id:U.uid(),tasks:[]};
    setActivities(as=>[...as,a]);
    setNewActivityDate(null);
    toast('"'+a.title+'" created');
  }
  function deleteActivity(id){
    const a=activities.find(x=>x.id===id);
    setActivities(as=>as.filter(x=>x.id!==id));
    setSelectedId(null);
    if(a) toast('"'+a.title+'" deleted');
  }
  function claimActivity(id){
    setActivities(as=>as.map(a=>a.id===id?{...a,claimedBy:currentUser,claimedAt:new Date().toISOString(),participants:a.participants.includes(currentUser)?a.participants:[...a.participants,currentUser]}:a));
    toast('You claimed this activity');
  }
  function unclaimActivity(id){
    setActivities(as=>as.map(a=>a.id===id?{...a,claimedBy:null,claimedAt:null}:a));
    toast('Activity released');
  }

  function filterFn(a){
    if(filters.search && !a.title.toLowerCase().includes(filters.search.toLowerCase()) && !a.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if(filters.statuses.length && !filters.statuses.includes(a.status)) return false;
    if(filters.participant && !a.participants.includes(filters.participant)) return false;
    if(filters.category && a.category!==filters.category) return false;
    return true;
  }

  if(!currentUser){
    return <LoginScreen onLogin={handleLogin} team={team} />;
  }

  const selected=activities.find(a=>a.id===selectedId)||null;
  const monthLabel=monthDate.toLocaleDateString(undefined,{month:'long',year:'numeric'});

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <span className="brand-mark">Plandeck</span>
          <div className="month-nav">
            <button className="nav-btn" onClick={()=>setMonthDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}>‹</button>
            <span className="month-label">{monthLabel}</span>
            <button className="nav-btn" onClick={()=>setMonthDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}>›</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setMonthDate(new Date())}>Today</button>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-primary btn-sm" onClick={()=>setNewActivityDate(U.todayIso())}>+ New Activity</button>
          <div className="user-menu-wrap">
            <button className="user-chip" onClick={()=>setUserMenuOpen(o=>!o)}>{currentUser}</button>
            {userMenuOpen && (
              <div className="status-menu" onMouseLeave={()=>setUserMenuOpen(false)}>
                <button className="status-menu-item" onClick={()=>{setCurrentUser(null);setUserMenuOpen(false);}}>Switch user</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="app-body">
        <Sidebar team={team} currentUser={currentUser} activities={activities} filters={filters} setFilters={setFilters}
          onOpenActivity={setSelectedId} view={view} setView={setView} onAddTeammate={ensureTeammate} onRemoveTeammate={removeTeammate} onlineUsers={onlineUsers} />
        <main className="app-main">
          <LiveActivityBar activities={activities} onOpenActivity={setSelectedId} />
          {view==='calendar'
            ? <CalendarGrid monthDate={monthDate} activities={activities} onOpenActivity={setSelectedId} onMoveActivity={moveActivity} onNewActivity={setNewActivityDate} filterFn={filterFn} />
            : view==='personal'
            ? <PersonalView currentUser={currentUser} activities={activities} onOpenActivity={setSelectedId} onToggleTask={toggleTask} />
            : view==='weekly'
            ? <WeeklySummary activities={activities} team={team} weekDate={weekDate} setWeekDate={setWeekDate} onOpenActivity={setSelectedId} onToggleTask={toggleTask} />
            : <TutorialLibrary />}
        </main>
      </div>
      <ActivityDrawer activity={selected} team={team} currentUser={currentUser} onClose={()=>setSelectedId(null)}
        onChangeStatus={changeStatus} onChangeCategory={changeCategory} onAddParticipant={addParticipant} onRemoveParticipant={removeParticipant}
        onAddTeammate={addTeammateAndParticipant} onAddTask={addTask} onToggleTask={toggleTask} onRemoveTask={removeTask} onEditTaskDeadline={editTaskDeadline} onDelete={deleteActivity}
        onClaim={claimActivity} onUnclaim={unclaimActivity} onEditActivity={editActivity} />
      {newActivityDate && <NewActivityModal date={newActivityDate} team={team} onClose={()=>setNewActivityDate(null)} onCreate={createActivity} onAddTeammate={ensureTeammate} />}
      <Toasts toasts={toasts} onDismiss={id=>setToasts(ts=>ts.filter(t=>t.id!==id))} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
