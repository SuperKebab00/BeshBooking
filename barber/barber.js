/* ==========================================
   barber.js - Supabase Auth + Availability/Bookings
   ========================================== */

const SUPABASE_URL = "https://qkdgjmwdxtosqxmnfmsb.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGdqbXdkeHRvc3F4bW5mbXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODU2NTQsImV4cCI6MjA3OTU2MTY1NH0.t7rAZuU3tGeKE7AYLkpFZysl5antY7XTBdPOR1DELYU";
const supaBarber = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* Helpers */
function _msgOk(t) {
  showMessage(t, "success");
}
function _msgErr(t) {
  showMessage(t, "error");
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

/* =========================================================
   LOGIN BARBER
========================================================= */
(function initBarberLoginPage() {
  const emailInput = document.getElementById("barberEmailInput");
  const btn = document.getElementById("barberLoginBtn");

  if (!emailInput || !btn) return;

  btn.addEventListener("click", async () => {
    const email = (emailInput.value || "").trim();
    if (!email) {
      _msgErr("Inserisci una email valida.");
      return;
    }

    try {
      const { error } = await supaBarber.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
           emailRedirectTo: "https://superkebab00.github.io/BeshBooking/barber/dashboard.html"
        },
      });

      if (error) {
        console.error(error);
        _msgErr(error.message || "Errore durante l'invio dell'email.");
        return;
      }

      openModal({
        title: "Controlla la tua email",
        message:
          "Ti abbiamo inviato un link di accesso. Cliccalo per continuare.",
        showCancel: false,
      });
    } catch (e) {
      console.error(e);
      _msgErr("Errore imprevisto durante il login.");
    }
  });

  supaBarber.auth.getUser().then(async ({ data }) => {
    if (data && data.user) {
      const isBarber = await checkIsBarber(data.user.id);
      if (isBarber) window.location.href = "dashboard.html";
    }
  });
})();

/* Verifica ruolo barbiere */
async function checkIsBarber(authUserId) {
  const { data, error } = await supaBarber
    .from("clients")
    .select("is_barber")
    .eq("auth_id", authUserId)
    .maybeSingle();

  if (error) return false;
  return data && data.is_barber;
}

