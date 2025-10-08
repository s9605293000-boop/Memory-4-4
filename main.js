import { applyLang } from './lang.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// --------- Firebase config (memory-4-4) ----------
const firebaseConfig = {
  apiKey: "AIzaSyCIaYXC8SjGbQeeqHr7avZKiJO_mPwQl_A",
  authDomain: "memory-4-4.firebaseapp.com",
  projectId: "memory-4-4",
  // для Storage правильный домен appspot.com
  storageBucket: "memory-4-4.appspot.com",
  messagingSenderId: "650806889779",
  appId: "1:650806889779:web:0233412262142c01a40246",
  measurementId: "G-KZ9S0B51WG"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --------- Helpers ----------
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const show = id => {
  $$('.view').forEach(v => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
};
function toast(msg){ alert(msg); }

// --------- Age Gate ----------
function initAgeGate(){
  const gate = $('#ageGate');
  const ok = localStorage.getItem('age_ok') === '1';
  if (!ok) gate.classList.add('show');
  $('#ageConfirm')?.addEventListener('click', ()=>{
    localStorage.setItem('age_ok','1');
    gate.classList.remove('show');
  }, {passive:false});
}

// --------- Language ----------
const langSelect = $('#langSelect');
function setLang(l){ localStorage.setItem('lang', l); applyLang(l); }
langSelect.addEventListener('change', e=> setLang(e.target.value));
applyLang(localStorage.getItem('lang') || 'en');
langSelect.value = localStorage.getItem('lang') || 'en';

// --------- Views: navigation ----------
$('#toRegister').addEventListener('click', e=>{ e.preventDefault(); show('#view-register'); });
$('#backToLogin').addEventListener('click', e=>{ e.preventDefault(); show('#view-login'); });
$('#toForgot').addEventListener('click', e=>{ e.preventDefault(); show('#view-forgot'); });
$('#backLogin2').addEventListener('click', e=>{ e.preventDefault(); show('#view-login'); });

// --------- Auth: Register / Login / Forgot ----------
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
  if (!email || !pass){ return toast('Fill all fields'); }
  try{
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, {
      photoURL: `assets/avatars/${chosenAvatar}.png`,
      displayName: email.split('@')[0]
    });
    // стартовый рейтинг
    localStorage.setItem(`rating:${res.user.uid}`, '1000');
    toast('Account created');
  }catch(err){ toast('Register error ❌: '+err.message); }
});

$('#btnLogin').addEventListener('click', async ()=>{
  const email = $('#loginEmail').value.trim();
  const pass  = $('#loginPass').value;
  if (!email || !pass){ return toast('Fill all fields'); }
  try{
    await signInWithEmailAndPassword(auth, email, pass);
  }catch(err){
    toast('Login error ❌: '+err.message);
  }
});

$('#btnForgot').addEventListener('click', async ()=>{
  const email = $('#forgotEmail').value.trim();
  if (!email){ return toast('Enter email'); }
  try{
    await sendPasswordResetEmail(auth, email);
    toast('Reset link sent');
  }catch(err){ toast('Reset error ❌: '+err.message); }
});

$('#btnLogout').addEventListener('click', ()=> auth.signOut());

// --------- Auth state → route ----------
onAuthStateChanged(auth, user=>{
  if (user){
    // заполнить лобби
    $('#uiEmail').textContent = user.email ?? 'user';
    $('#uiAvatar').src = user.photoURL || 'assets/avatars/default.png';
    const rating = localStorage.getItem(`rating:${user.uid}`) || '1000';
    $('#uiRating').textContent = rating;
    show('#view-lobby');
  }else{
    show('#view-login');
  }
});

// --------- Solo Game ----------
const board = $('#board');
const youScoreEl = $('#youScore');
const pairsLeftEl = $('#pairsLeft');
const turnTimer = $('#turnTimer');

let grid = '4x3';
let deck = [];
let opened = [];
let locked = false;
let score = 0;
let timerId = null;
const TURN_SECONDS = 5;

const CARD_BACK = 'assets/cards/question.png';
// frontы — положи в /assets/cards/1.png .. 12.png (можно больше)
function buildDeck(size){
  const [cols, rows] = size.split('x').map(Number);
  const total = cols*rows;
  const pairs = total/2;
  const ids = Array.from({length:pairs}, (_,i)=> i+1); // 1..pairs
  const srcs = ids.flatMap(id => [`assets/cards/${id}.png`,`assets/cards/${id}.png`]);
  // тасуем
  for(let i=srcs.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [srcs[i],srcs[j]]=[srcs[j],srcs[i]];
  }
  return srcs;
}

function renderBoard(size){
  const [cols, rows] = size.split('x').map(Number);
  board.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  board.innerHTML = '';
  deck = buildDeck(size);
  opened = [];
  locked = false;
  score = 0;
  youScoreEl.textContent = '0';
  pairsLeftEl.textContent = String(deck.length/2);

  deck.forEach((frontSrc, idx)=>{
    const img = document.createElement('img');
    img.dataset.idx = String(idx);
    img.dataset.front = frontSrc;
    img.src = CARD_BACK;
    img.alt = 'card';
    img.addEventListener('click', onCardClick, {passive:true});
    board.appendChild(img);
  });

  restartTimer();
}

function onCardClick(e){
  if (locked) return;
  const img = e.currentTarget;
  const idx = Number(img.dataset.idx);
  if (opened.includes(idx)) return; // уже открыта

  flipToFront(img);

  opened.push(idx);
  if (opened.length === 2){
    locked = true;
    const [a,b] = opened.map(i => board.querySelector(`img[data-idx="${i}"]`));
    const same = a.dataset.front === b.dataset.front;
    setTimeout(()=>{
      if (same){
        a.style.visibility = b.style.visibility = 'hidden';
        score++;
        youScoreEl.textContent = String(score);
        pairsLeftEl.textContent = String(Number(pairsLeftEl.textContent)-1);
        if (Number(pairsLeftEl.textContent) === 0){
          toast('🏁 GG!'); // конец
        }
      }else{
        flipToBack(a); flipToBack(b);
      }
      opened = [];
      locked = false;
      restartTimer();
    }, 600);
  }
}

function flipToFront(img){ img.src = img.dataset.front; }
function flipToBack(img){ img.src = CARD_BACK; }

function restartTimer(){
  clearInterval(timerId);
  let t = TURN_SECONDS;
  turnTimer.textContent = String(t);
  timerId = setInterval(()=>{
    t--; turnTimer.textContent = String(t);
    if (t<=0){
      clearInterval(timerId);
      // в соло режиме просто переворачиваем открытые
      if (opened.length === 1){
        const only = board.querySelector(`img[data-idx="${opened[0]}"]`);
        flipToBack(only);
        opened = [];
      }
      restartTimer();
    }
  }, 1000);
}

// кнопки размеров
$$('.btn.size').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    grid = btn.dataset.size;
    show('#view-game');
    renderBoard(grid);
  });
});

$('#btnBackLobby').addEventListener('click', ()=>{
  show('#view-lobby');
  clearInterval(timerId);
});

// enlarge avatar on register preview
$$('.avatar.clickable').forEach(img=>{
  img.addEventListener('click', ()=> img.classList.toggle('big'));
});

// --------- PWA: register service worker ----------
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
  });
}

// init
initAgeGate();