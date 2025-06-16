"use strict";

import express from 'express';
import * as dao from '../database/dao.js';
import { requireOnboarding, requireBusinessUser, requireFreelancerUser } from '../middleware/auth.js';

const router = express.Router();

// Crea un'offerta di lavoro (solo per le aziende)
router.post('/job-offer', requireOnboarding, requireBusinessUser, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        // Validazione campi obbligatori
        if (!title || !content) {
            req.flash('error_msg', 'Titolo e descrizione sono obbligatori.');
            return res.redirect('/');
        }
        
        if (title.trim().length > 200) {
            req.flash('error_msg', 'Il titolo non può superare i 200 caratteri.');
            return res.redirect('/');
        }
        
        // Validazione lunghezza contenuto
        if (content.trim().length > 5000) {
            req.flash('error_msg', 'La descrizione non può superare i 5000 caratteri.');
            return res.redirect('/');
        }
          // Validazione categoria
        const validCategories = ['Sviluppo', 'Design', 'Marketing', 'Copywriting', 'Traduzioni', 'Altro'];
        const validCategory = validCategories.includes(category) ? category : 'Altro';
        // Sanitizzazione input
        const sanitizedTitle = title.trim();
        const sanitizedContent = content.trim();
        // Salva l'offerta di lavoro nel database
        await dao.createPost(req.user.username, 'job_offer', sanitizedTitle, sanitizedContent, validCategory);
        
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
        
        // Validazione campi obbligatori
        if (!title || !content) {
            req.flash('error_msg', 'Titolo e descrizione sono obbligatori.');
            return res.redirect('/');
        }
        
        if (title.trim().length > 200) {
            req.flash('error_msg', 'Il titolo non può superare i 200 caratteri.');
            return res.redirect('/');
        }
        
        // Validazione lunghezza contenuto     
        if (content.trim().length > 5000) {
            req.flash('error_msg', 'La descrizione non può superare i 5000 caratteri.');
            return res.redirect('/');
        }
        // Validazione categoria
        const validCategories = ['Sviluppo', 'Design', 'Marketing', 'Copywriting', 'Traduzioni', 'Altro'];
        const validCategory = validCategories.includes(category) ? category : 'Altro';
        // Sanitizzazione input
        const sanitizedTitle = title.trim();
        const sanitizedContent = content.trim();
        // Salva la promozione nel database
        await dao.createPost(req.user.username, 'freelancer_promo', sanitizedTitle, sanitizedContent, validCategory);
        
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
        
        // Validazione ID post
        if (!postId || isNaN(parseInt(postId))) {
            req.flash('error_msg', 'ID post non valido.');
            return res.redirect('/');
        }
        
        // Verifica che il post esista e appartenga all'utente
        const post = await dao.findPostById(postId);
        
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
        await dao.deletePostById(postId);
        
        req.flash('success_msg', 'Post eliminato con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore eliminazione post:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'eliminazione.');
        return res.redirect('/');
    }
});

export default router;