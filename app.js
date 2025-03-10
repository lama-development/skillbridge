// app.js
"use strict";

import express from 'express';
import session from 'express-session';
import path from 'path';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import passport from './config/passportConfig.js';
import db from './database/db.js';

const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Configurazione di EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware per il parsing dei dati
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurazione della cartella pubblica
app.use(express.static(path.join(__dirname, 'public')));

// Configurazione delle sessioni per Passport
app.use(session({
    secret: 'SkillBridge', // Cambia in produzione
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// Inizializzazione di Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware per i messaggi flash e l'utente corrente
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.success_msg = req.flash('success_msg');
    next();
});

// Importa e monta i moduli delle rotte
import indexRoutes from './routes/index.js';
import authRoutes from './routes/auth.js';

app.use('/', indexRoutes);
app.use('/', authRoutes);

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});