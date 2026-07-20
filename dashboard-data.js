function buildSeedData(){
  const team=['Assia.D','Hugo.M','Killian.B','Benjamin.R'];
  return {team,activities:syncRecurringActivities([],team)};
}

const RECURRING_RULES=[
  {key:'blog',title:'The Blog',time:'18:00',days:[1,2,3,4,5],description:'Daily blog post \u2014 assign a writer and publish before the cutoff.',deliverables:['Publish post']},
  {key:'wrapup',title:'Wrap Up',time:'17:00',days:[4,5],description:'End-of-day editorial wrap up.',deliverables:['Wrap up']},
  {key:'focus',title:'Focus Article (EN & FR)',time:null,days:[4],description:'In-depth focus article, published in English and French.',deliverables:['English version','French version']},
  {key:'charts',title:'The Week in Seven Charts (EN & FR)',time:null,days:[5],description:'Weekly data recap in seven charts, published in English and French.',deliverables:['English version','French version']}
];

function isoLocal(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day;}

function labelFor(rule){
  if(rule.days.length===5 && [1,2,3,4,5].every(w=>rule.days.includes(w))) return 'Weekdays';
  return rule.days.map(w=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][w]).join(' & ');
}

// Keeps a rolling window of dated recurring occurrences so they appear as real activities
// on every applicable calendar day, while preserving edits on occurrences already generated.
function syncRecurringActivities(activities,team){
  const today=new Date(); today.setHours(0,0,0,0);
  const start=new Date(today); start.setDate(start.getDate()-14);
  const end=new Date(today); end.setDate(end.getDate()+120);
  const defaultTeam=team||['Assia.D','Hugo.M','Killian.B','Benjamin.R'];
  const nonRecurring=activities.filter(a=>!a.recurring);
  const existingById={};
  activities.filter(a=>a.recurring && /-\d{4}-\d{2}-\d{2}$/.test(a.id)).forEach(a=>{existingById[a.id]=a;});
  const out=[];
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const wd=d.getDay();
    const dateIso=isoLocal(d);
    RECURRING_RULES.forEach(rule=>{
      if(!rule.days.includes(wd)) return;
      const id='rec-'+rule.key+'-'+dateIso;
      if(existingById[id]){ out.push(existingById[id]); return; }
      out.push({
        id,title:rule.title,description:rule.description,date:dateIso,time:rule.time,
        status:'planned',participants:defaultTeam,claimedBy:null,claimedAt:null,
        recurring:true,recurringLabel:labelFor(rule),
        tasks:rule.deliverables.map((label,i)=>({id:id+'-t'+i,title:label,assignee:'',deadline:dateIso,deadlineTime:rule.time,done:false}))
      });
    });
  }
  return [...nonRecurring,...out];
}
function normalizeActivities(raw){
  if(!raw) return [];
  const arr=Array.isArray(raw)?raw:Object.values(raw);
  return arr.filter(Boolean).map(a=>({
    ...a,
    participants:Array.isArray(a.participants)?a.participants:(a.participants?Object.values(a.participants):[]),
    tasks:Array.isArray(a.tasks)?a.tasks:(a.tasks?Object.values(a.tasks):[])
  }));
}
function normalizeTeam(raw){
  if(!raw) return [];
  return Array.isArray(raw)?raw:Object.values(raw);
}
window.DashData={buildSeedData,syncRecurringActivities,normalizeActivities,normalizeTeam};
window.DashUtils={
  iso:d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day;},
  todayIso:()=>window.DashUtils.iso(new Date()),
  fmtDate:iso=>{const d=new Date(iso+'T00:00:00');return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});},
  fmtDateLong:iso=>{const d=new Date(iso+'T00:00:00');return d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});},
  daysBetween:(iso)=>{const t=new Date(window.DashUtils.todayIso()+'T00:00:00');const d=new Date(iso+'T00:00:00');return Math.round((d-t)/86400000);},
  isTaskOverdue:(task)=>{if(task.done) return false; const db=window.DashUtils.daysBetween(task.deadline); if(db<0) return true; if(db>0) return false; if(!task.deadlineTime) return false; const now=new Date(); const [h,m]=task.deadlineTime.split(':').map(Number); return now.getHours()>h || (now.getHours()===h && now.getMinutes()>m);},
  fmtTime:(t)=>t?t:'',
  statusMeta:{
    planned:{label:'Planned',color:'var(--planned)',bg:'var(--planned-bg)'},
    progress:{label:'In Progress',color:'var(--progress)',bg:'var(--progress-bg)'},
    done:{label:'Done',color:'var(--done)',bg:'var(--done-bg)'}
  },
  uid:()=>Math.random().toString(36).slice(2,9),
  initials:(name)=>name.split(/[\s.]+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join(''),
  fmtTimeOfDay:(iso)=>new Date(iso).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}),
  startOfWeek:(d)=>{const x=new Date(d);x.setDate(x.getDate()-x.getDay());x.setHours(0,0,0,0);return x;},
  endOfWeek:(d)=>{const s=new Date(d);s.setDate(s.getDate()-s.getDay()+6);s.setHours(0,0,0,0);return s;},
  fmtRange:(start,end)=>{const opt={month:'short',day:'numeric'};const s=start.toLocaleDateString(undefined,opt);const e=end.toLocaleDateString(undefined,{...opt,year:'numeric'});return s+' – '+e;}
};
