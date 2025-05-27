"use strict";

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Ricavo __dirname siccome non è disponibile in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'skillbridge.db');
const db = new sqlite3.Database(dbPath);

// Inizializzazione delle tabelle
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    type TEXT CHECK (type IN ('business', 'freelancer')),
    fullName TEXT,
    businessName TEXT,
    website TEXT,
    phone TEXT,
    location TEXT,
    bio TEXT DEFAULT '',
    profilePicture TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    skill TEXT NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE(username, skill)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    userId INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('job_offer', 'freelancer_promo')),
    category TEXT DEFAULT 'Altro',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(username) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1 TEXT NOT NULL,
    user2 TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (user2) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE(user1, user2)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER NOT NULL,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender) REFERENCES users(username) ON DELETE CASCADE
    )`);
});

// Wrapping dei metodi del database con Promise
const dbAsync = {
    // Esegue una query che restituisce una riga
    get: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    
    // Esegue una query che restituisce più righe
    all: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    
    // Esegue una query senza restituire risultati
    run: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else {
                    // this.lastID e this.changes sono disponibili qui
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    },

    // Accesso al database originale
    db: db
};

export default dbAsync;