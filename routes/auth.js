"use strict";

import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database/db.js';
import { promisify } from 'util';

const router = express.Router();

// Promisify bcrypt e req.logIn
const hashAsync = promisify(bcrypt.hash);
const compareAsync = promisify(bcrypt.compare);
const logInAsync = function(req, user) {
    return new Promise((resolve, reject) => {
        req.logIn(user, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Promisify req.logout
const logOutAsync = function(req) {
    return new Promise((resolve, reject) => {
        req.logout((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Promisify session.destroy
const destroySessionAsync = function(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Rotta GET per la pagina di login
router.get('/login', (req, res) => {
    res.render('login');
});

// Rotta POST per gestire il login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Converti l'email in minuscolo
        const emailLowerCase = email.toLowerCase();
        
        // Cerca l'utente nel database usando solo email
        const user = await db.get(
            'SELECT * FROM users WHERE email = ?', 
            [emailLowerCase]
        );
        
        if (!user) {
            req.flash('error_msg', 'Credenziali non valide.');
            return res.redirect('/login');
        }
        const isMatch = await compareAsync(password, user.password);
        
        if (!isMatch) {
            req.flash('error_msg', 'Credenziali non valide.');
            return res.redirect('/login');
        }
        
        // Autentica l'utente con Passport
        await logInAsync(req, user);
        
        // Se l'onboarding non è completato, reindirizza alla pagina di onboarding
        if (!user.type) return res.redirect('/onboarding');
        return res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Errore nel server, riprova più tardi.');
        return res.redirect('/login');
    }
});

// Rotta GET per la pagina di signup
router.get('/signup', (req, res) => {
    res.render('signup');
});

// Rotta POST per gestire la registrazione
router.post('/signup', async (req, res) => {
    try {
        const { email, username, password, 'confirm-password': confirmPassword } = req.body;

        // Converti l'email in minuscolo
        const emailLowerCase = email.toLowerCase();

        if (password !== confirmPassword) {
            req.flash('error_msg', 'Le password non corrispondono.');
            return res.redirect('/signup');
        }
        
        // Verifica se l'email o l'username sono già registrati
        const existingUser = await db.get(
            'SELECT * FROM users WHERE email = ? OR username = ?', 
            [emailLowerCase, username]
        );
        
        if (existingUser) {
            if (existingUser.email === emailLowerCase) req.flash('error_msg', 'L\'email risulta già associata ad un account.');
            else req.flash('error_msg', 'L\'username è già in uso. Scegli un altro username.');
            return res.redirect('/signup');
        }
        // Hash della password e inserimento del nuovo utente nel database
        const hash = await hashAsync(password, 10);
        
        await db.run(
            'INSERT INTO users (email, username, password) VALUES (?, ?, ?)', 
            [emailLowerCase, username, hash]
        );
        
        req.flash('success_msg', 'Account creato con successo. Si prega di effettuare il login.');
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Si è verificato un errore. Si prega di riprovare.');
        return res.redirect('/signup');
    }
});

// Rotta POST per il logout
router.post('/logout', async (req, res, next) => {
    try {
        await logOutAsync(req);
        await destroySessionAsync(req);
        res.redirect('/login');
    } catch (err) {
        console.error('Errore durante il logout:', err);
        next(err);
    }
});

export default router;