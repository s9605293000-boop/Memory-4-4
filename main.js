import { applyLang } from './lang.js';

// --------- Firebase (CDN modular v10) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot,
  updateDoc, addDoc, deleteDoc, serverTimestamp, query, where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-analytics.js";

// ---- Твои ключи (как прислал) ----
const firebaseConfig = {
  apiKey: "AIzaSyCIaYXC8SjGbQeeqHr7avZKiJO_mPwQl_A",
  authDomain: "memory-4-4.firebaseapp.com",
  projectId: "memory-4-4",
  storageBucket: "memory-4-4.firebasestorage.app",
  messagingSenderId: "650806889779",
  appId: "1:650806889779:web:0233412262142c01a40246",
  measurementId: "G-KZ9S0B51WG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
try { getAnalytics(app); } catch(_) { /* analytics unavailable on http */ }

// --------- Helpers ----------
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const show = id => { $$('.view').forEach(v=>v.classList.add('hidden')); $(id).classList.remove('hidden'); };
const toast = m => alert(m);

// --------- Age Gate ----------
(function initAgeGate(){
  const gate = $('#ageGate');
  if (localStorage.getItem('age_ok') === '1') return gate.classList.remove('show');
  $('#ageConfirm').addEventListener('click', ()=>{
    localStorage.setItem('age_ok','1');
    gate.classList.remove('show');
  });
})();

// --------- Language ----------
const langSelect = $('#langSelect');
function setLang(l){ applyLang(l); langSelect.value = l; }
langSelect.addEventListener('change', e => setLang(e.target.value));
setLang(localStorage.getItem('lang') || 'en');

// --------- View nav ----------
$('#toRegister').addEventListener('click', e=>{ e.preventDefault(); show('#view-register'); });
$('#backToLogin').addEventListener('click', e=>{ e.preventDefault(); show('#view-login'); });
$('#toForgot').addEventListener('click', e=>{ e.preventDefault(); show('#view-forgot'); });
$('#backLogin2').addEventListener('click', e=>{ e.preventDefault(); show('#view-login'); });

// --------- Auth ----------
let chosenAvatar = '1';
$('#avatarGrid').addEventListener('click', e=>{
  if (e.target.matches('.avatar')) {
    $$('#avatarGrid .avatar').forEach(a=>a.classList.remove('selected'));
    e.target.classList.add('selected');
    chosenAvatar = e.target.dataset.id;
  }
});

$('#btnRegister').addEventListener('click', async ()=>{
  const email = $('#regEmail').value.trim();
  const pass  = $('#regPass').value;
  if (!email || !pass) return toast('Fill all fields');
  try{
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, {
      displayName: email.split('@')[0],
      photoURL: `assets/avatars/${chosenAvatar}.png`
    });
    // стартовый рейтинг в Firestore
    await setDoc(doc(db, 'profiles', cred.user.uid), {
      email, rating: 1000, avatar: chosenAvatar, createdAt: serverTimestamp()
    });
    toast('Account created');
  }catch(err){ toast('Register error: '+err.message); }
});

$('#btnLogin').addEventListener('click', async ()=>{
  const email = $('#loginEmail').value.trim();
  const pass  = $('#loginPass').value;
  if (!email || !pass) return toast('Fill all fields');
  try{
    await signInWithEmailAndPassword(auth, email, pass);
  }catch(err){ toast('Login error: '+err.message); }
});

$('#btnForgot').addEventListener('click', async ()=>{
  const email = $('#forgotEmail').value.trim();
  if (!email) return toast('Enter email');
  try{
    await sendPasswordResetEmail(auth, email);
    toast('Reset link sent');
  }catch(err){ toast('Reset error: '+err.message); }
});

$('#btnLogout').addEventListener('click', ()=> signOut(auth));

// --------- Auth state → lobby ----------
let currentUser = null;
onAuthStateChanged(auth, async (user)=>{
  currentUser = user || null;
  if (user){
    const pr = await getDoc(doc(db, 'profiles', user.uid));
    const rating = pr.exists() ? (pr.data().rating ?? 1000) : 1000;
    $('#uiEmail').textContent = user.email;
    $('#uiRating').textContent = rating;
    $('#uiAvatar').src = user.photoURL || 'assets/avatars/1.png';
    show('#view-lobby');
    refreshTables();
  }else{
    show('#view-login');
  }
});

