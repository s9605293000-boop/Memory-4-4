const LANGS={
  en:{title:"MEMORY DUEL",login_tab:"Login",register_tab:"Register",login:"Login",forgot:"Forgot password",create:"Create account",free:"Free",in_game:"In game",offline:"Offline",solo_mode:"Solo Mode",duel_mode:"Duel Mode",choose_level:"Choose level",easy:"Easy",medium:"Medium",hard:"Hard",logout:"Log out",back:"Back",online_players:"Online players",invite_sent:"Invite sent. Expires in 60s.",you_invited:"You invited",invited_you:"invited you",accept:"Accept",decline:"Decline",turn:"Turn",you:"You",opponent:"Opponent",win:"You win! +15 rating",lose:"You lose! -10 rating",left_game:"Opponent left. You win! +15 rating"},
  ru:{title:"MEMORY DUEL",login_tab:"Вход",register_tab:"Регистрация",login:"Войти",forgot:"Забыли пароль",create:"Создать аккаунт",free:"Свободен",in_game:"В игре",offline:"Оффлайн",solo_mode:"Solo режим",duel_mode:"Duel режим",choose_level:"Выбор уровня",easy:"Легко",medium:"Средне",hard:"Сложно",logout:"Выйти",back:"Назад",online_players:"Онлайн-игроки",invite_sent:"Приглашение отправлено. Истекает через 60с.",you_invited:"Вы пригласили",invited_you:"пригласил(а) вас",accept:"Принять",decline:"Отклонить",turn:"Ход",you:"Вы",opponent:"Соперник",win:"Вы победили! +15 рейтинга",lose:"Вы проиграли! -10 рейтинга",left_game:"Соперник вышел. Победа! +15 рейтинга"},
  es:{title:"MEMORY DUEL",login_tab:"Entrar",register_tab:"Registro",login:"Entrar",forgot:"Olvidé la contraseña",create:"Crear cuenta",free:"Libre",in_game:"En juego",offline:"Offline",solo_mode:"Modo Solo",duel_mode:"Modo Duelo",choose_level:"Elegir nivel",easy:"Fácil",medium:"Medio",hard:"Difícil",logout:"Salir",back:"Atrás",online_players:"Jugadores en línea",invite_sent:"Invitación enviada. Expira en 60s.",you_invited:"Invitaste a",invited_you:"te invitó",accept:"Aceptar",decline:"Rechazar",turn:"Turno",you:"Tú",opponent:"Oponente",win:"¡Ganaste! +15 rating",lose:"Perdiste -10 rating",left_game:"El oponente salió. ¡Ganaste! +15 rating"}
};
function setLang(l){
  localStorage.setItem('lang',l);
  const d=LANGS[l]||LANGS.en;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.getAttribute('data-i18n');
    if(d[k]) el.textContent=d[k];
  });
}
document.addEventListener('click',e=>{
  const b=e.target.closest('.lang-btn');
  if(b) setLang(b.dataset.lang);
});
window.addEventListener('DOMContentLoaded',()=>setLang(localStorage.getItem('lang')||'en'));