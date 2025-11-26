/* create-password.js */

const SUPABASE_URL = "https://qkdgjmwdxtosqxmnfmsb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGdqbXdkeHRvc3F4bW5mbXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODU2NTQsImV4cCI6MjA3OTU2MTY1NH0.t7rAZuU3tGeKE7AYLkpFZysl5antY7XTBdPOR1DELYU";

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async function init() {
  const { data } = await supa.auth.getUser();
  if (!data || !data.user) {
    window.location.href = "login.html";
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
