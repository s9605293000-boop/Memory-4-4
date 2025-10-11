// Firebase init
var firebaseConfig={
  apiKey:"AIzaSyCIaYXC8SjGbQeeqHr7avZKiJO_mPwQl_A",
  authDomain:"memory-4-4.firebaseapp.com",
  projectId:"memory-4-4",
  storageBucket:"memory-4-4.firebasestorage.app",
  messagingSenderId:"650806889779",
  appId:"1:650806889779:web:0233412262142c01a40246",
  measurementId:"G-KZ9S0B51WG"
};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();

// PWA
if('serviceWorker'in navigator){ navigator.serviceWorker.register('./service-worker.js'); }

// Helpers
const qs=s=>document.querySelector(s);
const qsa=s=>Array.from(document.querySelectorAll(s));
function show(id){ qsa('.card').forEach(c=>c.classList.add('hidden')); qs(id).classList.remove('hidden'); }

// Tabs
qs('#tab-login').addEventListener('click',()=>{
  qs('#tab-login').classList.add('active');
  qs('#tab-register').classList.remove('active');
  qs('#login-form').classList.remove('hidden');
  qs('#register-form').classList.add('hidden');
});
qs('#tab-register').addEventListener('click',()=>{
  qs('#tab-register').classList.add('active');
  qs('#tab-login').classList.remove('active');
  qs('#register-form').classList.remove('hidden');
  qs('#login-form').classList.add('hidden');
});
qsa('.avatar.pick').forEach(img=>img.addEventListener('click',()=>{
  qsa('.avatar.pick').forEach(i=>i.classList.remove('active'));
  img.classList.add('active');
}));

// Auth
qs('#btn-forgot').addEventListener('click',async()=>{
  const email=qs('#login-email').value.trim();
  if(!email){return qs('#auth-error').textContent='Email required';}
  try{ await auth.sendPasswordResetEmail(email); qs('#auth-error').textContent='Email sent'; }
  catch(e){ qs('#auth-error').textContent=e.message; }
});

qs('#btn-register').addEventListener('click',async()=>{
  const email=qs('#reg-email').value.trim();
  const pass=qs('#reg-password').value;
  const nick=qs('#reg-nickname').value.trim();
  const avatar=qs('.avatar.pick.active').dataset.avatar;
  const err=qs('#register-error'); err.textContent='';
  if(!email||!pass||!nick){err.textContent='Fill all fields';return;}
  if(pass.length<6){err.textContent='Password 6+';return;}
  if(nick.length<3||nick.length>16){err.textContent='Nickname 3–16';return;}
  const exists=await db.collection('profiles').where('nickname','==',nick).get();
  if(!exists.empty){err.textContent='Nickname taken';return;}
  try{
    const cred=await auth.createUserWithEmailAndPassword(email,pass);
    await db.collection('profiles').doc(cred.user.uid).set({
      nickname:nick,rating:1000,avatar:'assets/avatars/'+avatar,coins:10,
      status:'free',updated:firebase.firestore.FieldValue.serverTimestamp()
    });
  }catch(e){ err.textContent=e.message; }
});

qs('#btn-login').addEventListener('click',async()=>{
  const email=qs('#login-email').value.trim();
  const password=qs('#login-password').value;
  try{ await auth.signInWithEmailAndPassword(email,password); }
  catch(e){ qs('#auth-error').textContent=e.message; }
});

qs('#btn-logout').addEventListener('click',()=>auth.signOut());

auth.onAuthStateChanged(async(user)=>{
  if(!user){ show('#auth-screen'); return; }
  const pdoc=db.collection('profiles').doc(user.uid);
  const p=await pdoc.get();
  if(!p.exists){
    await pdoc.set({nickname:'Player',rating:1000,avatar:'assets/avatars/pirate_avatar_1.jpg',coins:10,status:'free',updated:firebase.firestore.FieldValue.serverTimestamp()});
  }
  const prof=(await pdoc.get()).data();
  qs('#profile-avatar').src=prof.avatar;
  qs('#profile-name').textContent=prof.nickname;
  qs('#rating-badge').textContent=prof.rating;
  setPresence('free');
  show('#lobby');
  subscribeOnlineList();
});

// Presence
let presenceUnsub=null;
function setPresence(state){
  const user=auth.currentUser; if(!user) return;
  db.collection('profiles').doc(user.uid).update({status:state,updated:firebase.firestore.FieldValue.serverTimestamp()});
  const l=localStorage.getItem('lang')||'en';
  qs('#presence-badge').textContent=(state==='free'?LANGS[l].free:(state==='in'?LANGS[l].in_game:LANGS[l].offline));
}
function subscribeOnlineList(){
  if(presenceUnsub) presenceUnsub();
  presenceUnsub=db.collection('profiles').where('status','in',['free','in']).onSnapshot(snap=>{
    const ul=qs('#online-list'); ul.innerHTML='';
    snap.forEach(doc=>{
      if(doc.id===auth.currentUser.uid) return;
      const d=doc.data();
      const li=document.createElement('li');
      li.innerHTML=`<div style="display:flex;align-items:center;gap:8px">
        <img src="${d.avatar}" class="avatar">
        <div><div>${d.nickname}</div><div class="badge">${d.rating}</div></div>
      </div><button class="invite" data-uid="${doc.id}">Invite</button>`;
      ul.appendChild(li);
    });
  });
}

