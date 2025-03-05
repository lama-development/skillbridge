// app.js

import express from 'express';
import session from 'express-session';
import path from 'path';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import passport from './config/passportConfig.js';
import db from './models/db.js';

const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    res.render('index', { showOnboardingAlert });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error_msg', info.message);
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            // Se il campo type non è impostato, significa che l'onboarding non è stato completato
            if (!user.type) {
                return res.redirect('/onboarding?userId=' + user.id);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});

app.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        res.redirect('/');
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

// GET route for onboarding form
app.get('/onboarding', (req, res) => {
    // Pass the userId from query params to the view
    res.render('onboarding', { userId: req.query.userId });
});

// POST route for onboarding form
app.post('/onboarding', (req, res) => {
    const { userId, type } = req.body;
    // Prepara la query per aggiornare il campo type in base alla scelta
    let updateQuery, updateData;
    if (type === 'freelancer') {
        updateQuery = 'UPDATE users SET type = ? WHERE id = ?';
        updateData = [type, userId];
    } else if (type === 'business') {
        updateQuery = 'UPDATE users SET type = ? WHERE id = ?';
        updateData = [type, userId];
    }
    db.run(updateQuery, updateData, function (err) {
        if (err) {
            console.error(err);
            return res.redirect('/onboarding?userId=' + userId);
        }
        res.redirect('/');
    });
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});