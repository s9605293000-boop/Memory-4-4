// ---------- i18n словарь ----------
const I18N = {
  en: {
    age_title: "Age Confirmation",
    age_text: "You must be 18+ to play. Confirm to continue.",
    age_btn: "I am 18+",

    login_title: "Sign In",
    login_btn: "Sign In",
    to_register: "Create account",
    to_forgot: "Forgot password?",

    register_title: "Create account",
    register_btn: "Sign Up",
    back_login: "Back to Sign In",
    avatar: "Avatar",

    forgot_title: "Reset password",
    forgot_btn: "Send reset link",

    email: "Email",
    password: "Password",

    logout: "Logout",
    lobby_title: "Lobby",
    create_table: "Create duel",
    difficulty: "Difficulty",
    grid_easy: "Easy — 4x3",
    grid_mid: "Medium — 4x4",
    grid_hard: "Hard — 4x6",
    tables: "Active duels",
    players: "Online players",

    msg_fill: "Fill all required fields",
    msg_reg_ok: "Account created",
    msg_reset_sent: "Reset link sent to email",
    msg_login_ok: "Logged in",
    msg_error: "Error"
  },
  ru: {
    age_title: "Подтверждение возраста",
    age_text: "Вам должно быть 18+. Подтвердите, чтобы продолжить.",
    age_btn: "Мне 18+",

    login_title: "Вход",
    login_btn: "Войти",
    to_register: "Создать аккаунт",
    to_forgot: "Забыли пароль?",

    register_title: "Регистрация",
    register_btn: "Зарегистрироваться",
    back_login: "Назад ко входу",
    avatar: "Аватар",

    forgot_title: "Восстановление пароля",
    forgot_btn: "Отправить ссылку",

    email: "Email",
    password: "Пароль",

    logout: "Выйти",
    lobby_title: "Лобби",
    create_table: "Создать дуэль",
    difficulty: "Сложность",
    grid_easy: "Лёгкий — 4x3",
    grid_mid: "Средний — 4x4",
    grid_hard: "Сложный — 4x6",
    tables: "Активные столы",
    players: "Игроки онлайн",

    msg_fill: "Заполните обязательные поля",
    msg_reg_ok: "Аккаунт создан",
    msg_reset_sent: "Ссылка отправлена на почту",
    msg_login_ok: "Вы вошли",
    msg_error: "Ошибка"
  },
  es: {
    age_title: "Confirmación de edad",
    age_text: "Debes tener 18+ para jugar. Confirma para continuar.",
    age_btn: "Tengo 18+",

    login_title: "Iniciar sesión",
    login_btn: "Entrar",
    to_register: "Crear cuenta",
    to_forgot: "¿Olvidaste la contraseña?",

    register_title: "Crear cuenta",
    register_btn: "Registrarse",
    back_login: "Volver a iniciar sesión",
    avatar: "Avatar",

    forgot_title: "Restablecer contraseña",
    forgot_btn: "Enviar enlace",

    email: "Email",
    password: "Contraseña",

    logout: "Salir",
    lobby_title: "Lobby",
    create_table: "Crear duelo",
    difficulty: "Dificultad",
    grid_easy: "Fácil — 4x3",
    grid_mid: "Medio — 4x4",
    grid_hard: "Difícil — 4x6",
    tables: "Duelos activos",
    players: "Jugadores en línea",

    msg_fill: "Completa los campos requeridos",
    msg_reg_ok: "Cuenta creada",
    msg_reset_sent: "Enlace enviado al correo",
    msg_login_ok: "Sesión iniciada",
    msg_error: "Error"
  }
};

// ---------- Применение языка ----------
const langSelect = document.getElementById('langSelect');
const t = (key) => (I18N[currentLang] && I18N[currentLang][key]) || key;
let currentLang = localStorage.getItem('lang') || 'en';

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    el.textContent = t(k);
  });
  langSelect.value = lang;
}
langSelect.addEventListener('change', e => applyLang(e.target.value));
applyLang(currentLang);

