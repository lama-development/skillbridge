"use strict";

import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database/db.js';

const router = express.Router();

// Rotta GET per la pagina di login
router.get('/login', (req, res) => {
    res.render('login');
});

// Rotta POST per gestire il login
router.post('/login', (req, res, next) => {
    const { emailOrUsername, password } = req.body;
    // Cerca l'utente nel database usando email o username
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
        // Confronta la password inserita con quella hashata nel database
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
            // Autentica l'utente con Passport
            req.logIn(user, (err) => {
                if (err) {
                    console.error(err);
                    req.flash('error_msg', 'Errore durante l\'autenticazione.');
                    return res.redirect('/login');
                }
                // Se l'onboarding non è completato, reindirizza alla pagina di onboarding
                if (!user.type) {
                    return res.redirect('/onboarding');
                }
                return res.redirect('/');
            });
        });
    });
});

// Rotta GET per la pagina di signup
router.get('/signup', (req, res) => {
    res.render('signup');
});

// Rotta POST per gestire la registrazione
router.post('/signup', (req, res) => {
    const { email, username, password, 'confirm-password': confirmPassword } = req.body;

    if (password !== confirmPassword) {
        req.flash('error_msg', 'Le password non corrispondono.');
        return res.redirect('/signup');
    }
    
    // Verifica se l'email o l'username sono già registrati
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, user) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Si è verificato un errore. Si prega di riprovare.');
            return res.redirect('/signup');
        }
        if (user) {
            if (user.email === email) {
                req.flash('error_msg', 'L\'email risulta già associata ad un account.');
            } else {
                req.flash('error_msg', 'L\'username è già in uso. Scegli un altro username.');
            }
            return res.redirect('/signup');
        }

        // Hash della password e inserimento del nuovo utente nel database
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                req.flash('error_msg', 'Si è verificato un errore durante l\'hashing della password.');
                return res.redirect('/signup');
            }
            db.run('INSERT INTO users (email, username, password) VALUES (?, ?, ?)', [email, username, hash], function (err) {
                if (err) {
                    console.error(err);
                    req.flash('error_msg', 'Si è verificato un errore durante la creazione dell\'account.');
                    return res.redirect('/signup');
                }
                req.flash('success_msg', 'Account creato con successo. Si prega di effettuare il login.');
                res.redirect('/login');
            });
        });
    });
});

// Rotta POST per il logout
router.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.session.destroy(err => {
            if (err) {
                console.error('Errore durante la distruzione della sessione:', err);
            }
            res.redirect('/login');
        });
    });
});

export default router;