"use strict";

import express from 'express';
import db from '../database/db.js';
import { requireOnboarding, requireBusinessUser, requireFreelancerUser } from '../middleware/auth.js';

const router = express.Router();

// Crea un'offerta di lavoro (solo per le aziende)
router.post('/job-offer', requireOnboarding, requireBusinessUser, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        // Controlla che i campi obbligatori siano presenti
        if (!title || !content) {
            req.flash('error_msg', 'Titolo e descrizione sono obbligatori.');
            return res.redirect('/');
        }
        
        // Salva l'offerta di lavoro nel database
        await db.run(
            'INSERT INTO posts (username, type, title, content, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.username, 'job_offer', title, content, category || 'Altro', new Date().toISOString()]
        );
        
        req.flash('success_msg', 'Offerta di lavoro pubblicata con successo!');
        res.redirect('/');
    } catch (err) {
        console.error('Errore creazione post:', err);
        req.flash('error_msg', 'Si è verificato un errore durante la pubblicazione.');
        return res.redirect('/');
    }
});

// Crea una promozione freelancer (solo per i freelancer)
router.post('/freelancer-promo', requireOnboarding, requireFreelancerUser, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        // Controlla che i campi obbligatori siano presenti
        if (!title || !content) {
            req.flash('error_msg', 'Titolo e descrizione sono obbligatori.');
            return res.redirect('/');
        }
        
        // Salva la promozione nel database
        await db.run(
            'INSERT INTO posts (username, type, title, content, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.username, 'freelancer_promo', title, content, category || 'Altro', new Date().toISOString()]
        );
        
        req.flash('success_msg', 'Promozione pubblicata con successo!');
        res.redirect('/');
    } catch (err) {
        console.error('Errore creazione post:', err);
        req.flash('error_msg', 'Si è verificato un errore durante la pubblicazione.');
        return res.redirect('/');
    }
});

// Elimina un post (solo il proprietario può eliminarlo)
router.post('/:id/delete', requireOnboarding, async (req, res) => {
    try {
        const postId = req.params.id;
        
        // Verifica che il post esista e appartenga all'utente
        const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);
        
        if (!post) {
            req.flash('error_msg', 'Post non trovato.');
            return res.redirect('/');
        }
        
        // Solo il proprietario può eliminare il proprio post
        if (post.username !== req.user.username) {
            req.flash('error_msg', 'Non sei autorizzato a eliminare questo post.');
            return res.redirect('/');
        }
        
        // Elimina il post dal database
        await db.run('DELETE FROM posts WHERE id = ?', [postId]);
        
        req.flash('success_msg', 'Post eliminato con successo!');
        res.redirect('/');
    } catch (err) {
        console.error('Errore eliminazione post:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'eliminazione.');
        return res.redirect('/');
    }
});

export default router;