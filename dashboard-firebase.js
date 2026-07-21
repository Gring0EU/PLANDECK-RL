const firebaseConfig={apiKey:"AIzaSyARZaVHwsAvx2JsIG7lNH8qVEEOi9obzEQ",authDomain:"researchlabdashboard.firebaseapp.com",databaseURL:"https://researchlabdashboard-default-rtdb.europe-west1.firebasedatabase.app",projectId:"researchlabdashboard",storageBucket:"researchlabdashboard.firebasestorage.app",messagingSenderId:"878402435189",appId:"1:878402435189:web:b05231b1938762ed1f603c"};
firebase.initializeApp(firebaseConfig);
const stateRef=firebase.database().ref('plandeck/state');
const presenceRef=firebase.database().ref('plandeck/presence');
const chatsRef=firebase.database().ref('plandeck/chats');
function encodeKey(k){return String(k).replace(/[.#$\[\]\/]/g,'~');}
function decodeKey(k){return String(k).replace(/~/g,'.');}
function decodeChats(data){
  const out={};
  Object.keys(data||{}).forEach(k=>{
    const s=data[k]||{};
    const messagesObj=s.messages||{};
    const messages=Object.keys(messagesObj).map(mk=>messagesObj[mk]).sort((a,b)=>(a.at||'').localeCompare(b.at||''));
    const lastReadAt=s.lastReadAt||{};
    const decLastRead={};
    Object.keys(lastReadAt).forEach(u=>{decLastRead[decodeKey(u)]=lastReadAt[u];});
    out[decodeKey(k)]={active:!!s.active,messages,lastReadAt:decLastRead};
  });
  return out;
}
window.DashDB={
  subscribe(cb){
    const handler=snap=>cb(snap.val());
    stateRef.on('value',handler);
    return ()=>stateRef.off('value',handler);
  },
  save(data){
    stateRef.set(data).catch(e=>console.error('Firebase save failed',e));
  },
  subscribeChats(cb){
    const handler=snap=>cb(decodeChats(snap.val()||{}));
    chatsRef.on('value',handler);
    return ()=>chatsRef.off('value',handler);
  },
  startChatSession(username){
    chatsRef.child(encodeKey(username)).update({active:true}).catch(e=>console.error('Firebase chat start failed',e));
  },
  endChatSession(username){
    chatsRef.child(encodeKey(username)).update({active:false}).catch(e=>console.error('Firebase chat end failed',e));
  },
  deleteChatSession(username){
    chatsRef.child(encodeKey(username)).remove().catch(e=>console.error('Firebase chat delete failed',e));
  },
  markChatRead(username,reader){
    chatsRef.child(encodeKey(username)+'/lastReadAt/'+encodeKey(reader)).set(new Date().toISOString()).catch(e=>console.error('Firebase chat read-mark failed',e));
  },
  sendChatMessage(username,message){
    chatsRef.child(encodeKey(username)+'/messages').push(message).catch(e=>console.error('Firebase chat send failed',e));
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
