/* ==========================================
   barber.js - versione aggiornata minimal
   Login + Dashboard (tabs, disponibilità, prenotazioni, impostazioni)
   Richiede: storage.js + ui.js
   ========================================== */

/* ---------- Helpers UI ---------- */
function _msgOk(t) { showMessage(t, "success"); }
function _msgErr(t) { showMessage(t, "error"); }

/* ---------- Date helpers ---------- */
function toKey(dateStr) { return dateStr; }
function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---------- Sessione ---------- */
const SESSION_KEY = "barberLoggedIn";
function setLoggedIn(v) { sessionStorage.setItem(SESSION_KEY, v ? "1" : "0"); }
function isLoggedIn() { return sessionStorage.getItem(SESSION_KEY) === "1"; }

/* =========================================================
   LOGIN BARBIERE
   ========================================================= */
(function initLoginPage() {
    const pwdInput = document.getElementById("passwordInput");
    const btn = document.getElementById("loginBtn");
    const note = document.getElementById("firstTimeNote");

    if (!pwdInput || !btn) return;

    const storedHash = getBarberPassword();
    if (!storedHash && note) {
        note.style.display = "block";
        btn.textContent = "Imposta password";
    }

    btn.addEventListener("click", async () => {
        const pwd = (pwdInput.value || "").trim();
        if (!pwd) return _msgErr("Inserisci una password.");

        const currentHash = getBarberPassword();
        const userHash = await hashPassword(pwd);

        if (!currentHash) {
            saveBarberPassword(userHash);
            _msgOk("Password impostata.");
            setLoggedIn(true);
            window.location.href = "dashboard.html";
            return;
        }

        if (userHash === currentHash) {
            _msgOk("Accesso eseguito.");
            setLoggedIn(true);
            window.location.href = "dashboard.html";
        } else {
            _msgErr("Password errata.");
        }
    });
})();

/* =========================================================
   DASHBOARD BARBIERE
   ========================================================= */
(function initDashboard() {
    const headerLogout = document.getElementById("logoutBtn");
    const tabsBar = document.querySelector(".barber-tabs");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const sections = document.querySelectorAll(".tab-section");

    const availDate = document.getElementById("availDate");
    const availTime = document.getElementById("availTime");
    const addSlotBtn = document.getElementById("addSlotBtn");
    const availList = document.getElementById("availList");

    const bookingDate = document.getElementById("bookingDate");
    const bookingList = document.getElementById("bookingList");

    const newPassword = document.getElementById("newPassword");
    const changePwdBtn = document.getElementById("changePwdBtn");

    if (!tabsBar) return;

    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    /* ---------- Logout ---------- */
    if (headerLogout) {
        headerLogout.addEventListener("click", () => {
            openModal({
                title: "Logout",
                message: "Vuoi davvero uscire?",
                showCancel: true
            }).then(ok => {
                if (ok) {
                    setLoggedIn(false);
                    window.location.href = "login.html";
                }
            });
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

    /* ---------- Availability ---------- */
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
            li.textContent = "Nessuna fascia disponibile.";
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
                openModal({
                    title: "Rimuovere fascia?",
                    message: `Vuoi rimuovere la fascia delle ${time}?`,
                    showCancel: true
                }).then(ok => {
                    if (!ok) return;

                    const updated = loadAvailabilityFor(dateKey).filter((t) => t !== time);
                    saveAvailabilityFor(dateKey, updated);
                    _msgOk("Fascia rimossa.");
                    renderAvailList(dateKey);
                });
            });

            li.appendChild(left);
            li.appendChild(removeBtn);
            availList.appendChild(li);
        });
    }

    function initAvailability() {
        if (availDate) {
            availDate.value = todayKey();
            renderAvailList(availDate.value);
            availDate.addEventListener("change", () => renderAvailList(availDate.value));
        }

        if (addSlotBtn) {
            addSlotBtn.addEventListener("click", () => {
                const d = availDate ? toKey(availDate.value) : todayKey();
                const t = availTime ? availTime.value.trim() : "";

                if (!d || !t) return _msgErr("Seleziona data e orario.");

                if (!/^\d{2}:\d{2}$/.test(t)) return _msgErr("Formato orario non valido.");

                const current = loadAvailabilityFor(d);
                if (current.includes(t)) return _msgErr("Fascia già presente.");

                current.push(t);
                saveAvailabilityFor(d, current);
                _msgOk("Fascia aggiunta.");
                renderAvailList(d);
                availTime.value = "";
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
            li.textContent = "Nessuna prenotazione.";
            bookingList.appendChild(li);
            return;
        }

        list.forEach((bk, idx) => {
            const li = document.createElement("li");
            const left = document.createElement("div");

            left.innerHTML = `Ore <span>${bk.time}</span> — ${bk.name} (${bk.phone})`;

            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Annulla";

            cancelBtn.addEventListener("click", () => {
                openModal({
                    title: "Annullare prenotazione?",
                    message: `Vuoi annullare la prenotazione delle ${bk.time}?`,
                    showCancel: true
                }).then(ok => {
                    if (!ok) return;

                    const now = loadBookingsFor(dateKey);
                    now.splice(idx, 1);
                    saveBookingsFor(dateKey, now);

                    const avail = loadAvailabilityFor(dateKey);
                    if (!avail.includes(bk.time)) {
                        avail.push(bk.time);
                        saveAvailabilityFor(dateKey, avail);
                    }

                    _msgOk("Prenotazione annullata.");
                    renderBookingList(dateKey);
                    if (availDate && availDate.value === dateKey) renderAvailList(dateKey);
                });
            });

            li.appendChild(left);
            li.appendChild(cancelBtn);
            bookingList.appendChild(li);
        });
    }

    function initBookings() {
        if (bookingDate) {
            bookingDate.value = todayKey();
            renderBookingList(bookingDate.value);
            bookingDate.addEventListener("change", () => {
                renderBookingList(bookingDate.value);
            });
        }
    }

    /* ---------- Impostazioni ---------- */
    function initSettings() {
        if (changePwdBtn) {
            changePwdBtn.addEventListener("click", async () => {
                const pwd = newPassword.value.trim();
                if (!pwd) return _msgErr("Inserisci una nuova password.");

                const h = await hashPassword(pwd);
                saveBarberPassword(h);
                newPassword.value = "";
                _msgOk("Password aggiornata.");
            });
        }
    }

    /* ---------- Init ---------- */
    initAvailability();
    initBookings();
    initSettings();
})();
