function buildSeedData(){
  const team=['Assia.D','Hugo.M','Killian.B','Benjamin.R'];
  return {team,activities:syncRecurringActivities([],team)};
}

const RECURRING_RULES=[
  {key:'blog',title:'The Blog',time:'18:00',days:[1,2,3,4,5],category:'CIO',description:'Daily blog post \u2014 assign a writer and publish before the cutoff.',deliverables:['Publish post']},
  {key:'wrapup',title:'Wrap Up',time:'17:00',days:[4,5],category:'CIO',description:'End-of-day editorial wrap up.',deliverables:['Wrap up']},
  {key:'focus',title:'Focus Article (EN & FR)',time:null,days:[4],category:'CIO',description:'In-depth focus article, published in English and French.',deliverables:['English version','French version']},
  {key:'charts',title:'The Week in Seven Charts (EN & FR)',time:null,days:[5],category:'CIO',description:'Weekly data recap in seven charts, published in English and French.',deliverables:['English version','French version']}
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
      if(existingById[id]){ out.push({...existingById[id],category:existingById[id].category||rule.category||''}); return; }
      out.push({
        id,title:rule.title,description:rule.description,date:dateIso,time:rule.time,
        status:'planned',category:rule.category||'',participants:defaultTeam,claimedBy:null,claimedAt:null,
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
    tasks:Array.isArray(a.tasks)?a.tasks:(a.tasks?Object.values(a.tasks):[]),
    history:Array.isArray(a.history)?a.history:(a.history?Object.values(a.history):[])
  }));
}
function normalizeTeam(raw){
  if(!raw) return [];
  return Array.isArray(raw)?raw:Object.values(raw);
}
window.DashData={buildSeedData,syncRecurringActivities,normalizeActivities,normalizeTeam};
window.TUTORIALS=[
  {
    id:'blog',
    title:'The Blog \u2014 Daily "Syz The Moment"',
    tag:'Daily',
    summary:'Clone yesterday\u2019s post, pull the latest content from Charles-Henry\u2019s LinkedIn, and publish before 18:00.',
    steps:[
      {text:'Open HubSpot \u2192 Content \u2192 Blog',images:['assets/tut-blog-1.png']},
      'Select "Syz The Moment"',
      'Find the last post \u2192 click Clone',
      'Open Charles-Henry\u2019s LinkedIn \u2192 go to his posts',
      'Copy the title (usually the first sentence) from the most recent post',
      'Back in HubSpot, open Settings (top right)',
      'Paste the new title into "Blog title"',
      'Click the pencil icon on "Blog URL" \u2192 paste the title again into "Content Slug"',
      'Choose one or two tags from the existing options (don\u2019t create new ones)',
      'Go back to the post, save the image ("Save As")',
      'In HubSpot, click Upload and upload the image (it should become "featured")',
      'Copy the rest of the post text, including the source',
      'Paste that text into "Meta description"',
      'Close Settings',
      {text:'Open Preview (top right) and check the content matches the LinkedIn post',images:['assets/tut-blog-2.png','assets/tut-blog-3.png','assets/tut-blog-4.png','assets/tut-blog-5.png','assets/tut-blog-6.png','assets/tut-blog-7.png']},
      'Make sure there are no leftover # in the text',
      'Select Back, then Publish \u2192 Publish \u2192 Exit'
    ],
    notes:[
      'Deadline is 18:00 every day \u2014 avoid changes after 17:55 (publishing takes a few minutes)',
      'Publish at least 10 posts (around 15 is better)',
      'Contact Anna if there\u2019s a deadline issue',
      'Skip posts that are just thank-yous or blog announcements',
      'Prefer same-day posts; if short on content, check the previous day or Valerie Noel\u2019s LinkedIn',
      'To fix a published mistake: open the post \u2192 edit \u2192 Update'
    ]
  },
  {
    id:'wrapup-create',
    title:'Wrap Up \u2014 Global Markets Slide Creation',
    tag:'Mon\u2013Fri',
    summary:'Collect the week\u2019s LinkedIn posts, categorize them, and build the slide deck ahead of Thursday/Friday review.',
    steps:[
      'Collection: gather all LinkedIn posts from Charles-Henry Monchau, Monday through Friday 5 PM',
      'Categorize each post: Markets, Macro, Central Banks, Geopolitics, Crypto, Food for Thought',
      'Inside Markets, organize by: Equities, Bonds, Forex, Commodities, Alternatives',
      'Within every category, order geographically: US \u2192 Europe \u2192 Rest of the World',
      'Keep a logical, smooth flow between slides wherever possible',
      'Each post = one vertical slide with: image, text (trimmed if needed), source, relevant hashtags',
      'Align the image under the text, same width \u2014 never wider than the category title or text block',
      'Resize images so they stay clear, especially if they contain text',
      'If a post has no text, keep only the image and source \u2014 no need to add filler text',
      'For long posts: trim less relevant content and prioritize the key insight',
      'Remove all hashtags from the body text itself',
      'If a source is missing, check the end of the text and the image for branding/logos; if still missing, flag it for Charles-Henry Monchau'
    ],
    notes:[
      'Thursday 5 PM \u2192 submit all slides created since Monday to Charles-Henry Monchau for review',
      'He may reorder, remove, or send slides back',
      'Friday \u2192 finalize remaining posts from his Thursday review and submit the completed set by 5 PM',
      'Saturday (before 11:45 AM) \u2192 the final wrap-up must be posted on HubSpot \u2014 see the Saturday Upload tutorial'
    ]
  },
  {
    id:'wrapup-upload',
    title:'Wrap Up \u2014 Saturday HubSpot Upload',
    tag:'Saturday',
    summary:'Take the finalized wrap-up PDF and publish it as the week\u2019s "Fast Food for Thought" post before 11:45 AM.',
    steps:[
      'In HubSpot, filter by "fast food for thought"',
      'Find last week\u2019s Wrapup post \u2192 click Clone \u2192 delete "(clone)" from the end of the title',
      'Open the email from Charles and download/save the wrapup PDF attachment',
      {text:'Copy the new title and replace the old one in HubSpot',images:['assets/tut-wrapup-upload-1.png']},
      {text:'Copy the new text block and replace the old block',images:['assets/tut-wrapup-upload-2.png']},
      'Copy roughly half of the text block \u2192 open Settings \u2192 Metadata \u2192 delete old text \u2192 paste the copied section \u2192 close',
      {text:'Click "PDF" \u2192 pencil icon \u2192 Replace \u2192 Upload \u2192 upload the saved wrapup \u2192 select it under "recently uploaded" \u2192 Apply',images:['assets/tut-wrapup-upload-3.png']},
      'Click Preview \u2192 open the PDF from the new tab \u2192 copy its link',
      'Go back to Preview, then back to the original tab',
      {text:'On the left side, open Contents \u2192 under hidden modules find "PDF Link" \u2192 replace the old link with the copied one',images:['assets/tut-wrapup-upload-4.png']},
      'Upload / publish'
    ],
    notes:[
      'Must be posted before 11:45 AM Saturday',
      'Uses the finalized deck submitted Friday at 5 PM'
    ]
  }
];
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
  fmtRange:(start,end)=>{const opt={month:'short',day:'numeric'};const s=start.toLocaleDateString(undefined,opt);const e=end.toLocaleDateString(undefined,{...opt,year:'numeric'});return s+' – '+e;},
  categories:['Equity','Fixed Income','Funds','Alternative','CIO','DPM','Advisory','Banker'],
  categoryColors:{'Equity':'#79D6FF','Fixed Income':'#FFA400','Funds':'#3BAF90','Alternative':'#9DD9D2','CIO':'#FF6C0E','DPM':'#E6A4AD','Advisory':'#AC5D85','Banker':'#FFC545'},
  uniqueActivities:(list)=>{
    const seen=new Set(); const out=[];
    list.forEach(a=>{
      const key=a.recurring?'r:'+a.title:'a:'+a.id;
      if(seen.has(key)) return;
      seen.add(key); out.push(a);
    });
    return out;
  },
  categories:['Equity','Fixed Income','Funds','Alternative','CIO','DPM','Advisory','Banker']
};
