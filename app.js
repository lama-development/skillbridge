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

// Middleware to make flash messages available in views
app.use((req, res, next) => {
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.success_msg = req.flash('success_msg');
    next();
});

// Definizione rotte di base
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true  // This will set a flash message under 'error'
}));

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
        req.flash('error_msg', 'Passwords do not match.');
        return res.redirect('/signup');
    }

    // Check if the email is already registered
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'An error occurred. Please try again.');
            return res.redirect('/signup');
        }
        if (user) {
            req.flash('error_msg', 'Email is already registered.');
            return res.redirect('/signup');
        }

        // Proceed to hash password and save the user
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                req.flash('error_msg', 'Error while hashing the password.');
                return res.redirect('/signup');
            }
            db.run('INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
                [email, username, hash],
                function (err) {
                    if (err) {
                        console.error(err);
                        req.flash('error_msg', 'Error saving the user.');
                        return res.redirect('/signup');
                    }
                    // Optionally, flash a success message
                    req.flash('success_msg', 'Account created successfully! Please log in.');
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
    const { userId, type, name, surname, companyName } = req.body;
    // Determine the data based on user type
    let updateQuery, updateData;
    if (type === 'freelancer') {
        updateQuery = 'UPDATE users SET type = ?, username = ?, extra_data = ? WHERE id = ?';
        // Combine name and surname or store as JSON
        updateData = [type, `${name} ${surname}`, JSON.stringify({ name, surname }), userId];
    } else if (type === 'business') {
        updateQuery = 'UPDATE users SET type = ?, username = ?, extra_data = ? WHERE id = ?';
        updateData = [type, companyName, JSON.stringify({ companyName }), userId];
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