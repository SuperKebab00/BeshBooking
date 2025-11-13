/* ==========================================
   barber.js
   Login barbiere + Dashboard (tabs, disponibilità, prenotazioni, impostazioni)
   Richiede: ../scripts/storage.js (hash + localStorage)
             ../scripts/ui.js (solo in dashboard: messaggi/popup)
   ========================================== */

/* ---------- Helpers UI (fallback se ui.js non è presente) ---------- */
function _hasShowMessage() {
  return typeof showMessage === "function";
}
function _msgOk(t) {
  _hasShowMessage() ? showMessage(t, "success") : alert(t);
}
function _msgErr(t) {
  _hasShowMessage() ? showMessage(t, "error") : alert(t);
}

/* ---------- Date helpers ---------- */
function toKey(dateStr) {
  // dateStr formati accettati: "YYYY-MM-DD"
  return dateStr;
}
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------- Sessione ---------- */
const SESSION_KEY = "barberLoggedIn";
function setLoggedIn(v) {
  sessionStorage.setItem(SESSION_KEY, v ? "1" : "0");
}
function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

/* =========================================================
   SEZIONE LOGIN (pagina: barber/login.html)
   ========================================================= */
(function initLoginPage() {
  const pwdInput = document.getElementById("passwordInput");
  const btn = document.getElementById("loginBtn");
  const note = document.getElementById("firstTimeNote");

  if (!pwdInput || !btn) return; // Non siamo nella pagina di login

  // First time? Non esiste password salvata
  const storedHash = getBarberPassword();
  if (!storedHash && note) {
    note.style.display = "block";
    btn.textContent = "Imposta password";
  }

  btn.addEventListener("click", async () => {
    const pwd = (pwdInput.value || "").trim();
    if (!pwd) {
      _msgErr("Inserisci una password.");
      return;
    }

    const currentHash = getBarberPassword();
    const userHash = await hashPassword(pwd);

    if (!currentHash) {
      // Prima impostazione password
      saveBarberPassword(userHash);
      _msgOk("Password impostata con successo.");
      setLoggedIn(true);
      window.location.href = "dashboard.html";
      return;
    }

    // Verifica password
    if (userHash === currentHash) {
      setLoggedIn(true);
      _msgOk("Accesso eseguito.");
      window.location.href = "dashboard.html";
    } else {
      _msgErr("Password errata.");
    }
  });
})();

/* =========================================================
   SEZIONE DASHBOARD (pagina: barber/dashboard.html)
   ========================================================= */
