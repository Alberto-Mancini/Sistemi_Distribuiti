const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');
const db = require('./database');

const app = express();
const port = 3001; // <-- CORREZIONE: La porta per l'user_server deve essere 3001
const ADMIN_SERVICE_URL = 'http://localhost:3000';
const ADMIN_API_KEY = 'la-mia-chiave-segreta-per-comunicazione-server';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Sessioni
app.use(session({
    secret: 'un-altra-chiave-segreta-per-le-sessioni',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Guardie di sicurezza
const isLoggedIn = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login.html');
    next();
};
const isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Accesso negato.');
    }
    next();
};

// --- API DI AUTENTICAZIONE ---
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e password sono obbligatori.' });
    const allowedDomains = ['@gmail.com', '@libero.com', '@yopmail.com'];
    if (!allowedDomains.some(d => email.toLowerCase().endsWith(d))) return res.status(400).json({ message: 'Dominio email non valido.' });
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [email]);
        if (users.length > 0) return res.status(409).json({ message: 'Email già in uso.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'user']);
        res.status(201).json({ message: 'Registrazione avvenuta con successo!' });
    } catch (error) { res.status(500).json({ message: 'Errore del server.' }); }
});
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Credenziali obbligatorie.' });
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ message: 'Credenziali non valide' });
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Credenziali non valide' });
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.json({ role: user.role });
    } catch (error) { res.status(500).json({ message: 'Errore del server.' }); }
});
app.post('/api/logout', (req, res) => { req.session.destroy(() => res.json({ message: 'Logout effettuato' })); });

// --- API FLUSSO UTENTE ---
app.get('/api/rooms/available', isLoggedIn, async (req, res) => {
    const { date, guests } = req.query;
    if (!date || !guests) return res.status(400).json({ message: 'Data e ospiti richiesti.' });
    try {
        const [bookedRooms] = await db.query('SELECT room_name FROM bookings WHERE booking_date = ?', [date]);
        const bookedRoomNames = bookedRooms.map(b => b.room_name);
        const [allRooms] = await db.query('SELECT * FROM rooms WHERE capacity >= ?', [parseInt(guests)]);
        const availableRooms = allRooms.filter(room => !bookedRoomNames.includes(room.name));
        res.json(availableRooms);
    } catch (error) { res.status(500).json({ message: 'Errore ricerca stanze.' }); }
});
app.post('/api/book', isLoggedIn, async (req, res) => {
    const { name, email, phone, booking_date, guests, dining, room_name } = req.body;
    try {
        const query = 'INSERT INTO bookings (name, email, phone, booking_date, guests, dining, room_name) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await db.query(query, [name, email, phone, booking_date, guests, dining, room_name]);
        res.status(201).json({ message: 'Prenotazione effettuata con successo!' });
    } catch (error) { res.status(500).json({ message: 'Errore del server durante la prenotazione.' }); }
});

// --- API PROXY PER ADMIN ---
app.get('/api/admin/bookings', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${ADMIN_SERVICE_URL}/api/bookings`, {
            headers: { 'x-api-key': ADMIN_API_KEY }
        });
        res.json(response.data);
    } catch (error) { res.status(500).json({ message: "Errore recupero dati dall'admin service." }); }
});
app.post('/api/admin/rooms', isLoggedIn, isAdmin, async (req, res) => {
    const { name, capacity, description } = req.body;
    if (!name || !capacity) return res.status(400).json({ message: 'Nome e capacità sono obbligatori.' });
    try {
        await db.query('INSERT INTO rooms (name, capacity, description) VALUES (?, ?, ?)', [name, capacity, description]);
        res.status(201).json({ message: 'Stanza aggiunta con successo.' });
    } catch (error) { res.status(500).json({ message: 'Errore del server o stanza già esistente.' }); }
});
app.get('/api/admin/menu', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM menus WHERE id = 1');
        res.json(rows[0] || { title: '', content: '' });
    } catch (error) { res.status(500).json({ message: 'Errore recupero menu.' }); }
});
app.post('/api/admin/menu', isLoggedIn, isAdmin, async (req, res) => {
    const { title, content } = req.body;
    try {
        await db.query('UPDATE menus SET title = ?, content = ? WHERE id = 1', [title, content]);
        res.json({ message: 'Menu aggiornato.' });
    } catch (error) { res.status(500).json({ message: 'Errore aggiornamento menu.' }); }
});

// --- GESTIONE PAGINE HTML ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/home.html')));
app.get('/admin', isLoggedIn, isAdmin, (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/dashboard', isLoggedIn, (req, res) => res.sendFile(path.join(__dirname, '../frontend/dashboard.html')));
app.get('/results.html', isLoggedIn, (req, res) => res.sendFile(path.join(__dirname, '../frontend/results.html')));
app.get('/explore.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/explore.html')));

app.listen(port, () => {
    console.log(`User Server (Gateway) in ascolto sulla porta ${port}`);
});