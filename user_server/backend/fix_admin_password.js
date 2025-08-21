// Questo è uno script da eseguire UNA SOLA VOLTA per riparare la password dell'admin.

const bcrypt = require('bcrypt');
const db = require('./database'); // Usiamo la stessa connessione del server

async function fixAdminPassword() {
    console.log("--- Inizio procedura di reset password per 'admin' ---");

    const plainPassword = 'password123';
    const saltRounds = 10;

    try {
        // 1. Genera un nuovo hash corretto per "password123"
        console.log('Sto generando un nuovo hash per la password...');
        const newHashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        console.log('Nuovo hash generato con successo.');

        // 2. Aggiorna la password nel database per l'utente 'admin'
        console.log("Sto aggiornando il database...");
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE username = ?',
            [newHashedPassword, 'admin']
        );

        // 3. Controlla il risultato
        if (result.affectedRows > 0) {
            console.log("\n✔ SUCCESS! La password per l'utente 'admin' è stata resettata correttamente.");
        } else {
            console.error("\n❌ ERRORE: Non è stato trovato nessun utente con username 'admin' da aggiornare.");
        }

    } catch (error) {
        console.error("\n❌ ERRORE CRITICO durante l'operazione:", error);
    } finally {
        // Chiudiamo la connessione al database per terminare lo script
        db.end();
    }
}

// Esegui la funzione
fixAdminPassword();