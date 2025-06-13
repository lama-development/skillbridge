"use strict";

import express from 'express';
import db from '../database/db.js';
import fs from 'fs';
import { requireAuth, requireOnboarding, requireFreelancerUser } from '../middleware/auth.js';
import { upload, handleMulterError, deleteExistingProfilePictures } from '../middleware/upload.js';

const router = express.Router();

// Upload della foto profilo
router.post('/upload-photo', requireAuth, upload.single('profilePicture'), handleMulterError, async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error_msg', 'Nessun file è stato caricato.');
            return res.redirect('/profile');
        }
        
        // Verifica che il file sia stato salvato correttamente
        if (!fs.existsSync(req.file.path)) {
            console.error('File non salvato:', req.file.path);
            req.flash('error_msg', 'Errore durante il salvataggio del file.');
            return res.redirect('/profile');
        }
        
        // Percorso relativo per il database
        const relativePath = `/uploads/${req.file.filename}`;   
        
        try {
            // Aggiorna il database con il nuovo percorso
            await db.run('UPDATE users SET profilePicture = ? WHERE username = ?', [relativePath, req.user.username]);   
            
            // Solo dopo il successo, elimina i vecchi file
            deleteExistingProfilePictures(req.user.username, req.file.filename);
            
            // Aggiorna l'oggetto utente nella sessione
            req.user.profilePicture = relativePath;
            res.redirect('/profile');
        } catch (dbErr) {
            // Se il database fallisce, elimina il file appena caricato
            console.error('Errore database:', dbErr);
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            req.flash('error_msg', 'Errore durante l\'aggiornamento del profilo.');
            return res.redirect('/profile');
        }
    } catch (err) {
        console.error('Errore upload foto:', err);
        req.flash('error_msg', 'Errore durante l\'upload della foto.');
        return res.redirect('/profile');
    }
});

// Rimuove la foto profilo (torna a quella predefinita)
router.post('/remove-photo', requireAuth, async (req, res) => {
    try {
        // Determina l'immagine predefinita in base al tipo di utente
        const defaultPhoto = req.user.type === 'business' ? '/img/business.png' : '/img/freelancer.png';
        
        // Se l'utente ha una foto caricata, la elimina
        if (req.user.profilePicture && req.user.profilePicture.startsWith('/uploads/')) {
            try {
                deleteExistingProfilePictures(req.user.username);
            } catch (fileErr) {
                console.error('Errore eliminazione file:', fileErr);
                // Continua comunque con l'aggiornamento
            }
        }
        
        // Imposta l'immagine predefinita nel database
        await db.run('UPDATE users SET profilePicture = ? WHERE username = ?', [defaultPhoto, req.user.username]);
        
        // Aggiorna l'oggetto utente nella sessione
        req.user.profilePicture = defaultPhoto;
        
        req.flash('success_msg', 'Foto profilo rimossa con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore rimozione foto:', err);
        req.flash('error_msg', 'Errore durante la rimozione della foto.');
        return res.redirect('/profile');
    }
});

// Aggiorna la biografia dell'utente
router.post('/update-bio', requireAuth, upload.none(), async (req, res) => {
    try {
        const { bio } = req.body;
        
        // Validazione lunghezza biografia
        if (bio && bio.length > 500) {
            req.flash('error_msg', 'La biografia non può superare i 500 caratteri.');
            return res.redirect('/profile');
        }
        
        // Sanitizzazione input
        const sanitizedBio = bio ? bio.trim() : null;
          // Aggiorna nel database
        await db.run('UPDATE users SET bio = ? WHERE username = ?', [sanitizedBio, req.user.username]);
        
        // Aggiorna nell'oggetto utente della sessione
        req.user.bio = sanitizedBio;
        
        req.flash('success_msg', 'Biografia aggiornata con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore aggiornamento biografia:', err);
        req.flash('error_msg', 'Errore durante l\'aggiornamento della biografia.');
        return res.redirect('/profile');
    }
});

