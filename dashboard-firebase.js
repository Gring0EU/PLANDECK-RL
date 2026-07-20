const firebaseConfig={apiKey:"AIzaSyARZaVHwsAvx2JsIG7lNH8qVEEOi9obzEQ",authDomain:"researchlabdashboard.firebaseapp.com",databaseURL:"https://researchlabdashboard-default-rtdb.europe-west1.firebasedatabase.app",projectId:"researchlabdashboard",storageBucket:"researchlabdashboard.firebasestorage.app",messagingSenderId:"878402435189",appId:"1:878402435189:web:b05231b1938762ed1f603c"};
firebase.initializeApp(firebaseConfig);
const stateRef=firebase.database().ref('plandeck/state');
const presenceRef=firebase.database().ref('plandeck/presence');
window.DashDB={
  subscribe(cb){
    const handler=snap=>cb(snap.val());
    stateRef.on('value',handler);
    return ()=>stateRef.off('value',handler);
  },
  save(data){
    stateRef.set(data).catch(e=>console.error('Firebase save failed',e));
  },
  goOnline(name){
    const myRef=presenceRef.child(btoa(unescape(encodeURIComponent(name))));
    myRef.onDisconnect().remove();
    myRef.set({name,at:Date.now()});
    return ()=>myRef.remove();
  },
  subscribePresence(cb){
    const handler=snap=>{
      const val=snap.val()||{};
      cb(Object.values(val).map(v=>v.name));
    };
    presenceRef.on('value',handler);
    return ()=>presenceRef.off('value',handler);
  }
};