// ---------- Age Gate ----------
const ageGate = document.getElementById('ageGate');
const ageConfirm = document.getElementById('ageConfirm');
function openAgeGateIfNeeded() {
  if (localStorage.getItem('age_ok') === '1') {
    ageGate.classList.add('hidden');
  } else {
    ageGate.classList.remove('hidden');
  }
}
ageConfirm.addEventListener('click', () => {
  localStorage.setItem('age_ok', '1');
  ageGate.classList.add('hidden');
});
openAgeGateIfNeeded();

// ---------- Переключение экранов ----------
const VIEWS = {
  login: document.getElementById('view-login'),
  register: document.getElementById('view-register'),
  forgot: document.getElementById('view-forgot'),
  lobby: document.getElementById('view-lobby'),
};
function show(view) {
  Object.values(VIEWS).forEach(v => v.classList.add('hidden'));
  VIEWS[view].classList.remove('hidden');
}
document.getElementById('toRegister').addEventListener('click', e => { e.preventDefault(); show('register'); });
document.getElementById('toForgot').addEventListener('click', e => { e.preventDefault(); show('forgot'); });
document.getElementById('toLoginFromReg').addEventListener('click', e => { e.preventDefault(); show('login'); });
document.getElementById('toLoginFromForgot').addEventListener('click', e => { e.preventDefault(); show('login'); });

// ---------- Firebase (вставь свои ключи при необходимости) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIaYXC8SjGbQeeqHr7avZKiJO_mPwQl_A",
  authDomain: "memory-4-4.firebaseapp.com",
  projectId: "memory-4-4",
  storageBucket: "memory-4-4.appspot.com",
  messagingSenderId: "650806889779",
  appId: "1:650806889779:web:0233412262142c01a40246",
  measurementId: "G-KZ9S0B51WG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------- Sign In ----------
document.getElementById('btnLogin').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value.trim();
  if (!email || !pass) return alert(t('msg_fill'));
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert(t('msg_login_ok'));
  } catch (e) {
    alert(`${t('msg_error')}: ${e.code || e.message}`);
  }
});

// ---------- Register ----------
document.getElementById('btnRegister').addEventListener('click', async () => {
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPassword').value.trim();
  const avatar= document.getElementById('regAvatar').value;
  if (!email || !pass) return alert(t('msg_fill'));
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // Сохраняем «ник» и аватар (пока только в displayName, позже — в Firestore)
    await updateProfile(cred.user, { displayName: avatar }); // временно
    // Стартовый рейтинг (заглушка — позже в Firestore)
    localStorage.setItem('rating', '1000');
    alert(t('msg_reg_ok'));
  } catch (e) {
    alert(`${t('msg_error')}: ${e.code || e.message}`);
  }
});

// ---------- Forgot password ----------
document.getElementById('btnForgot').addEventListener('click', async () => {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) return alert(t('msg_fill'));
  try {
    await sendPasswordResetEmail(auth, email);
    alert(t('msg_reset_sent'));
    show('login');
  } catch (e) {
    alert(`${t('msg_error')}: ${e.code || e.message}`);
  }
});

// ---------- Lobby / Auth state ----------
const userAvatar = document.getElementById('userAvatar');
const userNick   = document.getElementById('userNick');
const userRating = document.getElementById('userRating');
document.getElementById('btnLogout').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Заполняем лобби
    userAvatar.textContent = '🏴‍☠️';
    userNick.textContent = user.displayName || user.email.split('@')[0];
    userRating.textContent = localStorage.getItem('rating') || '1000';
    show('lobby');
  } else {
    show('login');
  }
});

// ---------- Заглушки списков в лобби ----------
const tablesList = document.getElementById('tablesList');
const playersList = document.getElementById('playersList');
const gridSelect = document.getElementById('gridSelect');
document.getElementById('btnCreateTable').addEventListener('click', () => {
  const grid = gridSelect.value;
  const id = Math.random().toString(36).slice(2,8);
  const li = document.createElement('li');
  li.textContent = `Table #${id} — ${grid}`;
  tablesList.prepend(li);
});
(() => {
  // Заполним пару «онлайн игроков» (заглушка)
  ['Jack', 'Anne', 'Mary', 'John'].forEach(n=>{
    const li = document.createElement('li');
    li.textContent = `${n} • 1000`;
    playersList.append(li);
  });
})();