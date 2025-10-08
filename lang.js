export const dict = {
  en:{
    age_title:"Age Confirmation",
    age_text:"You must be 18+ to play. Confirm to continue.",
    age_btn:"I am 18+",

    login_title:"Sign In",
    email:"Email",
    password:"Password",
    btn_signin:"Sign In",
    link_create:"Create account",
    link_forgot:"Forgot password?",

    reg_title:"Create account",
    btn_register:"Register",
    btn_back_login:"Back to Sign In",

    forgot_title:"Reset password",
    btn_reset:"Send reset link",

    lobby_title:"Lobby",
    new_table:"Create new table",
    solo_note:"Single-player for now. Rating isn’t updated in solo.",
    btn_logout:"Log out",
    btn_back_lobby:"Back to Lobby",
    you:"You",
    pairs:"Pairs",
    rating:"Rating"
  },
  ru:{
    age_title:"Подтверждение возраста",
    age_text:"Для игры нужно 18+. Подтвердите, чтобы продолжить.",
    age_btn:"Мне 18+",

    login_title:"Вход",
    email:"Эл. почта",
    password:"Пароль",
    btn_signin:"Войти",
    link_create:"Создать аккаунт",
    link_forgot:"Забыли пароль?",

    reg_title:"Регистрация",
    btn_register:"Зарегистрироваться",
    btn_back_login:"Назад ко входу",

    forgot_title:"Восстановление пароля",
    btn_reset:"Отправить ссылку",

    lobby_title:"Лобби",
    new_table:"Создать стол",
    solo_note:"Пока только одиночная игра. Рейтинг не изменяется.",
    btn_logout:"Выйти",
    btn_back_lobby:"В лобби",
    you:"Вы",
    pairs:"Пары",
    rating:"Рейтинг"
  },
  es:{
    age_title:"Confirmación de edad",
    age_text:"Debes tener 18+ para jugar. Confirma para continuar.",
    age_btn:"Tengo 18+",

    login_title:"Iniciar sesión",
    email:"Correo",
    password:"Contraseña",
    btn_signin:"Entrar",
    link_create:"Crear cuenta",
    link_forgot:"¿Olvidaste la contraseña?",

    reg_title:"Registro",
    btn_register:"Registrarse",
    btn_back_login:"Volver a entrar",

    forgot_title:"Restablecer contraseña",
    btn_reset:"Enviar enlace",

    lobby_title:"Lobby",
    new_table:"Crear mesa nueva",
    solo_note:"Por ahora es modo solitario. El rating no cambia.",
    btn_logout:"Salir",
    btn_back_lobby:"Volver al Lobby",
    you:"Tú",
    pairs:"Pares",
    rating:"Rating"
  }
};

export function applyLang(lang='en'){
  const pack = dict[lang] ?? dict.en;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if (pack[key]) el.textContent = pack[key];
  });
  localStorage.setItem('lang', lang);
}