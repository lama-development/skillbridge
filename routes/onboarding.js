"use strict";

import express from 'express';
import db from '../database/db.js';
import { requireAuth, preventOnboardingIfComplete } from '../middleware/auth.js';

const router = express.Router();

// Rotta GET per il form di onboarding
router.get('/', requireAuth, preventOnboardingIfComplete, (req, res) => {
    res.render('onboarding');
});

// Elabora i dati del form di onboarding
router.post('/', requireAuth, async (req, res) => {
    try {
        const { type, name, website, phone, location, defaultProfilePicture } = req.body;
          // Validazione del numero di telefono (se fornito)
        if (phone && phone.trim()) {
            const phoneRegex = /^[\d\s\+]+$/;
            if (!phoneRegex.test(phone.trim())) {
                req.flash('error_msg', 'Il numero di telefono può contenere solo numeri, spazi e +.');
                return res.redirect('/onboarding');
            }
        }
        
        // Aggiorna il profilo utente nel database
        await db.run(
            'UPDATE users SET type = ?, name = ?, website = ?, phone = ?, location = ?, profilePicture = ? WHERE username = ?',
            [type, name, website, phone, location, defaultProfilePicture, req.user.username]
        );
        
        // Reindirizza alla homepage dopo il completamento
        res.redirect('/');
    } catch (err) {
        console.error('Errore durante onboarding:', err);
        req.flash('error_msg', 'Errore durante l\'onboarding.');
        return res.redirect('/onboarding');
    }
});

// Rotta POST per saltare l'onboarding
router.post('/skip', requireAuth, (req, res) => {
    res.redirect('/');
});

export default router;
