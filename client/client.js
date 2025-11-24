/* ==========================================
   client.js - Supabase Email OTP + Bookings DB
   ========================================== */

const SUPABASE_URL = "https://osezloxbxmifcdrcxzfw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZXpsb3hieG1pZmNkcmN4emZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDk3MjcsImV4cCI6MjA3OTQ4NTcyN30.ylLZaZV3ubc-TWNqIjJzH3-w4oNsmIRmK-4QCJhqyqQ";

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================================================
   LOGIN CLIENTE (email OTP)
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
          // emailRedirectTo: "https://superkebab00.github.io/BeshBooking/client/booking.html"
        },
      });

      if (error) {
        showMessage(error.message, "error");
        return;
      }

      openModal({
        title: "Email inviata",
        message:
          "Ti abbiamo inviato un link di accesso. Controlla la tua casella.",
      });
    } catch (err) {
      console.error(err);
      showMessage("Errore imprevisto.", "error");
    }
  });

  // Se già loggato, redirect diretto
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

  if (!datePicker || !slotList) return;

  let currentUser = null;
  let currentClientId = null;

  let selectedSlot = null;
  let selectedSlotId = null;
  let selectedDate = null;

  /* ---------- Autenticazione ---------- */
  async function requireAuth() {
    const { data } = await supa.auth.getUser();
    if (!data || !data.user) {
      window.location.href = "login.html";
      return null;
    }
    currentUser = data.user;
    return currentUser;
  }

  /* ---------- Recupero profilo cliente ---------- */
  async function loadClientProfile() {
    const { data } = await supa
      .from("clients")
      .select("id, name")
      .eq("auth_id", currentUser.id)
      .maybeSingle();

    if (data) {
      currentClientId = data.id;
      if (clientNameInput && data.name) clientNameInput.value = data.name;
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

      if (!name) return showMessage("Inserisci il tuo nome.", "error");
      if (!selectedDate || !selectedSlot || !selectedSlotId)
        return showMessage("Seleziona una fascia oraria.", "error");
      if (!currentClientId)
        return showMessage("Profilo cliente non trovato.", "error");

      try {
        // Inserisci prenotazione
        const { error: bookErr } = await supa.from("bookings").insert({
          client_id: currentClientId,
          date: selectedDate,
          time: selectedSlot,
          notes: null,
        });

        if (bookErr) {
          showMessage("Errore prenotazione.", "error");
          return;
        }

        // Rimuovi disponibilità
        await supa.from("availability").delete().eq("id", selectedSlotId);

        openModal({
          title: "Prenotazione confermata",
          message: `Hai prenotato alle ${selectedSlot}!`,
        });

        bookingForm.style.display = "none";
        clientNameInput.value = "";
        await renderSlots(selectedDate);
      } catch (err) {
        console.error(err);
        showMessage("Errore imprevisto.", "error");
      }
    });
  }

  /* ---------- INIT ---------- */
  (async function init() {
    const user = await requireAuth();
    if (!user) return;

    await loadClientProfile();

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
