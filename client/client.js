/* ==========================================
   client.js - versione aggiornata minimal
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
   LOGIN CLIENTE
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

    if (!sendOtpBtn || !verifyOtpBtn) return;

    /* Step 1 */
    sendOtpBtn.addEventListener("click", () => {
        const phone = phoneInput.value.trim();
        if (!phone) {
            showMessage("Inserisci un numero valido", "error");
            return;
        }

        generatedOtp = generateOtp();
        tempPhone = phone;

        otpDisplay.textContent = generatedOtp;

        stepPhone.classList.remove("active");
        stepOtp.classList.add("active");
    });

    /* Step 2 */
    verifyOtpBtn.addEventListener("click", () => {
        const entered = otpInput.value.trim();

        if (entered === generatedOtp) {
            setClientLogged(tempPhone);

            openModal({
                title: "Accesso effettuato",
                message: "Benvenuto!",
            }).then(() => {
                window.location.href = "booking.html";
            });

        } else {
            showMessage("Codice errato.", "error");
        }
    });

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            stepOtp.classList.remove("active");
            stepPhone.classList.add("active");
        });
    }
})();

/* =========================================================
   PRENOTAZIONI CLIENTE
   ========================================================= */
(function initBookingPage() {
    const datePicker = document.getElementById("datePicker");
    const slotList = document.getElementById("slotList");
    const bookingForm = document.getElementById("bookingForm");
    const clientNameInput = document.getElementById("clientName");
    const confirmBookingBtn = document.getElementById("confirmBookingBtn");
    const logoutBtn = document.getElementById("logoutClientBtn");

    if (!datePicker || !slotList) return;

    const phone = getClientPhone();
    if (!phone) {
        window.location.href = "login.html";
        return;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            openModal({
                title: "Logout",
                message: "Vuoi uscire?",
                showCancel: true
            }).then(ok => {
                if (ok) {
                    clearClientSession();
                    window.location.href = "login.html";
                }
            });
        });
    }

    /* Helpers */
    function loadAvailabilityFor(dateKey) {
        return getAvailability()[dateKey] || [];
    }
    function saveAvailabilityFor(dateKey, slots) {
        const a = getAvailability();
        a[dateKey] = slots;
        saveAvailability(a);
    }

    function loadBookingsFor(dateKey) {
        return getBookings()[dateKey] || [];
    }
    function saveBookingsFor(dateKey, list) {
        const b = getBookings();
        b[dateKey] = list;
        saveBookings(b);
    }

    /* Rendering slot */
    function renderSlots(dateKey) {
        const slots = loadAvailabilityFor(dateKey).slice().sort();
        slotList.innerHTML = "";

        if (slots.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Nessuna fascia disponibile.";
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

    /* Prenotazione */
    let selectedSlot = null;
    let selectedDate = null;

    function selectSlot(time, dateKey) {
        selectedSlot = time;
        selectedDate = dateKey;
        bookingForm.style.display = "block";

        window.scrollTo({
            top: bookingForm.offsetTop,
            behavior: "smooth"
        });
    }

    /* Conferma */
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener("click", () => {
            const name = clientNameInput.value.trim();

            if (!name)
                return showMessage("Inserisci il tuo nome.", "error");

            if (!selectedSlot)
                return showMessage("Seleziona una fascia prima.", "error");

            /* Aggiorna prenotazioni */
            const bk = loadBookingsFor(selectedDate);
            bk.push({
                time: selectedSlot,
                name,
                phone
            });
            saveBookingsFor(selectedDate, bk);

            /* Rimuovi fascia */
            const avail = loadAvailabilityFor(selectedDate)
                .filter(t => t !== selectedSlot);
            saveAvailabilityFor(selectedDate, avail);

            openModal({
                title: "Prenotazione confermata",
                message: `Hai prenotato alle ${selectedSlot}.`
            });

            clientNameInput.value = "";
            bookingForm.style.display = "none";
            renderSlots(selectedDate);
        });
    }

    /* Inizializzazione data */
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
