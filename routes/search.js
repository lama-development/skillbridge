"use strict";

import express from 'express';
import * as dao from '../database/dao.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

// Pagina di ricerca con filtri e paginazione
router.get('/', async (req, res) => {
    try {
        // Estrae i parametri di ricerca dalla query string
        let query = req.query.q?.trim();
        let category = req.query.category?.trim();
        let type = req.query.type?.trim();
        const page = parseInt(req.query.page) || 1;
        const RESULTS_PER_PAGE = 5;
        
        // Validazione parametri di ricerca
        if (query && query.length > 80) {
            req.flash('error_msg', 'La ricerca non può superare 80 caratteri.');
            query = query.substring(0, 80);
        }
        // Validazione categoria
        const validCategories = ['Sviluppo', 'Design', 'Marketing', 'Copywriting', 'Traduzioni', 'Altro', 'all'];
        if (category && !validCategories.includes(category)) {
            category = null;
        }
        
        // Validazione tipo
        const validTypes = ['job_offer', 'freelancer_promo'];
        if (type && !validTypes.includes(type)) {
            type = null;
        }
        
        // Validazione pagina
        if (page < 1 || page > 100) { // Limite per evitare abusi
            return res.redirect('/search?' + new URLSearchParams({ q: query || '', category: category || '' }).toString());
        }
        
        // Se non ci sono criteri di ricerca validi, torna alla homepage
        if (!query && !category) {
            return res.redirect('/');
        }
        
        // Costruisce le query base per conteggio e risultati
        let baseCondition = 'WHERE 1=1';
        const params = [];
        
        // Filtro basato sul tipo di utente per mostrare solo post rilevanti
        if (req.user && req.user.type) {
            // Se l'utente è un freelancer, mostra solo offerte di lavoro (da aziende)
            if (req.user.type === 'freelancer') {
                baseCondition += ' AND p.type = ?';
                params.push('job_offer');
            }
            // Se l'utente è un'azienda, mostra solo promozioni freelancer
            else if (req.user.type === 'business') {
                baseCondition += ' AND p.type = ?';
                params.push('freelancer_promo');
            }
        }
        // Se non è loggato (ospite), mostra tutti i post (nessun filtro aggiunto)
        
        // Aggiunge filtro per testo di ricerca
        if (query) {
            baseCondition += ' AND (p.title LIKE ? OR p.content LIKE ? OR p.category LIKE ? OR u.name LIKE ?)';
            const searchTerm = `%${query}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Aggiunge filtro per tipo di post (solo se specificato esplicitamente e utente non autenticato)
        if (type && (type === 'job_offer' || type === 'freelancer_promo') && (!req.user || !req.user.type)) {
            baseCondition += ' AND p.type = ?';
            params.push(type);
        }
        
        // Aggiunge filtro per categoria
        if (category && category !== 'all') {
            baseCondition += ' AND p.category = ?';
            params.push(category);
        }
          // Esegue entrambe le query in parallelo usando il DAO
        const [posts, countResult] = await Promise.all([
            dao.searchPosts(baseCondition, params, RESULTS_PER_PAGE, (page - 1) * RESULTS_PER_PAGE),
            dao.countSearchResults(baseCondition, params)
        ]);
        
        // Calcola i dati per la paginazione
        const totalResults = countResult.total;
        const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

        // Renderizza la pagina di ricerca
        res.render('search', {
            posts: posts || [],
            query,
            category,
            type,
            package: pkg,
            user: req.user,
            pagination: {
                page,
                totalPages,
                totalResults,
                resultsPerPage: RESULTS_PER_PAGE,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        console.error('Errore durante la ricerca:', err);
        req.flash('error_msg', 'Si è verificato un errore durante la ricerca.');
        return res.redirect('/');
    }
});

export default router;