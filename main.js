// ==========================
// Firebase SDK
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Firebase config (memory-4-4)
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

// ==========================
// Language system
// ==========================
const I18N = {
  en: {
    age_title: "Age Confirmation",
    age_text: "You must be 18+ to play. Confirm to continue.",
    age_btn: "I am 18+",
    login_title: "Sign In",
    login_btn: "Sign In",
    forgot: "Forgot password?",
    create: "Create account",
    email: "Email",
    password: "Password"
  },
  ru: {
    age_title: "Подтверждение возраста",
    age_text: "Вам должно быть 18+. Подтвердите, чтобы продолжить.",
    age_btn: "Мне 18+",
    login_title: "Вход",
    login_btn: "Войти",
    forgot: "Забыли пароль?",
    create: "Создать аккаунт",
    email: "Эл. почта",
    password: "Пароль"
  },
  es: {
    age_title: "Confirmación de edad",
    age_text: "Debes tener 18+ para jugar. Confirma para continuar.",
    age_btn: "Tengo 18+",
    login_title: "Iniciar sesión",
    login_btn: "Entrar",
    forgot: "¿Olvidaste la contraseña?",
    create: "Crear cuenta",
    email: "Correo",
    password: "Contraseña"
  }
};

let currentLang = localStorage.getItem("lang") || "en";
const langSelect = document.getElementById("langSelect");

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (I18N[lang][key]) {
      el.textContent = I18N[lang][key];
    }
  });
}
langSelect.addEventListener("change", e => applyLang(e.target.value));
applyLang(currentLang);

// ==========================
// Age confirmation
// ==========================
const ageGate = document.getElementById("ageGate");
const ageConfirm = document.getElementById("ageConfirm");

function checkAge() {
  if (localStorage.getItem("age_ok") === "1") {
    ageGate.classList.remove("show");
    ageGate.classList.add("hide");
  } else {
    ageGate.classList.add("show");
  }
}
ageConfirm.addEventListener("click", () => {
  localStorage.setItem("age_ok", "1");
  checkAge();
});
checkAge();

// ==========================
// Auth logic
// ==========================
const loginBtn = document.getElementById("btnLogin");
const emailInput = document.getElementById("loginEmail");
const passInput = document.getElementById("loginPassword");
const forgotLink = document.getElementById("forgotPassword");
const regLink = document.getElementById("createAccount");

// Вход
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  if (!email || !password) return alert("Fill all fields");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login success ✅");
  } catch (err) {
    alert("Login error ❌: " + err.message);
  }
});

// Забыли пароль
forgotLink.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if (!email) return alert("Enter your email first");
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Reset link sent to email");
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// Регистрация (пока простая заглушка)
regLink.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  if (!email || !password) return alert("Fill all fields");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem("rating", "1000"); // стартовый рейтинг
    alert("Registration success ✅");
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// Выход
const logoutBtn = document.getElementById("btnLogout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth);
  });
}

// ==========================
// Auth state observer
// ==========================
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);
    // здесь можно показать лобби
  } else {
    console.log("No user");
    // показать экран входа
  }
});