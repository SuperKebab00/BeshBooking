/* create-password.js */

const supa = window.supa;

if (!supa) {
  console.error("Supabase client non inizializzato. Controlla l'ordine degli script in booking.html");
}

(async function init() {
  const { data } = await supa.auth.getUser();
  if (!data || !data.user) {
    window.location.href = "login-password.html"; // piccolo miglioramento
    return;
  }
})();

document.getElementById("setPwdBtn").addEventListener("click", async () => {
  const pwd1 = document.getElementById("pwd1").value.trim();
  const pwd2 = document.getElementById("pwd2").value.trim();

  if (!pwd1 || !pwd2) {
    showMessage("Compila entrambi i campi.", "error");
    return;
  }
  if (pwd1 !== pwd2) {
    showMessage("Le password non coincidono.", "error");
    return;
  }

  const { error } = await supa.auth.updateUser({ password: pwd1 });

  if (error) {
    console.error(error);
    showMessage("Errore durante il salvataggio della password.", "error");
    return;
  }

  await openModal({
    title: "Password impostata",
    message: "Ora puoi accedere con email e password.",
  });

  window.location.href = "booking.html";
});