// Aggiorna i contatti dell'utente
router.post('/update-contacts', requireAuth, async (req, res) => {
    try {
        const { website, phone, name, location } = req.body;
        
        // Validazione nome (obbligatorio)
        if (!name || !name.trim()) {
            req.flash('error_msg', 'Il nome è obbligatorio.');
            return res.redirect('/profile');
        }
        
        if (name.trim().length < 2) {
            req.flash('error_msg', 'Il nome deve contenere almeno 2 caratteri.');
            return res.redirect('/profile');
        }
        
        if (name.trim().length > 100) {
            req.flash('error_msg', 'Il nome non può superare i 100 caratteri.');
            return res.redirect('/profile');
        }
        
        // Validazione sito web (se fornito)
        if (website && website.trim()) {
            const urlRegex = /^https?:\/\/.+/;
            if (!urlRegex.test(website.trim())) {
                req.flash('error_msg', 'Il sito web deve essere un URL valido (es. https://example.com).');
                return res.redirect('/profile');
            }
        }
        
        // Validazione del numero di telefono (se fornito)
        if (phone && phone.trim()) {
            const phoneRegex = /^[\d\s\+]+$/;
            if (!phoneRegex.test(phone.trim())) {
                req.flash('error_msg', 'Il numero di telefono può contenere solo numeri, spazi e il simbolo +.');
                return res.redirect('/profile');
            }
            
            if (phone.trim().length < 8 || phone.trim().length > 20) {
                req.flash('error_msg', 'Il numero di telefono deve essere compreso tra 8 e 20 caratteri.');
                return res.redirect('/profile');
            }
        }
        
        // Validazione località (se fornita)
        if (location && location.trim() && location.trim().length > 100) {
            req.flash('error_msg', 'La località non può superare i 100 caratteri.');
            return res.redirect('/profile');
        }
          // Aggiunge https:// al sito web se mancante
        let validWebsite = website ? website.trim() : null;
        if (validWebsite && !validWebsite.startsWith('http://') && !validWebsite.startsWith('https://')) {
            validWebsite = 'https://' + validWebsite;
        }
        
        // Sanitizzazione input
        const sanitizedName = name.trim();
        const sanitizedPhone = phone ? phone.trim() : null;
        const sanitizedLocation = location ? location.trim() : null;
          // Aggiorna i contatti nel database
        await db.run(
            'UPDATE users SET website = ?, phone = ?, name = ?, location = ? WHERE username = ?',
            [validWebsite, sanitizedPhone, sanitizedName, sanitizedLocation, req.user.username]
        );
        
        // Aggiorna nell'oggetto utente della sessione
        req.user.website = validWebsite;
        req.user.phone = sanitizedPhone;
        req.user.location = sanitizedLocation;
        req.user.name = sanitizedName;
        
        req.flash('success_msg', 'Contatti aggiornati con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore aggiornamento contatti:', err);
        req.flash('error_msg', 'Errore durante l\'aggiornamento dei contatti.');
        return res.redirect('/profile');
    }
});

// Aggiorna le competenze (solo per freelancer)
router.post('/update-skills', requireAuth, requireFreelancerUser, express.urlencoded({ extended: true }), async (req, res) => {
    try {
        // Elabora le competenze dal form (separate da virgole)
        let skills = [];
        if (req.body.skills && typeof req.body.skills === 'string') {
            skills = req.body.skills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);
        } else if (Array.isArray(req.body.skills)) {
            skills = req.body.skills.filter(Boolean).map(skill => skill.trim());
        }
        
        // Validazione competenze
        for (const skill of skills) {
            if (skill.length < 2) {
                req.flash('error_msg', 'Ogni competenza deve contenere almeno 2 caratteri.');
                return res.redirect('/profile');
            }
            if (skill.length > 50) {
                req.flash('error_msg', 'Ogni competenza non può superare i 50 caratteri.');
                return res.redirect('/profile');
            }
            // Verifica caratteri speciali eccessivi
            const specialCharRegex = /^[a-zA-Z0-9\s\-\+\#\.\&\/]+$/;
            if (!specialCharRegex.test(skill)) {
                req.flash('error_msg', 'Le competenze possono contenere solo lettere, numeri e alcuni caratteri speciali (-, +, #, ., &, /).');
                return res.redirect('/profile');
            }
        }
        
        // Rimuovi duplicati
        skills = [...new Set(skills)];
        
        // Limite massimo di competenze
        if (skills.length > 10) {
            req.flash('error_msg', 'Non puoi aggiungere più di 10 competenze.');
            return res.redirect('/profile');
        }
        
        // Rimuove tutte le competenze esistenti
        await db.run('DELETE FROM skills WHERE username = ?', [req.user.username]);
        
        // Inserisce le nuove competenze
        if (skills.length > 0) {
            for (const skill of skills) {
                await db.run('INSERT INTO skills (username, skill) VALUES (?, ?)', [req.user.username, skill.trim()]);
            }
        }
        
        req.flash('success_msg', 'Competenze aggiornate con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore aggiornamento competenze:', err);
        req.flash('error_msg', 'Errore durante l\'aggiornamento delle competenze.');
        res.redirect('/profile');
    }
});

export default router;
