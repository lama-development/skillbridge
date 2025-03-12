// routes/index.js
"use strict";

import express from 'express';
import db from '../database/db.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pkg = require('../package.json');
const router = express.Router();

// Rotta per la home page
router.get('/', (req, res) => {
    // Mostra un alert per l'onboarding se l'utente è autenticato ma non ha completato l'onboarding
    let showOnboardingAlert = false;
    if (req.isAuthenticated() && !req.user.type) {
        showOnboardingAlert = true;
    }
    // Supponendo di avere un array di annunci
    const annunci = [
        { id: 1, logo: '/images/logo1.png', azienda: 'Azienda 1', titolo: 'Offerta 1', descrizione: 'Descrizione offerta 1' },
        { id: 2, logo: '/images/logo2.png', azienda: 'Azienda 2', titolo: 'Offerta 2', descrizione: 'Descrizione offerta 2' }
    ];
    res.render('index', { showOnboardingAlert, package: pkg, annunci, user: req.user });
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