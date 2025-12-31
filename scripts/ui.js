/* ==========================================
   ui.js � Funzioni UI minimal Black/White
   ========================================== */

/**
 * ALERT MINIMAL (in alto a destra)
 */
function showMessage(message, type = "info") {
    const msg = document.createElement("div");
    msg.className = `alert-message minimal ${type}`;
    msg.innerText = message;
    document.body.appendChild(msg);

    requestAnimationFrame(() => {
        msg.classList.add("visible");
    });

    setTimeout(() => {
        msg.classList.remove("visible");
        setTimeout(() => msg.remove(), 300);
    }, 2500);
}

/* ==========================================
   MODAL GLOBALE � openModal()
   ========================================== */

const appModal = document.getElementById("appModal");
const appModalTitle = document.getElementById("appModalTitle");
const appModalMessage = document.getElementById("appModalMessage");
const appModalOk = document.getElementById("appModalOk");
const appModalCancel = document.getElementById("appModalCancel");

let appModalResolve = null;

function openModal(options) {
    const {
        title = "Avviso",
        message = "",
        showCancel = false
    } = options || {};

    if (!appModal) {
        console.warn("Modal element not found");
        return Promise.resolve(false);
    }

    appModalTitle.textContent = title;
    appModalMessage.textContent = message;

    appModalCancel.style.display = showCancel ? "inline-flex" : "none";

    appModal.classList.add("is-visible");

    return new Promise(resolve => {
        appModalResolve = resolve;
    });
}

function closeModal(result) {
    if (!appModal) return;
    appModal.classList.remove("is-visible");

    if (typeof appModalResolve === "function") {
        appModalResolve(result);
        appModalResolve = null;
    }
}

if (appModalOk) {
    appModalOk.addEventListener("click", () => closeModal(true));
}
if (appModalCancel) {
    appModalCancel.addEventListener("click", () => closeModal(false));
}
if (appModal) {
    appModal.addEventListener("click", (e) => {
        if (e.target === appModal) closeModal(false);
    });
}

/* ==========================================
   inject minimal CSS (alert e fallback)
   ========================================== */

const uiStyles = `
/* ALERT MINIMAL */
.alert-message.minimal {
    position: fixed;
    top: 22px;
    right: -260px;
    padding: 12px 20px;
    border-radius: 999px;
    background: #ffffff;
    color: #000;
    font-size: 0.85rem;
    letter-spacing: 0.03em;
    box-shadow: 0 14px 40px rgba(0,0,0,0.45);
    opacity: 0;
    transition: right 0.3s ease, opacity 0.3s ease;
    z-index: 9999;
}
.alert-message.minimal.visible {
    right: 22px;
    opacity: 1;
}
.alert-message.minimal.error {
    background: #ff3333;
    color: #fff;
}
.alert-message.minimal.success {
    background: #ffffff;
    color: #000;
}
.alert-message.minimal.info {
    background: #e6e6e6;
    color: #000;
}
`;
const styleTag = document.createElement("style");
styleTag.innerHTML = uiStyles;
document.head.appendChild(styleTag);
