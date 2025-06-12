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
        
        // Aggiorna nel database
        await db.run('UPDATE users SET bio = ? WHERE username = ?', [bio, req.user.username]);
        
        // Aggiorna nell'oggetto utente della sessione
        req.user.bio = bio;
        
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
          // Validazione del numero di telefono (se fornito)
        if (phone && phone.trim()) {
            const phoneRegex = /^[\d\s\+]+$/;
            if (!phoneRegex.test(phone.trim())) {
                req.flash('error_msg', 'Il numero di telefono può contenere solo numeri, spazi e +.');
                return res.redirect('/profile');
            }
        }
        
        // Aggiunge https:// al sito web se mancante
        let validWebsite = website ? website.trim() : null;
        if (validWebsite && !validWebsite.startsWith('http://') && !validWebsite.startsWith('https://')) {
            validWebsite = 'https://' + validWebsite;
        }
        
        // Aggiorna i contatti nel database
        await db.run(
            'UPDATE users SET website = ?, phone = ?, name = ?, location = ? WHERE username = ?',
            [validWebsite, phone, name, location, req.user.username]
        );
        
        // Aggiorna nell'oggetto utente della sessione
        req.user.website = validWebsite;
        req.user.phone = phone;
        req.user.location = location;
        req.user.name = name;
        
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
            skills = req.body.skills.filter(Boolean);
        }
        
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
