// ===============================
//  IMPORTS
// ===============================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { applyLang } from "./lang.js";

// ===============================
//  FIREBASE CONFIGURATION
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyCIaYXC8SjGbQeeqHr7avZKiJO_mPwQl_A",
  authDomain: "memory-4-4.firebaseapp.com",
  projectId: "memory-4-4",
  storageBucket: "memory-4-4.appspot.com",
  messagingSenderId: "650806889779",
  appId: "1:650806889779:web:0233412262142c01a40246",
  measurementId: "G-KZ9S0B51WG"
};

// ===============================
//  INITIALIZE FIREBASE
// ===============================
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ===============================
//  LANGUAGE SWITCH SYSTEM
// ===============================
const langSelect = document.getElementById("langSelect");

// Устанавливает и сохраняет выбранный язык
function setLang(l) {
  localStorage.setItem("lang", l);
  applyLang(l);
}

// Событие при смене языка
if (langSelect) {
  langSelect.addEventListener("change", (e) => {
    setLang(e.target.value);
  });
}

// Применяет сохранённый язык при загрузке страницы
setLang(localStorage.getItem("lang") || "en");

// ===============================
//  AGE CONFIRMATION (18+)
// ===============================
window.addEventListener("load", () => {
  const ageGate = document.getElementById("ageGate");
  const confirmBtn = document.getElementById("ageConfirm");

  // Если пользователь уже подтвердил возраст — скрываем окно
  if (localStorage.getItem("age_ok") === "1" && ageGate) {
    ageGate.classList.remove("show");
    return;
  }

  // Если кнопка есть — слушаем клик и сохраняем флаг
  if (confirmBtn && ageGate) {
    confirmBtn.addEventListener("click", () => {
      localStorage.setItem("age_ok", "1");
      ageGate.classList.remove("show");
    });
  }
});

// ===============================
//  FIREBASE EXPORT (если нужно в других файлах)
// ===============================
export { app, analytics };