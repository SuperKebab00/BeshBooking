Besh Barber – Booking System

Sistema di prenotazioni moderno e completamente frontend per barbershop, sviluppato in HTML, CSS e JavaScript, con due aree dedicate:

Area Cliente → Prenotazioni rapide con login tramite telefono + OTP (simulato)

Area Barbiere → Gestione prenotazioni, disponibilità e pannello amministrativo

Il progetto è pensato per essere hostato su GitHub Pages, senza backend, tramite Local Storage.

🚀 Funzionalità principali
👤 Area Cliente

Login via numero di telefono + codice OTP generato fittiziamente

Visualizzazione disponibilità barbiere

Scelta orario tra quelli liberi

Conferma prenotazione

Visualizzazione appuntamenti futuri

🧔‍♂️ Area Barbiere

Login con credenziali protette tramite hash

Dashboard con riepilogo appuntamenti

Gestione disponibilità settimanale

Cancellazione appuntamenti

Memorizzazione sicura tramite Local Storage

🎨 Design

Stile Barber Shop Premium: Nero, Oro, Bianco

Font: Montserrat & Cormorant Garamond

Layout responsive ottimizzato per mobile e desktop

Logo personalizzato “Besh Barber”

📁 Struttura del progetto
barbershop-booking/
│
├── index.html                # Home page
│
├── login.html                # Login cliente
├── client.html               # Area cliente
├── barber-login.html         # Login barbiere
├── barber.html               # Area barbiere
│
├── assets/
│   ├── css/
│   │   ├── style.css         # Stili globali
│   │   ├── barber.css        # Stili area barbiere
│   │   └── client.css        # Stili area cliente
│   └── img/
│       └── logo.png          # Logo Besh Barber
│
├── scripts/
│   ├── storage.js            # Gestione Local Storage + hashing password
│   └── ui.js                 # Gestione UI, OTP, prenotazioni
│
└── README.md                 # Documentazione progetto

🛠️ Tecnologie utilizzate

HTML5

CSS3

JavaScript Vanilla

LocalStorage API

SHA-256 hashing (integrato)

🔐 Sicurezza

Nonostante sia un progetto 100% frontend, include:

Hashing password lato client

Validazioni input

Nessun dato inviato a server esterni

⚠️ Nota: Non progettato per produzione reale; richiede backend per sicurezza completa.

🌐 Deploy su GitHub Pages

Carica il progetto su un repository GitHub

Vai su Settings → Pages

Seleziona main branch / root

Il sito sarà online a un URL tipo:
https://tuonome.github.io/barbershop-booking

🤝 Contributi

Pull request e suggerimenti sono benvenuti!
Si accettano anche issue per bug o nuove funzionalità.

📄 Licenza

Libero utilizzo per scopi personali.
Per uso commerciale → contattare lo sviluppatore.
