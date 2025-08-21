-- Crea il database se non esiste già
CREATE DATABASE IF NOT EXISTS booking_db;

-- Seleziona il database su cui lavorare
USE booking_db;

-- Cancella le vecchie tabelle se esistono, per ripartire da zero
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS menus;

-- NUOVA TABELLA: Stanze (per renderle dinamiche)
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    description TEXT
);

-- NUOVA TABELLA: Menu (per renderli dinamici)
CREATE TABLE menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABELLA PRENOTAZIONI: Aggiornata con il telefono
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),                        -- NUOVO: Numero di telefono
    booking_date DATE NOT NULL,
    guests INT NOT NULL,
    dining BOOLEAN NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELLA UTENTI: Invariata
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
);

-- DATI INIZIALI
-- Inserisce alcune stanze di partenza
INSERT INTO rooms (name, capacity, description) VALUES
('Doppia Standard', 2, 'Una comoda stanza con letto matrimoniale, ideale per coppie.'),
('Tripla Comfort', 3, 'Spaziosa e luminosa, con un letto matrimoniale e un singolo.'),
('Familiare', 4, 'Perfetta per le famiglie, con due letti matrimoniali o soluzioni equivalenti.');

-- Inserisce un menu di esempio
INSERT INTO menus (title, content) VALUES
('Menu del Giorno', 'Il nostro menu cambia quotidianamente. Chiedere al personale per i dettagli.');

-- Inserisce gli utenti di default
INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$f8B.N.q3h2Yp9/iiLg5tA.eT/Qx4.gQy3jJ8.X.Y3jZ8.X.Y3jZ8.', 'admin'),
('testuser@yopmail.com', '$2b$10$f8B.N.q3h2Yp9/iiLg5tA.eT/Qx4.gQy3jJ8.X.Y3jZ8.X.Y3jZ8.', 'user');