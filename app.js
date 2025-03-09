// app.js
"use strict";

import express from 'express';
import session from 'express-session';
import path from 'path';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import bcrypt from 'bcrypt';
import passport from './config/passportConfig.js';
import db from './models/db.js';

const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Configurazione EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware per il parsing dei dati
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurazione della cartella pubblica
app.use(express.static(path.join(__dirname, 'public')));

// Sessioni per Passport
app.use(session({
    secret: 'SkillBridge', // Da cambiare in produzione
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// Inizializzazione Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware per flash messages 
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.success_msg = req.flash('success_msg');
    next();
});

// Definizione rotte di base
app.get('/', (req, res) => {
    let showOnboardingAlert = false;
    if (req.isAuthenticated() && !req.user.type) {
        showOnboardingAlert = true;
    }
    res.render('index', { showOnboardingAlert, package: pkg });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res, next) => {
    const { emailOrUsername, password } = req.body;

    // Cerca l'utente nel database usando sia email che username
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [emailOrUsername, emailOrUsername], (err, user) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Errore nel server, riprova più tardi.');
            return res.redirect('/login');
        }
        if (!user) {
            req.flash('error_msg', 'Credenziali non valide.');
            return res.redirect('/login');
        }

        // Confronta la password con quella hashata nel database
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                req.flash('error_msg', 'Errore durante la verifica della password.');
                return res.redirect('/login');
            }
            if (!isMatch) {
                req.flash('error_msg', 'Credenziali non valide.');
                return res.redirect('/login');
            }

            // Autentica l'utente con Passport.js
            req.logIn(user, (err) => {
                if (err) {
                    console.error(err);
                    req.flash('error_msg', 'Errore durante l\'autenticazione.');
                    return res.redirect('/login');
                }

                // Controllo onboarding
                if (!user.type) {
                    return res.redirect('/onboarding');
                }
                return res.redirect('/');
            });
        });
    });
});

app.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        req.session.destroy(err => {
            if (err) {
                console.error('Errore durante la distruzione della sessione:', err);
            }
            res.redirect('/login');
        });
    });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    const { email, username, password, 'confirm-password': confirmPassword } = req.body;

    if (password !== confirmPassword) {
        req.flash('error_msg', 'Le password non corrispondono.');
        return res.redirect('/signup');
    }

    // Check if the email is already registered
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Si è verificato un errore. Si prega di riprovare.');
            return res.redirect('/signup');
        }
        if (user) {
            req.flash('error_msg', 'L\'email risulta già associata ad un account.');
            return res.redirect('/signup');
        }

        // Proceed to hash password and save the user
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                req.flash('error_msg', 'Si è verificato un errore durante l\'hashing the password.');
                return res.redirect('/signup');
            }
            db.run('INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
                [email, username, hash],
                function (err) {
                    if (err) {
                        console.error(err);
                        req.flash('error_msg', 'Si è verificato un errore durante la creazione dell\'account.');
                        return res.redirect('/signup');
                    }
                    req.flash('success_msg', 'Account creato con successo. Si prega di effettuare il login.');
                    res.redirect('/login');
                }
            );
        });
    });
});

// GET route per il form di onboarding
app.get('/onboarding', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per completare l\'onboarding.');
        return res.redirect('/login');
    }
    // Renderizza la pagina 
    res.render('onboarding');
});

app.post('/onboarding', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per completare l\'onboarding.');
        return res.redirect('/login');
    }

    const { type, firstName, lastName, businessName, website } = req.body;
    let updateQuery, updateData;

    if (type === 'freelancer') {
        updateQuery = 'UPDATE users SET type = ?, firstName = ?, lastName = ?, website = ? WHERE id = ?';
        updateData = [type, firstName, lastName, website, req.user.id];
    } else if (type === 'business') {
        updateQuery = 'UPDATE users SET type = ?, businessName = ?, website = ? WHERE id = ?';
        updateData = [type, businessName, website, req.user.id];
    } else {
        req.flash('error_msg', 'Tipo utente non valido.');
        return res.redirect('/onboarding');
    }

    db.run(updateQuery, updateData, function (err) {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Errore durante l\'onboarding.');
            return res.redirect('/onboarding');
        }
        req.flash('success_msg', 'Onboarding completato con successo!');
        res.redirect('/');
    });
});

app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per accedere al profilo.');
        return res.redirect('/login');
    }
    // Se il campo "type" non è impostato, l'onboarding non è stato completato.
    if (!req.user.type) {
        req.flash('error_msg', 'Completa l\'onboarding per accedere al profilo.');
        return res.redirect('/onboarding');
    }
    res.render('profile', { user: req.user, package: pkg });
});


// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});