/* client-auth.js */

const supa = window.supa;

if (!supa) {
  console.error("Supabase client non inizializzato. Controlla l'ordine degli script nella sezione barber");
}
(function initPasswordLogin() {
  const emailInput = document.getElementById("loginEmail");
  const pwdInput = document.getElementById("loginPwd");
  const btn = document.getElementById("loginPwdBtn");

  if(!emailInput || !pwdInput || !btn) return;

  btn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = pwdInput.value.trim();

    if(!email || !password){
      showMessage("Inserisci email e password.", "error");
      return;
    }

    const { data, error } = await supa.auth.signInWithPassword({ email, password });

    if(error){
      showMessage("Credenziali non valide.", "error");
      return;
    }

    window.location.href = "booking.html";
  });
})();
