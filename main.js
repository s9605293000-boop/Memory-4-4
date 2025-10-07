бы
import { applyLang } from './lang.js';

// Language switch
const langSelect = document.getElementById('langSelect');
function setLang(l){ localStorage.setItem('lang', l); applyLang(l); }
langSelect.addEventListener('change', e=> setLang(e.target.value));
setLang(localStorage.getItem('lang') || 'en');

// Age gate
const ageGate = document.getElementById('ageGate');
document.getElementById('ageConfirm').onclick = ()=>{
  localStorage.setItem('age_ok','1'); ageGate.classList.remove('show');
};
if(localStorage.getItem('age_ok')==='1'){ ageGate.classList.remove('show'); }

// Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// Views helpers
const V = (id)=>document.getElementById(id);
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  V(id).classList.remove('hidden');
}

// Auth flow
V('toRegister').onclick = ()=>showView('view-register');
V('toLogin').onclick = ()=>showView('view-login');

V('btnForgot').onclick = async ()=>{
  const email = V('loginEmail').value.trim();
  if(!email) return alert('Enter email first');
  await auth.sendPasswordResetEmail(email);
  alert('Reset link sent to email');
};

V('btnRegister').onclick = async ()=>{
  const email = V('regEmail').value.trim();
  const pass = V('regPassword').value.trim();
  const rating = parseInt(V('regRating').value || '1000', 10);
  if(!email || !pass) return alert('Fill required fields');
  const cred = await auth.createUserWithEmailAndPassword(email, pass);
  // upload avatar if any
  let avatarUrl = '';
  const f = V('regAvatar').files[0];
  if(f){
    const ref = storage.ref(`avatars/${cred.user.uid}/${Date.now()}_${f.name}`);
    await ref.put(f);
    avatarUrl = await ref.getDownloadURL();
  }
  await db.ref(`users/${cred.user.uid}`).set({ email, rating, avatarUrl, createdAt: Date.now() });
  await cred.user.updateProfile({ displayName: email.split('@')[0], photoURL: avatarUrl || null });
  gotoLobby();
};

V('btnLogin').onclick = async ()=>{
  const email = V('loginEmail').value.trim();
  const pass = V('loginPassword').value.trim();
  if(!email || !pass) return alert('Fill required fields');
  await auth.signInWithEmailAndPassword(email, pass);
  gotoLobby();
};

auth.onAuthStateChanged(u=>{ if(u){ gotoLobby(); } });

async function gotoLobby(){
  const u = auth.currentUser;
  if(!u) return showView('view-login');
  // pull user profile
  const snap = await db.ref(`users/${u.uid}`).once('value');
  const prof = snap.val() || { rating:1000, avatarUrl: u.photoURL||'' };
  V('userName').textContent = u.displayName || (u.email||'').split('@')[0];
  V('userRating').textContent = prof.rating || 1000;
  V('userAvatar').src = prof.avatarUrl || 'assets/avatars/default.png';
  showView('view-lobby');
  startLobbyStreams();
}

// Lobby: create table, list tables, online players
let tablesRef, presenceRef;
function startLobbyStreams(){
  // active tables
  tablesRef = db.ref('tables').limitToLast(100);
  tablesRef.on('value', s=>{
    const ul = V('tables'); ul.innerHTML='';
    const me = auth.currentUser;
    const val = s.val()||{};
    Object.entries(val).forEach(([id,t])=>{
      const li = document.createElement('li');
      li.textContent = `${t.mode.toUpperCase()} • ${t.size} • host: ${t.hostName} • players:${Object.keys(t.players||{}).length}`;
      li.className='cardrow';
      li.onclick = ()=> joinTable(id);
      ul.appendChild(li);
    });
  });

  // online players presence
  const user = auth.currentUser;
  const myRef = db.ref(`presence/${user.uid}`);
  myRef.set({ uid:user.uid, name:user.displayName||user.email, rating: V('userRating').textContent*1, ts: firebase.database.ServerValue.TIMESTAMP });
  myRef.onDisconnect().remove();

  const listRef = db.ref('presence');
  listRef.on('value', s=>{
    const ul = V('playersOnline'); ul.innerHTML='';
    const min = parseInt(V('minRating').value || '0', 10);
    const val = s.val()||{};
    Object.values(val).filter(p=> (p.rating||0)>=min).forEach(p=>{
      const li = document.createElement('li');
      const img = document.createElement('img'); img.className='avatar'; img.src='assets/avatars/default.png';
      const txt = document.createElement('div'); txt.innerHTML = `<strong>${p.name}</strong><br><span class="muted">⭐ ${p.rating||0}</span>`;
      const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Invite';
      btn.onclick = ()=> alert('Invite sent to '+p.name);
      li.append(img, txt, btn);
      ul.appendChild(li);
    });
  });
}
V('minRating').addEventListener('change', ()=> startLobbyStreams());

V('btnCreateTable').onclick = async ()=>{
  const user = auth.currentUser;
  const size = V('difficulty').value;
  const mode = V('mode').value; // duel / solo
  const id = db.ref('tables').push().key;
  const table = {
    id, size, mode,
    host: user.uid,
    hostName: user.displayName || user.email,
    players: { [user.uid]: { seat: 'p1' } },
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    expiresAt: Date.now()+ (5*60*1000), // 5 min auto cleanup
    state: 'waiting'
  };
  await db.ref(`tables/${id}`).set(table);
  joinTable(id);
};

