/* client-auth.js */

const SUPABASE_URL = "https://qkdgjmwdxtosqxmnfmsb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGdqbXdkeHRvc3F4bW5mbXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODU2NTQsImV4cCI6MjA3OTU2MTY1NH0.t7rAZuU3tGeKE7AYLkpFZysl5antY7XTBdPOR1DELYU";

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
