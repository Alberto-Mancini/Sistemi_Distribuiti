document.addEventListener('DOMContentLoaded', function() {

    // Gestione del pulsante di logout
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            fetch('/api/logout', { method: 'POST' })
                .then(() => window.location.href = '/login.html');
        });
    }

    // Gestione del modulo di prenotazione
    const form = document.getElementById('booking-form');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // La chiamata API è corretta, ma ora inviamo i dati giusti
            fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => {
                if (!response.ok) {
                    // Se la sessione è scaduta, il server reindirizza,
                    // ma il fetch non lo segue. Gestiamo l'errore.
                    if (response.status === 401 || response.status === 403) {
                       throw new Error('Authentication error. Please log in again.');
                    }
                    return response.json().then(err => { throw new Error(err.message) });
                }
                return response.json();
            })
            .then(result => {
                console.log('Success:', result);
                alert(result.message || 'Booking successful!');
                form.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Booking failed! ' + error.message);
                // Se l'errore è di autenticazione, reindirizza al login
                if (error.message.includes('Authentication')) {
                    window.location.href = '/login.html';
                }
            });
        });
    }
});