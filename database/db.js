"use strict";

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Ricavo __dirname siccome non è disponibile in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'skillbridge.db');
const db = new sqlite3.Database(dbPath);

// Inizializzazione delle tabelle
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    type TEXT,
    firstName TEXT,
    lastName TEXT,
    businessName TEXT,
    website TEXT,
    phone TEXT,
    bio TEXT DEFAULT '',
    profilePicture TEXT DEFAULT 'img/profile.png'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    userId INTEGER NOT NULL,
    type TEXT NOT NULL,
    category TEXT DEFAULT 'Altro',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
    )`);
});

// Wrapping dei metodi del database con Promise
const dbAsync = {
    // Esegue una query che restituisce una riga
    get: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },
    
    // Esegue una query che restituisce più righe
    all: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    
    // Esegue una query senza restituire risultati
    run: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
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