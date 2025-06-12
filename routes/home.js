"use strict";

import express from 'express';
import { createRequire } from "module";
import db from '../database/db.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Mostra avviso onboarding se l'utente è loggato ma non ha completato la registrazione
        const showOnboardingAlert = req.isAuthenticated() && !req.user.type;
        
        // Numero massimo di post da mostrare per categoria
        const POST_LIMIT = 3;
        
        // Query per recuperare le offerte di lavoro più recenti
        const businessPostsQuery = `
            SELECT p.*, u.name, u.website, u.profilePicture, u.username 
            FROM posts p 
            JOIN users u ON p.username = u.username 
            WHERE p.type = 'job_offer' 
            ORDER BY p.createdAt DESC
            LIMIT ?
        `;
        
        // Query per recuperare le promozioni freelancer più recenti
        const freelancerPostsQuery = `
            SELECT p.*, u.name, u.website, u.profilePicture, u.username 
            FROM posts p 
            JOIN users u ON p.username = u.username
            WHERE p.type = 'freelancer_promo' 
            ORDER BY p.createdAt DESC
            LIMIT ?
        `;
        
        // Query per contare tutti i post per categoria
        const businessCountQuery = `SELECT COUNT(*) as total FROM posts WHERE type = 'job_offer'`;
        const freelancerCountQuery = `SELECT COUNT(*) as total FROM posts WHERE type = 'freelancer_promo'`;
        
        // Esegue tutte le query in parallelo per migliorare le performance
        const [businessPosts, freelancerPosts, businessCount, freelancerCount] = await Promise.all([
            db.all(businessPostsQuery, [POST_LIMIT]).catch(() => []),
            db.all(freelancerPostsQuery, [POST_LIMIT]).catch(() => []),
            db.get(businessCountQuery).catch(() => ({ total: 0 })),
            db.get(freelancerCountQuery).catch(() => ({ total: 0 }))
        ]);
        
        // Renderizza la homepage con tutti i dati
        res.render('index', { 
            showOnboardingAlert, 
            package: pkg, 
            user: req.user,
            businessPosts: businessPosts || [],
            freelancerPosts: freelancerPosts || [],
            businessCount: businessCount?.total || 0,
            freelancerCount: freelancerCount?.total || 0
        });
    } catch (error) {
        console.error('Errore homepage:', error);
        res.status(500).send('Si è verificato un errore');
    }
});

export default router;
