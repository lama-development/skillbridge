// models/db.js
"use strict";

import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./skillbridge.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT,
    password TEXT,
    type TEXT,
    firstName TEXT,
    lastName TEXT,
    businessName TEXT,
    website TEXT,
    profilePicture TEXT DEFAULT 'img/profile.png'
    )`);
});

export default db;