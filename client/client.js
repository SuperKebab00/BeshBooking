/* ==========================================
   client.js - Supabase Email OTP + Bookings DB
   ========================================== */

const SUPABASE_URL = "https://qkdgjmwdxtosqxmnfmsb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGdqbXdkeHRvc3F4bW5mbXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODU2NTQsImV4cCI6MjA3OTU2MTY1NH0.t7rAZuU3tGeKE7AYLkpFZysl5antY7XTBdPOR1DELYU";

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================================================
   LOGIN CLIENTE (email OTP) - client/login.html
========================================================= */
(function initClientLogin() {
  const emailInput = document.getElementById("emailInput");
  const sendBtn = document.getElementById("sendLoginLinkBtn");

  // Se non siamo sulla pagina login, esci
  if (!emailInput || !sendBtn) return;

  sendBtn.addEventListener("click", async () => {
    const email = (emailInput.value || "").trim();

    if (!email) {
      showMessage("Inserisci una email valida.", "error");
      return;
    }

    try {
      const { error } = await supa.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo:
            emailRedirectTo: "https://superkebab00.github.io/BeshBooking/client/create-password.html",

        },
      });

      if (error) {
        console.error(error);
        showMessage(error.message || "Errore durante l'invio dell'email.", "error");
        return;
      }

      openModal({
        title: "Email inviata",
        message:
          "Ti abbiamo inviato un link di accesso. Controlla la tua casella email.",
      });
    } catch (err) {
      console.error(err);
      showMessage("Errore imprevisto durante il login.", "error");
    }
  });

  // Se già loggato, vai direttamente alla pagina di prenotazione
  supa.auth.getUser().then(({ data }) => {
    if (data && data.user) {
      window.location.href = "booking.html";
    }
  });
})();

