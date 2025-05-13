"use strict";

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Ricavo __dirname siccome non è disponibile in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'skillbridge.db');
const db = new sqlite3.Database(dbPath);

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
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
    )`);
});

export default db;