/* ==========================================
   ui.js
   Funzioni UI riutilizzabili
   ========================================== */

/**
 * Show temporary alert message
 * @param {string} message 
 * @param {"success" | "error" | "info"} type 
 */
function showMessage(message, type = "info") {
    const msg = document.createElement("div");
    msg.className = `alert-message ${type}`;
    msg.innerText = message;
    document.body.appendChild(msg);

    setTimeout(() => {
        msg.classList.add("visible");
    }, 10);

    setTimeout(() => {
        msg.classList.remove("visible");
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

/**
 * Show confirmation popup
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
function confirmPopup(text) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "popup-overlay";

        const box = document.createElement("div");
        box.className = "popup-box";

        const p = document.createElement("p");
        p.textContent = text;

        const btns = document.createElement("div");
        btns.className = "popup-buttons";

        const yes = document.createElement("button");
        yes.textContent = "Conferma";
        yes.className = "btn confirm";

        const no = document.createElement("button");
        no.textContent = "Annulla";
        no.className = "btn cancel";

        yes.onclick = () => { overlay.remove(); resolve(true); };
        no.onclick = () => { overlay.remove(); resolve(false); };

        btns.appendChild(yes);
        btns.appendChild(no);
        box.appendChild(p);
        box.appendChild(btns);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    });
}

/* ===========================
   UI Style Injection
   (CSS per i popup & alert)
   =========================== */

const uiStyles = `
.alert-message {
    position: fixed;
    top: 20px;
    right: -250px;
    padding: 12px 20px;
    border-radius: 6px;
    color: #fff;
    font-size: 0.9rem;
    opacity: 0;
    transition: all .3s ease;
    z-index: 9999;
}
.alert-message.visible {
    right: 20px;
    opacity: 1;
}
.alert-message.success { background-color: #28a745; }
.alert-message.error { background-color: #dc3545; }
.alert-message.info { background-color: #007bff; }

.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
}
.popup-box {
    background: #111;
    border: 1px solid #d4af37;
    padding: 25px;
    border-radius: 8px;
    width: 300px;
    text-align: center;
    color: #fff;
    font-family: var(--font-body, sans-serif);
}
.popup-buttons {
    margin-top: 20px;
    display: flex;
    justify-content: space-around;
}
.popup-buttons .btn {
    padding: 8px 20px;
    border: none;
    cursor: pointer;
    border-radius: 5px;
}
.btn.confirm {
    background: #d4af37;
    color: #000;
}
.btn.cancel {
    background: #444;
    color: #fff;
}
`;

const styleTag = document.createElement("style");
styleTag.innerHTML = uiStyles;
document.head.appendChild(styleTag);
