"use strict";

import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database/db.js';
import { promisify } from 'util';

const router = express.Router();

// Trasforma le funzioni callback in Promise per usare async/await
const hashPassword = promisify(bcrypt.hash);
const comparePasswords = promisify(bcrypt.compare);

// Helper per il login con Passport
function loginUser(req, user) {
    return new Promise((resolve, reject) => {
        req.logIn(user, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Helper per il logout
function logoutUser(req) {
    return new Promise((resolve, reject) => {
        req.logout((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Helper per distruggere la sessione
function destroySession(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Pagina di login
router.get('/login', (req, res) => {
    res.render('login');
});

// Elabora il login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const emailLowerCase = email.toLowerCase();
        
        // Cerca l'utente nel database
        const user = await db.get('SELECT * FROM users WHERE email = ?', [emailLowerCase]);
        if (!user) {
            req.flash('error_msg', 'Credenziali non valide.');
            return res.redirect('/login');
        }
        
        // Verifica la password
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
            req.flash('error_msg', 'Credenziali non valide.');
            return res.redirect('/login');
        }
        
        // Effettua il login
        await loginUser(req, user);
        
        // Se l'onboarding non è completato, reindirizza lì
        if (!user.type) {
            return res.redirect('/onboarding');
        }
        
        res.redirect('/');
    } catch (err) {
        console.error('Errore durante login:', err);
        req.flash('error_msg', 'Errore del server, riprova più tardi.');
        return res.redirect('/login');
    }
});

// Pagina di registrazione
router.get('/signup', (req, res) => {
    res.render('signup');
});

// Elabora la registrazione
router.post('/signup', async (req, res) => {
    try {
        const { email, username, password, 'confirm-password': confirmPassword } = req.body;
        const emailLowerCase = email.toLowerCase();
        
        // Validazione username
        const usernameRegex = /^[a-z0-9-]+$/;
        if (!usernameRegex.test(username)) {
            req.flash('error_msg', 'Username non valido. Usa solo lettere minuscole, numeri e trattini.');
            return res.redirect('/signup');
        }
        
        if (username.length < 3 || username.length > 30) {
            req.flash('error_msg', 'L\'username deve essere lungo tra 3 e 30 caratteri.');
            return res.redirect('/signup');
        }
        
        // Verifica che le password corrispondano
        if (password !== confirmPassword) {
            req.flash('error_msg', 'Le password non corrispondono.');
            return res.redirect('/signup');
        }
        
        // Verifica che email e username non siano già in uso
        const existingUser = await db.get(
            'SELECT * FROM users WHERE email = ? OR username = ?', 
            [emailLowerCase, username]
        );
        
        if (existingUser) {
            if (existingUser.email === emailLowerCase) {
                req.flash('error_msg', 'L\'email è già associata ad un account.');
            } else {
                req.flash('error_msg', 'Username già in uso. Scegline un altro.');
            }
            return res.redirect('/signup');
        }
        
        // Cripta la password e crea l'utente
        const hashedPassword = await hashPassword(password, 10);
        await db.run(
            'INSERT INTO users (email, username, password) VALUES (?, ?, ?)', 
            [emailLowerCase, username, hashedPassword]
        );
        
        // Recupera l'utente appena creato per il login automatico
        const newUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        
        // Login automatico
        await loginUser(req, newUser);
        res.redirect('/onboarding');
    } catch (err) {
        console.error('Errore durante registrazione:', err);
        req.flash('error_msg', 'Si è verificato un errore. Riprova.');
        return res.redirect('/signup');
    }
});

// Elabora il logout
router.post('/logout', async (req, res) => {
    try {
        await logoutUser(req);
        await destroySession(req);
        res.redirect('/login');
    } catch (err) {
        console.error('Errore durante logout:', err);
        res.redirect('/login');
    }
});

export default router;