// --------- Lobby: tables (Firestore) ----------
const tablesCol = collection(db, 'tables');
let grid = '4x3';

$$('.btn.size').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    grid = btn.dataset.size;
  });
});

$('#btnRefreshTables').addEventListener('click', refreshTables);
async function refreshTables(){
  const list = $('#tablesList');
  list.innerHTML = '';
  const snap = await getDocs(tablesCol);
  snap.forEach(d=>{
    const t = d.data();
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <b>${t.name}</b> • ${t.grid} • ${t.status}
        <div class="sub">${(t.ownerEmail||'').split('@')[0]}</div>
      </div>
      <div>
        ${t.status==='open' ? `<button class="btn join" data-id="${d.id}">Join</button>` : ''}
        ${currentUser && t.owner===currentUser.uid ? `<button class="btn ghost del" data-id="${d.id}">Delete</button>` : ''}
      </div>
    `;
    list.appendChild(li);
  });

  // attach actions
  $$('#tablesList .btn.join').forEach(b=>b.addEventListener('click', ()=> joinTable(b.dataset.id)));
  $$('#tablesList .btn.del').forEach(b=>b.addEventListener('click',  ()=> deleteTable(b.dataset.id)));
}

$('#btnCreateDuel').addEventListener('click', async ()=>{
  if (!currentUser) return toast('Sign in first');
  const name = `Table ${Math.random().toString(36).slice(2,7)}`;
  const board = buildDeck(grid); // shuffled fronts
  const ref = await addDoc(tablesCol, {
    name, grid, owner: currentUser.uid, ownerEmail: currentUser.email,
    status: 'open',
    createdAt: serverTimestamp(),
    players: [{uid: currentUser.uid, score:0}],
    board, opened: [], removed: [],
    turn: currentUser.uid, turnEndsAt: Date.now() + 5000
  });
  toast('Duel created');
  refreshTables();
});

async function deleteTable(id){
  await deleteDoc(doc(db,'tables',id));
  refreshTables();
}

async function joinTable(id){
  if (!currentUser) return toast('Sign in first');
  const ref = doc(db,'tables',id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return toast('Table not found');
  const t = snap.data();
  if (t.players?.length>=2) return toast('Table is full');
  await updateDoc(ref, {
    status: 'playing',
    players: t.players.concat([{uid: currentUser.uid, score:0}]),
    turn: t.turn ?? currentUser.uid,
    turnEndsAt: Date.now() + 5000
  });
  openGame(id, true); // duel mode
}

// --------- Game (solo & duel) ----------
const boardEl = $('#board');
const youScoreEl = $('#youScore');
const oppScoreEl = $('#oppScore');
const pairsLeftEl = $('#pairsLeft');
const turnTimerEl = $('#turnTimer');
$('#btnSolo').addEventListener('click', ()=> { openGame(null,false); });

$('#btnBackLobby').addEventListener('click', ()=>{
  show('#view-lobby');
  stopTick();
  if (unsubGame) unsubGame();
});

const CARD_BACK = 'assets/cards/question.png'; // единый бэк
function buildDeck(size){
  const [cols,rows] = size.split('x').map(Number);
  const total = cols*rows; const pairs = total/2;
  // используем пиратские фронты 1..12 (расширяй при желании)
  const ids = Array.from({length:pairs},(_,i)=> (i%12)+1);
  const fronts = ids.flatMap(id => [`assets/cards/${id}.png`,`assets/cards/${id}.png`]);
  // shuffle
  for(let i=fronts.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [fronts[i],fronts[j]]=[fronts[j],fronts[i]];
  }
  return fronts;
}

let opened = [];
let locked = false;
let tickId = null;
function stopTick(){ clearInterval(tickId); }

function renderBoardFrom(fronts, removedSet){
  boardEl.innerHTML = '';
  const [cols] = grid.split('x').map(Number);
  boardEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  fronts.forEach((frontSrc, idx)=>{
    const img = document.createElement('img');
    img.dataset.idx = idx;
    img.dataset.front = frontSrc;
    img.src = removedSet?.has(idx) ? frontSrc : CARD_BACK;
    img.style.visibility = removedSet?.has(idx) ? 'hidden' : 'visible';
    img.addEventListener('click', onCardClick, {passive:true});
    boardEl.appendChild(img);
  });
}

function onCardClick(e){
  if (locked) return;
  const img = e.currentTarget;
  const idx = Number(img.dataset.idx);
  if (img.style.visibility==='hidden') return;
  if (opened.includes(idx)) return;

  img.src = img.dataset.front;
  opened.push(idx);

  if (opened.length===2){
    locked = true;
    const [a,b] = opened.map(i => boardEl.querySelector(`img[data-idx="${i}"]`));
    const same = a.dataset.front === b.dataset.front;

    setTimeout(async ()=>{
      if (same){
        a.style.visibility = b.style.visibility = 'hidden';
        youScoreEl.textContent = String(Number(youScoreEl.textContent)+1);
        pairsLeftEl.textContent = String(Math.max(0, Number(pairsLeftEl.textContent)-1));
        if (currentGame && currentGame.duel) {
          await updateDoc(doc(db,'tables', currentGame.id), {
            removed: (currentGame.removed||[]).concat(opened),
          });
        }
      }else{
        a.src = CARD_BACK; b.src = CARD_BACK;
      }
      opened = [];
      locked = false;
    }, 500);
  }
}

let currentGame = null;
let unsubGame = null;

async function openGame(tableId, duel){
  // init state
  opened = []; locked = false;
  youScoreEl.textContent = '0'; oppScoreEl.textContent = '0';
  $('#opponentWrap').style.display = duel ? 'block' : 'none';

  if (!duel){
    // SOLO
    const size = grid;
    const fronts = buildDeck(size);
    const pairs = fronts.length/2;
    pairsLeftEl.textContent = String(pairs);
    renderBoardFrom(fronts, new Set());
    show('#view-game');
    startTurnTimer();
    currentGame = {duel:false, fronts};
    return;
  }

  // DUEL (Firestore)
  const ref = doc(db,'tables',tableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return toast('Table not found');
  const t = snap.data();
  grid = t.grid; // align with table
  const pairs = t.board.length/2;
  pairsLeftEl.textContent = String(pairs);
  currentGame = {duel:true, id: tableId, board: t.board, removed: new Set(t.removed||[])};
  renderBoardFrom(t.board, currentGame.removed);
  show('#view-game');
  startTurnTimer(t.turnEndsAt);

  if (unsubGame) unsubGame();
  unsubGame = onSnapshot(ref, s=>{
    if (!s.exists()) return;
    const d = s.data();
    // update removed
    currentGame.removed = new Set(d.removed||[]);
    // re-render visibilities only (cheap)
    $$('#board img').forEach(img=>{
      const idx = Number(img.dataset.idx);
      img.style.visibility = currentGame.removed.has(idx) ? 'hidden' : 'visible';
      if (!currentGame.removed.has(idx) && !opened.includes(idx)) img.src = CARD_BACK;
    });
    // scores (на лету считаем)
    const myIdxs  = Array.from(currentGame.removed).filter((_,i)=>true).length/2; // грубо, локально
    oppScoreEl.textContent = String(Math.max(0, (d.removed?.length||0)/2 - Number(youScoreEl.textContent)));
    pairsLeftEl.textContent = String(Math.max(0, d.board.length/2 - (d.removed?.length||0)/2));
  });
}

// --------- 5s turn timer (UI only; для полной честности таймер можно хранить в Firestore) ----------
function startTurnTimer(turnEndsAt){
  stopTick();
  let t = 5;
  if (turnEndsAt){
    const dt = Math.floor((turnEndsAt - Date.now())/1000);
    if (dt>0) t = dt;
  }
  turnTimerEl.textContent = String(t);
  tickId = setInterval(()=>{
    t--; turnTimerEl.textContent = String(Math.max(0,t));
    if (t<=0){
      stopTick();
      // в solo просто переворачиваем одиночную открытую карту
      if (!currentGame?.duel && opened.length===1){
        const only = boardEl.querySelector(`img[data-idx="${opened[0]}"]`);
        if (only) only.src = CARD_BACK;
        opened=[];
      }
      // перезапустим заново
      startTurnTimer();
    }
  },1000);
}

// --------- PWA: register SW ----------
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
  });
}