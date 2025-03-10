// routes/index.js
"use strict";

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import db from '../database/db.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

// Variabili per risolvere i percorsi relativi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rotta per la home page
router.get('/', (req, res) => {
    // Mostra un alert per l'onboarding se l'utente è autenticato ma non ha completato l'onboarding
    let showOnboardingAlert = false;
    if (req.isAuthenticated() && !req.user.type) {
        showOnboardingAlert = true;
    }
    // Nota: se serve passare info dal package, puoi farlo direttamente o importarlo qui
    res.render('index', { showOnboardingAlert, package: pkg  });
});

// Rotta GET per il form di onboarding
router.get('/onboarding', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per completare l\'onboarding.');
        return res.redirect('/login');
    }
    res.render('onboarding');
});

// Rotta POST per processare l'onboarding
router.post('/onboarding', (req, res) => {
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

// Rotta per la pagina del profilo
router.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per accedere al profilo.');
        return res.redirect('/login');
    }
    if (!req.user.type) {
        req.flash('error_msg', 'Completa l\'onboarding per accedere al profilo.');
        return res.redirect('/onboarding');
    }
    res.render('profile', { user: req.user, package: pkg });
});

export default router;