"use strict";

import express from 'express';
import * as dao from '../database/dao.js';
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
        
        // Validazione campi obbligatori
        const errors = [];
        
        // Validazione tipo account
        if (!type || !['freelancer', 'business'].includes(type)) {
            errors.push('Devi selezionare un tipo di account valido.');
        }
        
        // Validazione nome (obbligatorio)
        if (!name || !name.trim()) {
            errors.push('Il nome è obbligatorio.');
        } else if (name.trim().length < 2) {
            errors.push('Il nome deve contenere almeno 2 caratteri.');
        } else if (name.trim().length > 100) {
            errors.push('Il nome non può superare i 100 caratteri.');
        }
        
        // Validazione sito web (se fornito)
        if (website && website.trim()) {
            const urlRegex = /^https?:\/\/.+/;
            if (!urlRegex.test(website.trim())) {
                errors.push('Il sito web deve essere un URL valido (es. https://example.com).');
            }
        }
        
        // Validazione del numero di telefono (se fornito)
        if (phone && phone.trim()) {
            const phoneRegex = /^[\d\s\+]+$/;
            if (!phoneRegex.test(phone.trim())) {
                errors.push('Il numero di telefono può contenere solo numeri, spazi e il simbolo +.');
            } else if (phone.trim().length < 8 || phone.trim().length > 20) {
                errors.push('Il numero di telefono deve essere compreso tra 8 e 20 caratteri.');
            }
        }
        
        // Validazione località (se fornita)
        if (location && location.trim() && location.trim().length > 100) {
            errors.push('La località non può superare i 100 caratteri.');
        }
        
        // Se ci sono errori, reindirizza con i messaggi di errore
        if (errors.length > 0) {
            req.flash('error_msg', errors.join(' '));
            return res.redirect('/onboarding');
        }
          // Aggiorna il profilo utente nel database
        await dao.updateUserOnboarding(
            req.user.username, 
            type, 
            name, 
            website, 
            phone, 
            location, 
            defaultProfilePicture
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
