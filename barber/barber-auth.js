const supa = window.supa;

if (!supa) {
  console.error("Supabase client non inizializzato. Controlla l'ordine degli script nella sezione barber");
}

/* LOGIN BARBIERE (password) */
(function initBarberPasswordLogin(){
  const emailInput = document.getElementById("barberEmail");
  const pwdInput = document.getElementById("barberPwd");
  const btn = document.getElementById("barberLoginPwdBtn");

  if(!emailInput || !pwdInput || !btn) return;

  btn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = pwdInput.value.trim();

    if(!email || !password){
      showMessage("Inserisci email e password.", "error");
      return;
    }

    const { data, error } = await supa.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      showMessage("Credenziali non valide.", "error");
      return;
    }

    // controllo ruolo barbiere
    const { data: role } = await supa
      .from("clients")
      .select("is_barber")
      .eq("auth_id", data.user.id)
      .maybeSingle();

    if(!role || !role.is_barber){
      showMessage("Questo account non è un barbiere.", "error");
      return;
    }

    window.location.href = "dashboard.html";
  });
})();