// Modes
qs('#solo-mode').addEventListener('click',()=>{
  qs('#duel-panel').classList.add('hidden');
  qs('#level-select').classList.remove('hidden');
  qs('#level-select').dataset.mode='solo';
});
qs('#duel-mode').addEventListener('click',()=>{
  qs('#duel-panel').classList.remove('hidden');
  qs('#level-select').classList.remove('hidden');
  qs('#level-select').dataset.mode='duel';
});
qsa('.level').forEach(btn=>btn.addEventListener('click',()=>{
  const lvl=btn.dataset.level;
  const mode=qs('#level-select').dataset.mode||'solo';
  if(mode==='solo'){ startSolo(lvl); }
  else{ prepareDuel(lvl); }
}));

// Invites
document.addEventListener('click',async(e)=>{
  const iv=e.target.closest('.invite');
  if(!iv) return;
  const to=iv.dataset.uid;
  const user=auth.currentUser;
  const inv=await db.collection('invites').add({
    from:user.uid,to,created:firebase.firestore.FieldValue.serverTimestamp(),ttl:Date.now()+60000
  });
  qs('#invite-info').textContent=LANGS[localStorage.getItem('lang')||'en'].invite_sent;
  const unsub=db.collection('rooms').where('invite','==',inv.id).onSnapshot(s=>{
    s.forEach(doc=>{ if(doc.exists){ unsub(); joinRoom(doc.id); } });
  });
  setTimeout(()=>inv.delete(),60000);
});
auth.onAuthStateChanged(user=>{
  if(!user) return;
  db.collection('invites').where('to','==',user.uid).onSnapshot(snap=>{
    snap.docChanges().forEach(ch=>{
      if(ch.type!=='added') return;
      const inv=ch.doc.data();
      const wrap=document.createElement('div');
      wrap.className='card';
      wrap.innerHTML=`<b>${LANGS[localStorage.getItem('lang')||'en'].invited_you}</b>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="primary" id="acc-${ch.doc.id}">${LANGS[localStorage.getItem('lang')||'en'].accept}</button>
          <button class="secondary" id="dec-${ch.doc.id}">${LANGS[localStorage.getItem('lang')||'en'].decline}</button>
        </div>`;
      qs('#lobby').appendChild(wrap);
      wrap.querySelector('#acc-'+ch.doc.id).onclick=async()=>{
        const level=qs('#level-select').dataset.level||'easy';
        const room=await db.collection('rooms').add({
          invite:ch.doc.id,players:[inv.from,inv.to],created:firebase.firestore.FieldValue.serverTimestamp(),
          level,turn:inv.from,state:buildDeck(level),open:[],banks:{[inv.from]:0,[inv.to]:0},timer:5,lastMove:Date.now(),finished:false
        });
        joinRoom(room.id);
      };
      wrap.querySelector('#dec-'+ch.doc.id).onclick=()=>ch.doc.ref.delete();
      if(inv.ttl&&Date.now()>inv.ttl){ ch.doc.ref.delete(); }
    });
  });
});

function prepareDuel(level){
  qs('#level-select').dataset.level=level;
  qs('#invite-info').textContent='Invite a player to start (60s).';
}

// Board/logic
let currentRoom=null; let soloState=null;
function gridFor(level){ if(level==='easy')return[4,3,6]; if(level==='medium')return[4,4,8]; return[6,4,12]; }
function buildDeck(level){
  const[, ,pairs]=gridFor(level);
  const all=[...Array(12)].map((_,i)=>`assets/cards/pirate_${String(i+1).padStart(2,'0')}.png`);
  const chosen=shuffle(all).slice(0,pairs);
  const deck=shuffle([...chosen,...chosen]).map((src,idx)=>({id:idx,img:src,open:false,matched:false}));
  return deck;
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }

function startSolo(level){
  setPresence('in');
  soloState={level,deck:buildDeck(level),open:[],bank:0};
  currentRoom=null;
  renderBoard(soloState.deck,level);
  qs('#bank-p1 span').textContent=soloState.bank;
  qs('#bank-p2 span').textContent='0';
  qs('#game-info').textContent='Solo';
  qs('#turn-timer').textContent='';
  show('#game-screen');
}

async function joinRoom(roomId){
  currentRoom=roomId;
  setPresence('in');
  const roomRef=db.collection('rooms').doc(roomId);
  roomRef.onSnapshot(snap=>{
    const r=snap.data();
    renderBoard(r.state,r.level,r.turn);
    const my=auth.currentUser.uid;
    qs('#bank-p1 span').textContent=r.banks[my]||0;
    const opp=r.players.find(x=>x!==my);
    qs('#bank-p2 span').textContent=r.banks[opp]||0;
    qs('#turn-timer').textContent=Math.max(0,5-Math.floor((Date.now()-r.lastMove)/1000));
    const l=localStorage.getItem('lang')||'en';
    qs('#game-info').textContent=(r.turn===my?LANGS[l].you:LANGS[l].opponent)+' - '+LANGS[l].turn;
    if(r.finished){ endDuel(r); }
  });
  show('#game-screen');
}

