const WEEKDAY_LABELS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function RecurrenceModal({activity,existingRule,onSave,onRemove,onClose}){
  const seed=existingRule||{};
  const [freq,setFreq]=React.useState(seed.freq||'weekly');
  const [days,setDays]=React.useState(seed.days||[new Date(activity.date+'T00:00:00').getDay()]);
  const [monthDays,setMonthDays]=React.useState(seed.monthDays||[new Date(activity.date+'T00:00:00').getDate()]);
  const [time,setTime]=React.useState(seed.time||activity.time||'');
  const toggleDay=d=>setDays(ds=>ds.includes(d)?ds.filter(x=>x!==d):[...ds,d].sort());
  const toggleMonthDay=d=>setMonthDays(ds=>ds.includes(d)?ds.filter(x=>x!==d):[...ds,d].sort((a,b)=>a-b));
  const valid=freq==='weekly'?days.length>0:monthDays.length>0;
  function save(){
    if(!valid) return;
    onSave({
      key:seed.key||('custom-'+activity.id),
      sourceId:activity.id,
      title:activity.title,
      description:activity.description||'',
      category:activity.category||'',
      participants:activity.participants||[],
      deliverables:(activity.tasks||[]).map(t=>t.title),
      time:time||null,
      freq,
      days:freq==='weekly'?days:[],
      monthDays:freq==='monthly'?monthDays:[]
    });
  }
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2 className="drawer-title">Repeat “{activity.title}”</h2>
        <p className="drawer-desc">Pick how often this activity should come back. Occurrences are generated on every matching date and stay editable individually.</p>
        <label className="field-label">Frequency</label>
        <div className="chip-row">
          <button className={"chip chip-clickable"+(freq==='weekly'?' chip-active':'')} onClick={()=>setFreq('weekly')}>Weekly</button>
          <button className={"chip chip-clickable"+(freq==='monthly'?' chip-active':'')} onClick={()=>setFreq('monthly')}>Monthly</button>
        </div>
        {freq==='weekly' ? (
          <React.Fragment>
            <label className="field-label">Repeat on — pick one or more days</label>
            <div className="chip-row">
              {WEEKDAY_LABELS.map((lbl,i)=>(
                <button key={lbl} className={"chip chip-clickable"+(days.includes(i)?' chip-active':'')} onClick={()=>toggleDay(i)}>{lbl}</button>
              ))}
            </div>
            <div className="chip-row" style={{marginTop:'4px'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDays([1,2,3,4,5])}>Weekdays</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDays([])}>Clear</button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <label className="field-label">Repeat on — pick one or more dates</label>
            <div className="monthday-grid">
              {Array.from({length:31},(_,i)=>i+1).map(d=>(
                <button key={d} className={"monthday"+(monthDays.includes(d)?' monthday-on':'')} onClick={()=>toggleMonthDay(d)}>{d}</button>
              ))}
            </div>
            <div className="empty-hint" style={{marginTop:'6px'}}>Dates past the end of a shorter month are skipped that month.</div>
          </React.Fragment>
        )}
        <label className="field-label">Due time (optional)</label>
        <input className="input" type="time" value={time} onChange={e=>setTime(e.target.value)} />
        <button className="btn btn-primary btn-block" style={{marginTop:'16px'}} disabled={!valid} onClick={save}>{existingRule?'Update recurrence':'Make recurring'}</button>
        {existingRule && (
          <button className="btn btn-ghost btn-block" style={{marginTop:'8px'}} onClick={()=>onRemove(existingRule.key)}>Stop repeating (keeps past occurrences)</button>
        )}
      </div>
    </div>
  );
}
Object.assign(window,{RecurrenceModal});
