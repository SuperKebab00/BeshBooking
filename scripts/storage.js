/* ==========================================
   storage.js
   Gestione dati + hashing password
   ========================================== */

/**
 * Hash password using SHA-256
 * @param {string} password 
 * @returns {Promise<string>} hashed password
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Get data from localStorage
 * @param {string} key 
 * @returns parsed value or null
 */
function getData(key) {
    const raw = localStorage.getItem(key);
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Save data to localStorage
 * @param {string} key 
 * @param {any} value 
 */
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/* ------------ Barber Password Management ------------ */

/** Get stored barber password hash */
function getBarberPassword() {
    return getData("barberPassword");
}

/** Save barber password hash */
function saveBarberPassword(hash) {
    saveData("barberPassword", hash);
}

/** Remove barber password */
function clearBarberPassword() {
    localStorage.removeItem("barberPassword");
}

/* ------------ Availability & Bookings ------------ */

/**
 * Get availability (returns object or empty)
 */
function getAvailability() {
    return getData("availability") || {};
}

/**
 * Save availability object
 */
function saveAvailability(availability) {
    saveData("availability", availability);
}

/**
 * Get bookings (returns object or empty)
 */
function getBookings() {
    return getData("bookings") || {};
}

/**
 * Save bookings object
 */
function saveBookings(bookings) {
    saveData("bookings", bookings);
}

/**
 * Clear all stored data (optional admin function)
 */
function clearAllData() {
    localStorage.removeItem("availability");
    localStorage.removeItem("bookings");
    localStorage.removeItem("barberPassword");
}

