const firebaseConfig={apiKey:"AIzaSyARZaVHwsAvx2JsIG7lNH8qVEEOi9obzEQ",authDomain:"researchlabdashboard.firebaseapp.com",databaseURL:"https://researchlabdashboard-default-rtdb.europe-west1.firebasedatabase.app",projectId:"researchlabdashboard",storageBucket:"researchlabdashboard.firebasestorage.app",messagingSenderId:"878402435189",appId:"1:878402435189:web:b05231b1938762ed1f603c"};
firebase.initializeApp(firebaseConfig);
const stateRef=firebase.database().ref('plandeck/state');
window.DashDB={
  subscribe(cb){
    const handler=snap=>cb(snap.val());
    stateRef.on('value',handler);
    return ()=>stateRef.off('value',handler);
  },
  save(data){
    stateRef.set(data).catch(e=>console.error('Firebase save failed',e));
  }
};
