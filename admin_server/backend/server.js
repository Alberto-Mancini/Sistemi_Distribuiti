const express = require('express');
const db = require('./database');

const app = express();
const port = 3000; // L'admin server gira sulla porta 3000
const ADMIN_API_KEY = 'la-mia-chiave-segreta-per-comunicazione-server';

// Middleware per il parsing del JSON
app.use(express.json());

// Middleware di sicurezza per controllare la chiave API
// Questo garantisce che solo le richieste provenienti dal nostro user_server (che conosce la chiave)
// possano accedere a questo servizio.
const checkApiKey = (req, res, next) => {
    const apiKey = req.get('x-api-key');
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        // Se la chiave manca o è sbagliata, nega l'accesso.
        return res.status(401).json({ message: 'Accesso non autorizzato: API Key mancante o non valida.' });
    }
    // Se la chiave è corretta, procedi alla richiesta.
    next();
};

// --- API per le Prenotazioni ---
// Questo è l'unico endpoint esposto da questo microservizio.
// Viene chiamato dal user_server per recuperare tutte le prenotazioni.
app.get('/api/bookings', checkApiKey, async (req, res) => {
    try {
        // Esegue una query per ottenere tutte le prenotazioni, ordinate dalla più recente.
        const [bookings] = await db.query(
            'SELECT id, name, email, phone, booking_date, guests, dining, room_name FROM bookings ORDER BY booking_date DESC'
        );
        res.json(bookings);
    } catch (error) {
        console.error("Errore nel recuperare le prenotazioni (admin_server):", error);
        res.status(500).json({ message: 'Errore interno del server durante il recupero delle prenotazioni.' });
    }
});

// Avvio del server
app.listen(port, () => {
    console.log(`Admin Service in ascolto sulla porta ${port}`);
    });