async function joinTable(id){
  const user = auth.currentUser;
  const tRef = db.ref(`tables/${id}`);
  const snap = await tRef.once('value');
  const t = snap.val();
  if(!t) return alert('Table not found');
  const players = t.players || {};
  if(!players[user.uid]){
    const seat = Object.values(players).some(p=>p.seat==='p1') ? 'p2' : 'p1';
    await tRef.child(`players/${user.uid}`).set({ seat });
  }
  startGame(id);
}

let game = { id:null, gridSize:[4,3], cards:[], turn:'p1', secs:5, timer:null, mode:'duel' };

function startGame(id){
  game.id = id;
  db.ref(`tables/${id}`).once('value').then(s=>{
    const t = s.val();
    game.mode = t.mode || 'duel';
    game.gridSize = t.size.split('x').map(n=>parseInt(n,10)); // e.g. [4,3]
    setupGrid();
    showView('view-game');
    startTurnTimer();
  });
}

function setupGrid(){
  const [a,b] = game.gridSize; // width x height-like
  const total = (a.split? parseInt(a):a) * (b.split? parseInt(b):b);
  const N = typeof a==='number' ? a*b : game.gridSize[0]*game.gridSize[1];
  const grid = V('grid'); grid.innerHTML='';
  // compute columns based on first number in size string
  const cols = game.gridSize[0];
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  // build pairs
  const pairs = Math.floor((cols * game.gridSize[1]) / 2);
  const ids = Array.from({length:pairs}, (_,i)=>i);
  const deck = [...ids, ...ids].sort(()=>Math.random()-0.5);
  game.cards = deck.map((pid,idx)=>({ id: idx, pair: pid, open:false, found:false }));

  game.firstPick = null;
  game.scores = { p1:0, p2:0 };

  game.cards.forEach(card=>{
    const div = document.createElement('div');
    div.className='card';
    div.dataset.id = card.id;
    div.innerHTML = `<div class="card-inner">
        <div class="card-face card-front"><span class="icon-q">?</span></div>
        <div class="card-face card-back"><img src="assets/cards/${(card.pair%6)+1}.png" alt="" style="width:80%;height:80%;object-fit:contain"></div>
      </div>`;
    div.onclick = ()=> onCardClick(card, div);
    grid.appendChild(div);
  });
}

function onCardClick(card, el){
  if(card.found || card.open) return;
  flip(el, true); card.open = true;
  if(!game.firstPick){ game.firstPick = { card, el }; return; }
  // check match
  if(game.firstPick.card.pair === card.pair){
    // found pair
    card.found = true;
    game.firstPick.card.found = true;
    flyToBank(el); flyToBank(game.firstPick.el);
    scorePoint(currentSeat());
    game.firstPick = null;
  }else{
    // close both after delay
    const prev = game.firstPick; game.firstPick = null;
    setTimeout(()=>{ flip(el,false); flip(prev.el,false); }, 600);
    switchTurn();
  }
}
function flip(el, state){
  el.classList.toggle('flipped', state);
}
function flyToBank(el){
  el.classList.add('fly');
  setTimeout(()=> el.style.visibility='hidden', 600);
}
function currentSeat(){ return game.turn; }
function scorePoint(seat){
  const id = seat==='p1' ? 'p1Score':'p2Score';
  const val = parseInt(document.getElementById(id).textContent||'0',10)+1;
  document.getElementById(id).textContent = val;
  // no rating change in solo mode (per spec)
}

function switchTurn(){ game.turn = (game.turn==='p1'?'p2':'p1'); resetTimer(); }
function startTurnTimer(){ resetTimer(); game.timer = setInterval(()=> tick(), 1000); }
function resetTimer(){ game.secs = 5; V('turnTimer').textContent = game.secs; }
function tick(){
  game.secs -= 1; V('turnTimer').textContent = game.secs;
  if(game.secs<=0){ switchTurn(); }
}

// Leave game
V('leaveGame').onclick = ()=>{
  showView('view-lobby');
};

// Avatar enlarge on click
document.querySelectorAll('.avatar.clickable').forEach(img=>{
  img.addEventListener('click',()=>{
    img.classList.toggle('big');
  });
});
// === Age Gate (18+) ===
(function () {
  function hideAgeGate() {
    const gate = document.getElementById('ageGate');
    if (!gate) return;
    gate.classList.remove('show');
    gate.style.display = 'none';
    document.body.classList.remove('modal-open');
    try { localStorage.setItem('age_ok', '1'); } catch (e) {}
  }

  // Делаем функцию доступной для onclick в HTML
  window.confirmAge = hideAgeGate;

  function initAgeGate() {
    const gate = document.getElementById('ageGate');
    if (!gate) return;

    // Если уже подтверждали — сразу скрываем
    try {
      if (localStorage.getItem('age_ok') === '1') {
        hideAgeGate();
        return;
      }
    } catch (e) {}

    // Навешиваем слушатель
    const btn = document.getElementById('ageConfirm');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        hideAgeGate();
      }, { passive: false });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAgeGate, { once: true });
  } else {
    initAgeGate();
  }
})();