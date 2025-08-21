const mysql = require('mysql2');

// Crea un pool di connessioni al database con le credenziali scritte direttamente qui.
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '090304', // <-- METTI QUI LA TUA VERA PASSWORD
    database: 'booking_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Esporta la versione del pool che usa le "Promises" per async/await
module.exports = pool.promise();