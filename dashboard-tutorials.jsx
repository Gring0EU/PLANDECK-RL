const {useState:useStateT}=React;

function TutorialCard({tutorial,open,onToggle,onOpenImage}){
  return (
    <div className="tutorial-card">
      <button className="tutorial-head" onClick={onToggle}>
        <span className="tutorial-head-main">
          <span className="tutorial-title">{tutorial.title}</span>
          <span className="tutorial-summary">{tutorial.summary}</span>
        </span>
        <span className="tutorial-tag">{tutorial.tag}</span>
        <span className={"tutorial-chevron"+(open?' tutorial-chevron-open':'')}>{'\u203a'}</span>
      </button>
      {open && (
        <div className="tutorial-body">
          <div className="tutorial-section-label">Steps</div>
          <ol className="tutorial-steps">
            {tutorial.steps.map((s,i)=>{
              const step=typeof s==='string'?{text:s}:s;
              return (
                <li key={i}>
                  <span>{step.text}</span>
                  {step.images && step.images.length>0 && (
                    <div className="step-gallery">
                      {step.images.map((src,j)=>(
                        <button key={j} className="step-thumb" onClick={()=>onOpenImage(src)}>
                          <img src={src} alt="" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {tutorial.notes && tutorial.notes.length>0 && (
            <div>
              <div className="tutorial-section-label">Good to know</div>
              <ul className="tutorial-notes">
                {tutorial.notes.map((n,i)=><li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TutorialLibrary(){
  const [openId,setOpenId]=useStateT(window.TUTORIALS[0].id);
  const [lightbox,setLightbox]=useStateT(null);
  return (
    <div className="personal-view">
      <section className="personal-section">
        <h3>Tutorial Library</h3>
        <p className="tutorial-intro">Step-by-step guides for the team's recurring editorial workflows {'\u2014'} use these to onboard new members or double-check a process.</p>
        <div className="tutorial-list">
          {window.TUTORIALS.map(t=>(
            <TutorialCard key={t.id} tutorial={t} open={openId===t.id} onToggle={()=>setOpenId(openId===t.id?null:t.id)} onOpenImage={setLightbox} />
          ))}
        </div>
      </section>
      {lightbox && (
        <div className="lightbox-overlay" onClick={()=>setLightbox(null)}>
          <button className="lightbox-close" onClick={()=>setLightbox(null)}>{'\u00d7'}</button>
          <img className="lightbox-img" src={lightbox} alt="" onClick={e=>e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

Object.assign(window,{TutorialLibrary});
