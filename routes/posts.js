"use strict";

import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Middleware per verificare se l'utente ha completato l'onboarding
const isOnboardingComplete = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per accedere a questa funzionalità.');
        return res.redirect('/login');
    }
    if (!req.user.type) {
        req.flash('error_msg', 'Completa l\'onboarding per accedere a questa funzionalità.');
        return res.redirect('/onboarding');
    }
    next();
};

// Middleware per verificare se l'utente è un'azienda
const isBusinessUser = (req, res, next) => {
    if (req.user.type !== 'business') {
        req.flash('error_msg', 'Solo le aziende possono pubblicare offerte di lavoro.');
        return res.redirect('/');
    }
    next();
};

// Middleware per verificare se l'utente è un freelancer
const isFreelancerUser = (req, res, next) => {
    if (req.user.type !== 'freelancer') {
        req.flash('error_msg', 'Solo i freelancer possono promuovere i propri servizi.');
        return res.redirect('/');
    }
    next();
};

// Creazione di un post di offerta di lavoro (solo aziende)
router.post('/job-offer', isOnboardingComplete, isBusinessUser, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        // Validazione dei dati
        if (!title || !content) {
            req.flash('error_msg', 'Titolo e descrizione sono obbligatori.');
            return res.redirect('/');
        }
        
        // Inserimento nel database con async/await
        await db.run(
            'INSERT INTO posts (userId, type, title, content, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.username, 'job_offer', title, content, category || 'Altro', new Date().toISOString()]
        );
        
        req.flash('success_msg', 'Offerta di lavoro pubblicata con successo!');
        res.redirect('/');
    } catch (err) {
        console.error('Errore durante la creazione del post:', err);
        req.flash('error_msg', 'Si è verificato un errore durante la pubblicazione dell\'offerta.');
        return res.redirect('/');
    }
});

// Creazione di un post di promozione freelancer (solo freelancer)
router.post('/freelancer-promo', isOnboardingComplete, isFreelancerUser, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        // Validazione dei dati
        if (!title || !content) {
            req.flash('error_msg', 'Titolo e descrizione sono obbligatori.');
            return res.redirect('/');
        }
        
        // Inserimento nel database con async/await
        await db.run(
            'INSERT INTO posts (userId, type, title, content, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.username, 'freelancer_promo', title, content, category || 'Altro', new Date().toISOString()]
        );
        
        req.flash('success_msg', 'Promozione dei tuoi servizi pubblicata con successo!');
        res.redirect('/');
    } catch (err) {
        console.error('Errore durante la creazione del post:', err);
        req.flash('error_msg', 'Si è verificato un errore durante la pubblicazione della promozione.');
        return res.redirect('/');
    }
});

// Eliminazione di un post (solo il proprietario può eliminare i propri post)
router.post('/:id/delete', isOnboardingComplete, async (req, res) => {
    try {
        const postId = req.params.id;
        
        // Prima verifichiamo che l'utente sia il proprietario del post
        const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);
        
        if (!post) {
            req.flash('error_msg', 'Post non trovato.');
            return res.redirect('/');
        }
        
        // Verifica che l'utente sia il proprietario del post
        if (post.userId !== req.user.username) {
            req.flash('error_msg', 'Non sei autorizzato a eliminare questo post.');
            return res.redirect('/');
        }
        
        // Eliminazione del post
        await db.run('DELETE FROM posts WHERE id = ?', [postId]);
        
        req.flash('success_msg', 'Post eliminato con successo!');
        res.redirect('/');
    } catch (err) {
        console.error('Errore durante l\'eliminazione del post:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'eliminazione del post.');
        return res.redirect('/');
    }
});

export default router;