/* =========================================================
   PRENOTAZIONI CLIENTE (booking.html)
========================================================= */
(function initBookingPage() {
  const datePicker = document.getElementById("datePicker");
  const slotList = document.getElementById("slotList");
  const bookingForm = document.getElementById("bookingForm");
  const clientNameInput = document.getElementById("clientName");
  const confirmBookingBtn = document.getElementById("confirmBookingBtn");
  const logoutBtn = document.getElementById("logoutClientBtn");

  // Se non siamo sulla pagina booking, esci
  if (!datePicker || !slotList) return;

  let currentUser = null;
  let currentClientId = null;

  let selectedSlot = null;
  let selectedSlotId = null;
  let selectedDate = null;

  /* ---------- Autenticazione ---------- */
  async function requireAuth() {
    const { data, error } = await supa.auth.getUser();
    if (error) {
      console.error(error);
    }
    if (!data || !data.user) {
      // Non autenticato -> torna al login
      window.location.href = "login.html";
      return null;
    }
    currentUser = data.user;
    return currentUser;
  }

  /* ---------- Assicura il profilo cliente in tabella clients ---------- */
  async function ensureClientProfile() {
    if (!currentUser) return;

    try {
      // 1) Cerchiamo il cliente per auth_id
      let { data, error } = await supa
        .from("clients")
        .select("id, name, email")
        .eq("auth_id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Errore lettura clients:", error);
        showMessage("Errore nel recupero del profilo cliente.", "error");
        return;
      }

      // 2) Se NON esiste, lo creiamo
      if (!data) {
        const { data: inserted, error: insErr } = await supa
          .from("clients")
          .insert({
            auth_id: currentUser.id,
            email: currentUser.email,
            name: null,
          })
          .select("id, name, email")
          .single();

        if (insErr) {
          console.error("Errore creazione client:", insErr);
          showMessage("Impossibile creare il profilo cliente.", "error");
          return;
        }

        data = inserted;
      }

      // 3) Salviamo l'id del client
      currentClientId = data.id;

      // Se abbiamo già un nome e il campo è vuoto, lo pre-compiliamo
      if (clientNameInput && data.name) {
        clientNameInput.value = data.name;
      }
    } catch (err) {
      console.error(err);
      showMessage("Errore imprevisto sul profilo cliente.", "error");
    }
  }

  /* ---------- Availability da Supabase ---------- */
  async function loadAvailability(dateKey) {
    const { data, error } = await supa
      .from("availability")
      .select("id, time")
      .eq("date", dateKey)
      .order("time", { ascending: true });

    if (error) {
      console.error(error);
      showMessage("Errore caricamento disponibilità.", "error");
      return [];
    }

    return data || [];
  }

  async function renderSlots(dateKey) {
    slotList.innerHTML = "";
    const slots = await loadAvailability(dateKey);

    if (!slots.length) {
      const li = document.createElement("li");
      li.textContent = "Nessuna fascia disponibile.";
      slotList.appendChild(li);
      return;
    }

    slots.forEach((slot) => {
      const li = document.createElement("li");
      li.innerHTML = `Ore <span>${slot.time}</span>`;
      const btn = document.createElement("button");
      btn.textContent = "Prenota";
      btn.addEventListener("click", () => selectSlot(slot, dateKey));
      li.appendChild(btn);
      slotList.appendChild(li);
    });
  }

  /* ---------- Selezione slot ---------- */
  function selectSlot(slot, dateKey) {
    selectedSlot = slot.time;
    selectedSlotId = slot.id;
    selectedDate = dateKey;
    bookingForm.style.display = "block";
    window.scrollTo({ top: bookingForm.offsetTop, behavior: "smooth" });
  }

  /* ---------- Logout ---------- */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const ok = await openModal({
        title: "Logout",
        message: "Vuoi uscire dall'area clienti?",
        showCancel: true,
      });

      if (!ok) return;

      await supa.auth.signOut();
      window.location.href = "login.html";
    });
  }

  /* ---------- Conferma prenotazione ---------- */
  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener("click", async () => {
      const name = (clientNameInput.value || "").trim();

      if (!name) {
        showMessage("Inserisci il tuo nome.", "error");
        return;
      }
      if (!selectedDate || !selectedSlot || !selectedSlotId) {
        showMessage("Seleziona una fascia oraria.", "error");
        return;
      }
      if (!currentClientId) {
        showMessage("Profilo cliente non trovato.", "error");
        return;
      }

      try {
        // Aggiorno il nome del cliente (così lo salviamo)
        await supa
          .from("clients")
          .update({ name })
          .eq("id", currentClientId);

        // Inserisci prenotazione
        const { error: bookErr } = await supa.from("bookings").insert({
          client_id: currentClientId,
          date: selectedDate,
          time: selectedSlot,
          notes: null,
          // barber_id: null // opzionale, se vuoi associarlo più avanti
        });

        if (bookErr) {
          console.error("Errore prenotazione:", bookErr);
          showMessage("Errore durante la prenotazione.", "error");
          return;
        }

        // Rimuovi disponibilità
        const { error: delErr } = await supa
          .from("availability")
          .delete()
          .eq("id", selectedSlotId);

        if (delErr) {
          console.error("Errore rimozione fascia:", delErr);
        }

        await openModal({
          title: "Prenotazione confermata",
          message: `Hai prenotato alle ${selectedSlot}!`,
        });

        bookingForm.style.display = "none";
        clientNameInput.value = "";
        await renderSlots(selectedDate);
      } catch (err) {
        console.error(err);
        showMessage("Errore imprevisto durante la prenotazione.", "error");
      }
    });
  }

  /* ---------- INIT BOOKING PAGE ---------- */
  (async function init() {
    const user = await requireAuth();
    if (!user) return;

    // Assicura che esista il record nella tabella clients
    await ensureClientProfile();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayKey = `${yyyy}-${mm}-${dd}`;

    datePicker.value = todayKey;
    await renderSlots(todayKey);

    datePicker.addEventListener("change", async () => {
      bookingForm.style.display = "none";
      await renderSlots(datePicker.value);
    });
  })();
})();
