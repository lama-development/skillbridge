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
    
    // Query per prendere le offerte di lavoro con i dati dell'azienda
    const jobOffersQuery = `
        SELECT p.*, u.businessName, u.website, u.profilePicture 
        FROM posts p 
        JOIN users u ON p.userId = u.id 
        WHERE p.type = 'job_offer' 
        ORDER BY p.createdAt DESC
    `;
    
    // Query per prendere le promozioni dei freelancer con i dati dell'utente
    const freelancerPromosQuery = `
        SELECT p.*, u.firstName, u.lastName, u.website, u.profilePicture 
        FROM posts p 
        JOIN users u ON p.userId = u.id 
        WHERE p.type = 'freelancer_promo' 
        ORDER BY p.createdAt DESC
    `;
    
    // Esegui entrambe le query e renderizza la pagina
    db.all(jobOffersQuery, [], (err, jobOffers) => {
        if (err) {
            console.error('Errore durante il recupero delle offerte di lavoro:', err);
            jobOffers = [];
        }
        
        db.all(freelancerPromosQuery, [], (err, freelancerPromos) => {
            if (err) {
                console.error('Errore durante il recupero delle promozioni freelancer:', err);
                freelancerPromos = [];
            }
            
            res.render('index', { 
                showOnboardingAlert, 
                package: pkg, 
                user: req.user,
                jobOffers: jobOffers || [],
                freelancerPromos: freelancerPromos || []
            });
        });
    });
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

// Rotta POST per saltare l'onboarding
router.post('/onboarding/skip', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per accedere a questa funzionalità.');
        return res.redirect('/login');
    }

    // Semplicemente reindirizza l'utente alla pagina principale
    res.redirect('/');
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

// Rotta per la ricerca
router.get('/search', (req, res) => {
    const query = req.query.q?.trim();
    
    if (!query) {
        return res.redirect('/');
    }

    // Query per cercare sia nelle offerte di lavoro che nelle promozioni freelancer
    const searchQuery = `
        SELECT 
            p.*,
            u.businessName,
            u.firstName,
            u.lastName,
            u.website,
            u.profilePicture
        FROM posts p
        JOIN users u ON p.userId = u.id
        WHERE (
            p.title LIKE ? OR 
            p.content LIKE ?
        )
        ORDER BY p.createdAt DESC
    `;

    const searchParam = `%${query}%`;
    
    db.all(searchQuery, [searchParam, searchParam], (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca:', err);
            req.flash('error_msg', 'Si è verificato un errore durante la ricerca.');
            return res.redirect('/');
        }
        
        res.render('search', { 
            query,
            results: results || [],
            package: pkg,
            user: req.user
        });
    });
});

// Rotta per la pagina chat
router.get('/chat', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per accedere alla chat.');
        return res.redirect('/login');
    }
    
    if (!req.user.type) {
        req.flash('error_msg', 'Completa l\'onboarding per accedere alla chat.');
        return res.redirect('/onboarding');
    }
    
    // In futuro qui potresti caricare le conversazioni dell'utente dal database
    // Per ora renderizziamo semplicemente la pagina chat
    res.render('chat', { 
        user: req.user, 
        package: pkg 
    });
});

export default router;