document.addEventListener('click',async(e)=>{
  const tile=e.target.closest('.card-tile');
  if(!tile) return;
  const idx=parseInt(tile.dataset.idx);
  if(currentRoom){
    const my=auth.currentUser.uid;
    const roomRef=db.collection('rooms').doc(currentRoom);
    const r=(await roomRef.get()).data();
    if(r.turn!==my) return;
    const now=Date.now();
    if(now-r.lastMove>5000){
      await roomRef.update({turn:r.players.find(x=>x!==my),lastMove:now,open:[]});
      return;
    }
    if(r.state[idx].matched||r.open.includes(idx)) return;
    r.state[idx].open=true; r.open.push(idx);
    if(r.open.length===2){
      const[a,b]=r.open;
      if(r.state[a].img===r.state[b].img){
        r.state[a].matched=r.state[b].matched=true;
        r.banks[my]=(r.banks[my]||0)+1; r.open=[];
      }else{
        const opp=r.players.find(x=>x!==my);
        setTimeout(async()=>{
          const fresh=(await roomRef.get()).data();
          fresh.state[a].open=false; fresh.state[b].open=false;
          fresh.turn=opp; fresh.lastMove=Date.now(); fresh.open=[];
          await roomRef.set(fresh);
        },600);
      }
    }
    const finished=r.state.every(c=>c.matched);
    if(finished) r.finished=true;
    r.lastMove=now;
    await roomRef.set(r);
  }else if(soloState){
    const st=soloState;
    const c=st.deck[idx];
    if(c.matched||st.open.includes(idx)) return;
    c.open=true; st.open.push(idx);
    if(st.open.length===2){
      const[a,b]=st.open;
      if(st.deck[a].img===st.deck[b].img){
        st.deck[a].matched=st.deck[b].matched=true; st.bank++; st.open=[];
        flyToBank(tile,qs('#bank-p1'));
      }else{
        setTimeout(()=>{ st.deck[a].open=st.deck[b].open=false; st.open=[]; renderBoard(st.deck,st.level); },600);
      }
    }
    renderBoard(st.deck,st.level);
  }
});

function flyToBank(fromEl,bankEl){
  const rect=fromEl.getBoundingClientRect();
  const clone=fromEl.cloneNode(true);
  clone.classList.add('fly');
  clone.style.left=rect.left+'px';
  clone.style.top=rect.top+'px';
  document.body.appendChild(clone);
  const b=bankEl.getBoundingClientRect();
  requestAnimationFrame(()=>{
    clone.style.transform=`translate(${b.left-rect.left}px, ${b.top-rect.top}px) scale(.2)`;
    clone.style.opacity='0';
  });
  setTimeout(()=>clone.remove(),650);
}

function renderBoard(deck,level){
  const[cols,rows]=(level==='hard')?[6,4]:(level==='medium'?[4,4]:[4,3]);
  const board=qs('#board');
  board.innerHTML='';
  board.style.gridTemplateColumns=`repeat(${cols},72px)`;
  board.style.gridTemplateRows=`repeat(${rows},72px)`;
  deck.forEach((card,idx)=>{
    const el=document.createElement('div');
    el.className='card-tile'+(card.open||card.matched?' flipped':'');
    el.dataset.idx=idx;
    el.innerHTML=`
      <img class="card-back" src="assets/cards/back.png">
      <div class="card-face">
        <img src="${card.img}" style="width:64px;height:64px"/>
      </div>`;
    board.appendChild(el);
  });
}

qs('#btn-exit-game').addEventListener('click',async()=>{
  if(currentRoom){
    const my=auth.currentUser.uid;
    const roomRef=db.collection('rooms').doc(currentRoom);
    const r=(await roomRef.get()).data();
    await updateRatings(my,r.players.find(x=>x!==my),false,true);
    await roomRef.delete();
    currentRoom=null;
  }
  setPresence('free');
  show('#lobby');
});

async function endDuel(r){
  const my=auth.currentUser.uid;
  const opp=r.players.find(x=>x!==my);
  const myScore=r.banks[my]||0;
  const oppScore=r.banks[opp]||0;
  await updateRatings(my,opp,myScore>oppScore);
  db.collection('rooms').doc(currentRoom).delete();
  currentRoom=null;
  const l=localStorage.getItem('lang')||'en';
  alert((myScore>oppScore)?LANGS[l].win:LANGS[l].lose);
  setPresence('free');
  show('#lobby');
}
async function updateRatings(who,other,didWin,left=false){
  const p1=db.collection('profiles').doc(who);
  const p2=db.collection('profiles').doc(other);
  const A=await p1.get(),B=await p2.get();
  let r1=A.data().rating,r2=B.data().rating;
  if(left){ r1-=10; r2+=15; }
  else if(didWin){ r1+=15; r2-=10; }
  else{ r1-=10; r2+=15; }
  await p1.update({rating:r1});
  await p2.update({rating:r2});
}