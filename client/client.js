/* ==========================================
   client.js
   Login cliente + Prenotazioni
   ========================================== */

/* ---------- Sessione ---------- */
const CLIENT_SESSION_KEY = "clientPhone";

function setClientLogged(phone) {
    sessionStorage.setItem(CLIENT_SESSION_KEY, phone);
}
function getClientPhone() {
    return sessionStorage.getItem(CLIENT_SESSION_KEY);
}
function clearClientSession() {
    sessionStorage.removeItem(CLIENT_SESSION_KEY);
}

/* ---------- OTP Simulation ---------- */
let generatedOtp = null;
let tempPhone = null;

function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/* =========================================================
   SEZIONE LOGIN CLIENTE (login.html)
   ========================================================= */
(function initLogin() {
    const phoneInput = document.getElementById("phoneInput");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const otpDisplay = document.getElementById("otpDisplay");
    const otpInput = document.getElementById("otpInput");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const backBtn = document.getElementById("backBtn");

    const stepPhone = document.getElementById("step-phone");
    const stepOtp = document.getElementById("step-otp");

    if (!sendOtpBtn || !verifyOtpBtn) return; // Non siamo nella pagina di login

    // Step 1: invia OTP
    sendOtpBtn.addEventListener("click", () => {
        const phone = (phoneInput.value || "").trim();
        if (!phone) {
            alert("Inserisci un numero di telefono valido.");
            return;
        }
        generatedOtp = generateOtp();
        tempPhone = phone;
        otpDisplay.textContent = generatedOtp;
        stepPhone.classList.remove("active");
        stepOtp.classList.add("active");
    });

    // Step 2: verifica OTP
    verifyOtpBtn.addEventListener("click", () => {
        const entered = (otpInput.value || "").trim();
        if (entered === generatedOtp) {
            setClientLogged(tempPhone);
            alert("Accesso effettuato con successo!");
            window.location.href = "booking.html";
        } else {
            alert("Codice errato. Riprova.");
        }
    });

    // Torna indietro
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            stepOtp.classList.remove("active");
            stepPhone.classList.add("active");
        });
    }
})();

/* =========================================================
   SEZIONE PRENOTAZIONI (booking.html)
   ========================================================= */
(function initBookingPage() {
    const datePicker = document.getElementById("datePicker");
    const slotList = document.getElementById("slotList");
    const bookingForm = document.getElementById("bookingForm");
    const clientNameInput = document.getElementById("clientName");
    const confirmBookingBtn = document.getElementById("confirmBookingBtn");
    const logoutBtn = document.getElementById("logoutClientBtn");

    if (!datePicker || !slotList) return; // Non siamo nella pagina di prenotazione

    const phone = getClientPhone();
    if (!phone) {
        window.location.href = "login.html";
        return;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearClientSession();
            window.location.href = "login.html";
        });
    }

    /* ---------- Gestione disponibilità ---------- */
    function loadAvailabilityFor(dateKey) {
        const availability = getAvailability();
        return availability[dateKey] || [];
    }
    function saveAvailabilityFor(dateKey, slots) {
        const availability = getAvailability();
        availability[dateKey] = slots;
        saveAvailability(availability);
    }

    /* ---------- Gestione prenotazioni ---------- */
    function loadBookingsFor(dateKey) {
        const bookings = getBookings();
        return bookings[dateKey] || [];
    }
    function saveBookingsFor(dateKey, list) {
        const bookings = getBookings();
        bookings[dateKey] = list;
        saveBookings(bookings);
    }

    /* ---------- Rendering slot disponibili ---------- */
    function renderSlots(dateKey) {
        const slots = loadAvailabilityFor(dateKey).slice().sort();
        slotList.innerHTML = "";

        if (slots.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Nessuna fascia disponibile per questa data.";
            slotList.appendChild(li);
            return;
        }

        slots.forEach((time) => {
            const li = document.createElement("li");
            li.innerHTML = `Ore <span>${time}</span>`;
            const btn = document.createElement("button");
            btn.textContent = "Prenota";
            btn.addEventListener("click", () => selectSlot(time, dateKey));
            li.appendChild(btn);
            slotList.appendChild(li);
        });
    }

    /* ---------- Selezione slot ---------- */
    let selectedSlot = null;
    let selectedDate = null;

    function selectSlot(time, dateKey) {
        selectedSlot = time;
        selectedDate = dateKey;
        bookingForm.style.display = "block";
        window.scrollTo({ top: bookingForm.offsetTop, behavior: "smooth" });
    }

    /* ---------- Conferma prenotazione ---------- */
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener("click", () => {
            const name = (clientNameInput.value || "").trim();
            if (!name) {
                alert("Inserisci il tuo nome.");
                return;
            }
            if (!selectedDate || !selectedSlot) {
                alert("Seleziona una fascia oraria prima di confermare.");
                return;
            }

            // Aggiorna prenotazioni
            const currentBookings = loadBookingsFor(selectedDate);
            currentBookings.push({
                time: selectedSlot,
                name: name,
                phone: phone
            });
            saveBookingsFor(selectedDate, currentBookings);

            // Rimuove la fascia oraria dalle disponibilità
            const currentAvail = loadAvailabilityFor(selectedDate).filter(
                (t) => t !== selectedSlot
            );
            saveAvailabilityFor(selectedDate, currentAvail);

            alert("Prenotazione confermata!");
            clientNameInput.value = "";
            bookingForm.style.display = "none";
            renderSlots(selectedDate);
        });
    }

    /* ---------- Data iniziale ---------- */
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayKey = `${yyyy}-${mm}-${dd}`;
    datePicker.value = todayKey;

    renderSlots(todayKey);

    datePicker.addEventListener("change", () => {
        renderSlots(datePicker.value);
        bookingForm.style.display = "none";
    });
})();
