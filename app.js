"use strict";

import express from 'express';
import session from 'express-session';
import path from 'path';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';
import passport from './database/passport.js';
const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione di EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware per il parsing dei dati
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurazione delle cartelle statiche
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

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
    res.locals.currentUser = req.user; 
    res.locals.error_msg = req.flash('error_msg');
    res.locals.success_msg = req.flash('success_msg');
    res.locals.info_msg = req.flash('info_msg'); 
    next();
});

// Importa e monta i moduli delle rotte
import homeRoutes from './routes/home.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profile.js';
import profileActionsRoutes from './routes/profile-actions.js';
import searchRoutes from './routes/search.js';
import onboardingRoutes from './routes/onboarding.js';

app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/posts', postsRoutes);
app.use('/chat', chatRoutes);
app.use('/profile', profileRoutes);
app.use('/profile', profileActionsRoutes);
app.use('/search', searchRoutes);
app.use('/onboarding', onboardingRoutes);

// Middleware per gestire pagine non esistenti
app.use((req, res) => {
    res.status(404).render('404');
});

// Avvio del server in modo asincrono
const startServer = async () => {
    try {
        await new Promise((resolve) => {
            const server = app.listen(PORT, () => {
                console.log(`Server in ascolto su http://localhost:${PORT}`);
                resolve(server);
            });
        });
    } catch (error) {
        console.error('Errore nell\'avvio del server:', error);
        process.exit(1);
    }
};

// Avvio del server
startServer();