/* =========================================================
   DASHBOARD BARBIERE
========================================================= */
(function initBarberDashboard() {
  const tabsBar = document.querySelector(".barber-tabs");
  const headerLogout = document.getElementById("logoutBtn");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".tab-section");

  const availDate = document.getElementById("availDate");
  const availTime = document.getElementById("availTime");
  const addSlotBtn = document.getElementById("addSlotBtn");
  const availList = document.getElementById("availList");

  const bookingDate = document.getElementById("bookingDate");
  const bookingList = document.getElementById("bookingList");

  const changePwdBtn = document.getElementById("changePwdBtn");

  if (!tabsBar) return;

  let currentUser = null;

  async function requireBarberAuth() {
    const { data } = await supaBarber.auth.getUser();
    if (!data || !data.user) {
      window.location.href = "login.html";
      return null;
    }

    const isBarber = await checkIsBarber(data.user.id);
    if (!isBarber) {
      await openModal({
        title: "Accesso non autorizzato",
        message: "Questo account non è configurato come barbiere.",
      });
      window.location.href = "../index.html";
      return null;
    }

    currentUser = data.user;
    return currentUser;
  }

  /* Logout */
  if (headerLogout) {
    headerLogout.addEventListener("click", async () => {
      const ok = await openModal({
        title: "Logout",
        message: "Vuoi davvero uscire?",
        showCancel: true,
      });
      if (!ok) return;
      await supaBarber.auth.signOut();
      window.location.href = "login.html";
    });
  }

  /* Tabs */
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
      document
        .getElementById(`tab-${btn.dataset.tab}`)
        .classList.add("active");
    });
  });

  /* ---------------------------------------------------------
     AVAILABILITY - DB
  --------------------------------------------------------- */
  async function loadAvailability(dateKey) {
    const { data, error } = await supaBarber
      .from("availability")
      .select("id, time")
      .eq("date", dateKey)
      .eq("barber_id", currentUser.id)
      .order("time", { ascending: true });

    return error ? [] : data;
  }

  async function renderAvailList(dateKey) {
    availList.innerHTML = "";

    const slots = await loadAvailability(dateKey);

    if (!slots.length) {
      const li = document.createElement("li");
      li.textContent = "Nessuna fascia disponibile per questa data.";
      availList.appendChild(li);
      return;
    }

    slots.forEach((slot) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.innerHTML = `Fascia: <span>${slot.time}</span>`;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Rimuovi";
      removeBtn.addEventListener("click", async () => {
        const ok = await openModal({
          title: "Rimuovere fascia?",
          message: `Rimuovere la fascia delle ${slot.time}?`,
          showCancel: true,
        });
        if (!ok) return;

        await supaBarber.from("availability").delete().eq("id", slot.id);

        await renderAvailList(dateKey);
        _msgOk("Fascia rimossa.");
      });

      li.appendChild(left);
      li.appendChild(removeBtn);
      availList.appendChild(li);
    });
  }

  function initAvailability() {
    availDate.value = todayKey();
    renderAvailList(availDate.value);

    availDate.addEventListener("change", () => {
      renderAvailList(availDate.value);
    });

    addSlotBtn.addEventListener("click", async () => {
      const d = availDate.value;
      const t = (availTime.value || "").trim();

      if (!d || !t) return _msgErr("Inserisci data e orario.");

      if (!/^\d{2}:\d{2}$/.test(t))
        return _msgErr("Formato orario non valido (HH:MM).");

      const existing = await loadAvailability(d);
      if (existing.some((s) => s.time === t))
        return _msgErr("Questa fascia esiste già.");

      await supaBarber.from("availability").insert({
        date: d,
        time: t,
        barber_id: currentUser.id,
      });

      availTime.value = "";
      await renderAvailList(d);
      _msgOk("Aggiunta!");
    });
  }

  /* ---------------------------------------------------------
     BOOKINGS - DB (+ pagamento)
  --------------------------------------------------------- */
  async function loadBookings(dateKey) {
    const { data } = await supaBarber
      .from("bookings")
      .select("id, time, date, has_paid, amount_paid, clients(name, email)")
      .eq("date", dateKey)
      .order("time", { ascending: true });

    return data || [];
  }

  async function renderBookingList(dateKey) {
    bookingList.innerHTML = "";

    const list = await loadBookings(dateKey);

    if (!list.length) {
      const li = document.createElement("li");
      li.textContent = "Nessuna prenotazione per questa data.";
      bookingList.appendChild(li);
      return;
    }

    list.forEach((bk) => {
      const li = document.createElement("li");

      const left = document.createElement("div");
      const name = bk.clients?.name || "Cliente";
      const email = bk.clients?.email || "-";
      left.innerHTML = `Ore <span>${bk.time}</span> — ${name} (${email})`;

      /* --- BOX PAGAMENTO --- */
      const paymentBox = document.createElement("div");
      paymentBox.className = "payment-box";

      const paidCheckbox = document.createElement("input");
      paidCheckbox.type = "checkbox";
      paidCheckbox.checked = bk.has_paid;

      const amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.step = "0.01";
      amountInput.value = bk.amount_paid;

      const savePaymentBtn = document.createElement("button");
      savePaymentBtn.textContent = "Salva pagamento";
      savePaymentBtn.addEventListener("click", async () => {
        await supaBarber
          .from("bookings")
          .update({
            has_paid: paidCheckbox.checked,
            amount_paid: Number(amountInput.value),
          })
          .eq("id", bk.id);

        _msgOk("Pagamento aggiornato.");
      });

      paymentBox.appendChild(paidCheckbox);
      paymentBox.appendChild(amountInput);
      paymentBox.appendChild(savePaymentBtn);

      /* --- CANCELLAZIONE --- */
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Annulla";

      cancelBtn.addEventListener("click", async () => {
        const ok = await openModal({
          title: "Annullare?",
          message: `Annullare la prenotazione delle ${bk.time}?`,
          showCancel: true,
        });
        if (!ok) return;

        await supaBarber.from("bookings").delete().eq("id", bk.id);
        await supaBarber.from("availability").insert({
          date: dateKey,
          time: bk.time,
          barber_id: currentUser.id,
        });

        await renderBookingList(dateKey);
        await renderAvailList(dateKey);
        _msgOk("Prenotazione annullata.");
      });

      li.appendChild(left);
      li.appendChild(paymentBox);
      li.appendChild(cancelBtn);

      bookingList.appendChild(li);
    });
  }

  function initBookings() {
    bookingDate.value = todayKey();
    renderBookingList(bookingDate.value);
    bookingDate.addEventListener("change", () => {
      renderBookingList(bookingDate.value);
    });
  }

  /* ---------------------------------------------------------
     SETTINGS
  --------------------------------------------------------- */
  function initSettings() {
    if (changePwdBtn) {
      changePwdBtn.addEventListener("click", () => {
        openModal({
          title: "Impostazioni",
          message:
            "La gestione password avviene via email OTP su Supabase. In futuro possiamo aggiungere nome, telefono, foto profilo.",
        });
      });
    }
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  (async function init() {
    const user = await requireBarberAuth();
    if (!user) return;

    initAvailability();
    initBookings();
    initSettings();
  })();
})();
