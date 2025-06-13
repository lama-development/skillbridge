"use strict";

import express from 'express';
import { createRequire } from "module";
import * as dao from '../database/dao.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Mostra avviso onboarding se l'utente è loggato ma non ha completato la registrazione
        const showOnboardingAlert = req.isAuthenticated() && !req.user.type;
        
        // Numero massimo di post da mostrare per categoria
        const POST_LIMIT = 3;
        
        // Esegue tutte le query in parallelo per migliorare le performance
        const [businessPosts, freelancerPosts, businessCount, freelancerCount] = await Promise.all([
            dao.getPostsByType('job_offer', POST_LIMIT).catch(() => []),
            dao.getPostsByType('freelancer_promo', POST_LIMIT).catch(() => []),
            dao.countPostsByType('job_offer').catch(() => ({ total: 0 })),
            dao.countPostsByType('freelancer_promo').catch(() => ({ total: 0 }))
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