(function initDashboard() {
  const headerLogout = document.getElementById("logoutBtn");
  const tabsBar = document.querySelector(".barber-tabs");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".tab-section");

  // Elementi Disponibilità
  const availDate = document.getElementById("availDate");
  const availTime = document.getElementById("availTime");
  const addSlotBtn = document.getElementById("addSlotBtn");
  const availList = document.getElementById("availList");

  // Elementi Prenotazioni
  const bookingDate = document.getElementById("bookingDate");
  const bookingList = document.getElementById("bookingList");

  // Elementi Impostazioni
  const newPassword = document.getElementById("newPassword");
  const changePwdBtn = document.getElementById("changePwdBtn");

  // Se non siamo nella dashboard, esci
  if (!tabsBar) return;

  // Protezione pagina: richiede login
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  /* ---------- Logout ---------- */
  if (headerLogout) {
    headerLogout.addEventListener("click", () => {
      setLoggedIn(false);
      window.location.href = "login.html";
    });
  }

  /* ---------- Tabs ---------- */
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      btn.classList.add("active");
      const id = btn.dataset.tab;
      const section = document.getElementById(`tab-${id}`);
      if (section) section.classList.add("active");
    });
  });

  /* ---------- Disponibilità ---------- */
  function loadAvailabilityFor(dateKey) {
    const availability = getAvailability();
    return availability[dateKey] || [];
  }

  function saveAvailabilityFor(dateKey, slots) {
    const availability = getAvailability();
    availability[dateKey] = slots;
    saveAvailability(availability);
  }

  function renderAvailList(dateKey) {
    if (!availList) return;
    const slots = loadAvailabilityFor(dateKey).slice().sort();
    availList.innerHTML = "";

    if (slots.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nessuna fascia disponibile per questa data.";
      availList.appendChild(li);
      return;
    }

    slots.forEach((time) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.innerHTML = `Fascia: <span>${time}</span>`;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Rimuovi";
      removeBtn.addEventListener("click", async () => {
        const ok = typeof confirmPopup === "function"
          ? await confirmPopup(`Rimuovere la fascia ${time}?`)
          : confirm(`Rimuovere la fascia ${time}?`);
        if (!ok) return;

        const current = loadAvailabilityFor(dateKey).filter((t) => t !== time);
        saveAvailabilityFor(dateKey, current);
        _msgOk("Fascia rimossa.");
        renderAvailList(dateKey);
      });

      li.appendChild(left);
      li.appendChild(removeBtn);
      availList.appendChild(li);
    });
  }

  function initAvailability() {
    if (availDate) {
      availDate.value = todayKey();
      renderAvailList(toKey(availDate.value));
      availDate.addEventListener("change", () => {
        renderAvailList(toKey(availDate.value));
      });
    }

    if (addSlotBtn) {
      addSlotBtn.addEventListener("click", () => {
        const d = (availDate && availDate.value) ? toKey(availDate.value) : todayKey();
        const t = (availTime && availTime.value) ? availTime.value : "";

        if (!d || !t) {
          _msgErr("Seleziona data e orario.");
          return;
        }

        // Validazione semplice formato HH:MM
        if (!/^\d{2}:\d{2}$/.test(t)) {
          _msgErr("Orario non valido. Usa formato HH:MM.");
          return;
        }

        const current = loadAvailabilityFor(d);
        if (current.includes(t)) {
          _msgErr("Questa fascia è già presente.");
          return;
        }

        current.push(t);
        saveAvailabilityFor(d, current);
        _msgOk("Fascia aggiunta.");
        renderAvailList(d);
        if (availTime) availTime.value = "";
      });
    }
  }

  /* ---------- Prenotazioni ---------- */
  function loadBookingsFor(dateKey) {
    const bookings = getBookings();
    return bookings[dateKey] || [];
  }

  function saveBookingsFor(dateKey, list) {
    const bookings = getBookings();
    bookings[dateKey] = list;
    saveBookings(bookings);
  }

  function renderBookingList(dateKey) {
    if (!bookingList) return;
    const list = loadBookingsFor(dateKey).slice().sort((a, b) => a.time.localeCompare(b.time));
    bookingList.innerHTML = "";

    if (list.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nessuna prenotazione per questa data.";
      bookingList.appendChild(li);
      return;
    }

    list.forEach((bk, idx) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const name = bk.name || "Cliente";
      const phone = bk.phone || "-";
      left.innerHTML = `Ore <span>${bk.time}</span> — ${name} (${phone})`;

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Annulla";
      cancelBtn.addEventListener("click", async () => {
        const ok = typeof confirmPopup === "function"
          ? await confirmPopup(`Annullare la prenotazione delle ${bk.time}?`)
          : confirm(`Annullare la prenotazione delle ${bk.time}?`);
        if (!ok) return;

        // Rimuovi prenotazione
        const now = loadBookingsFor(dateKey);
        now.splice(idx, 1);
        saveBookingsFor(dateKey, now);

        // Reintegra lo slot nella disponibilità
        const avail = loadAvailabilityFor(dateKey);
        if (!avail.includes(bk.time)) {
          avail.push(bk.time);
          saveAvailabilityFor(dateKey, avail);
        }

        _msgOk("Prenotazione annullata e fascia resa disponibile.");
        renderBookingList(dateKey);
        // Aggiorna elenco disponibilità se la data coincide con quella selezionata nella tab
        if (availDate && availDate.value === dateKey) renderAvailList(dateKey);
      });

      li.appendChild(left);
      li.appendChild(cancelBtn);
      bookingList.appendChild(li);
    });
  }

  function initBookings() {
    if (bookingDate) {
      bookingDate.value = todayKey();
      renderBookingList(toKey(bookingDate.value));
      bookingDate.addEventListener("change", () => {
        renderBookingList(toKey(bookingDate.value));
      });
    }
  }

  /* ---------- Impostazioni ---------- */
  function initSettings() {
    if (changePwdBtn) {
      changePwdBtn.addEventListener("click", async () => {
        const pwd = (newPassword && newPassword.value) ? newPassword.value.trim() : "";
        if (!pwd) {
          _msgErr("Inserisci una nuova password.");
          return;
        }
        const h = await hashPassword(pwd);
        saveBarberPassword(h);
        if (newPassword) newPassword.value = "";
        _msgOk("Password aggiornata con successo.");
      });
    }
  }

  // Init sezioni
  initAvailability();
  initBookings();
  initSettings();
})();
