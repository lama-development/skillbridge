"use strict";

import express from 'express';
import db from '../database/db.js';
import { createRequire } from "module";
import upload from '../public/js/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
        SELECT p.*, u.businessName, u.website, u.profilePicture, u.username 
        FROM posts p 
        JOIN users u ON p.userId = u.id 
        WHERE p.type = 'job_offer' 
        ORDER BY p.createdAt DESC
    `;
    
    // Query per prendere le promozioni dei freelancer con i dati dell'utente
    const freelancerPromosQuery = `
        SELECT p.*, u.firstName, u.lastName, u.website, u.profilePicture, u.username 
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
    
    // Controlla se l'utente ha già completato l'onboarding
    if (req.user.type) {
        req.flash('info_msg', 'Hai già completato l\'onboarding.');
        return res.redirect('/');
    }
    
    res.render('onboarding');
});

// Rotta POST per processare l'onboarding
router.post('/onboarding', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per completare l\'onboarding.');
        return res.redirect('/login');
    }    const { type, firstName, lastName, businessName, website, phone } = req.body;
    let updateQuery, updateData;

    if (type === 'freelancer') {
        updateQuery = 'UPDATE users SET type = ?, firstName = ?, lastName = ?, website = ?, phone = ? WHERE id = ?';
        updateData = [type, firstName, lastName, website, phone, req.user.id];
    } else if (type === 'business') {
        updateQuery = 'UPDATE users SET type = ?, businessName = ?, website = ?, phone = ? WHERE id = ?';
        updateData = [type, businessName, website, phone, req.user.id];
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
        req.flash('error_msg', 'Devi essere loggato per accedere al tuo profilo.');
        return res.redirect('/login');
    }
    if (!req.user.type) {
        req.flash('error_msg', 'Completa l\'onboarding per accedere al profilo.');
        return res.redirect('/onboarding');
    }
    
    // Query per recuperare gli annunci pubblicati dall'utente
    const userPostsQuery = `
        SELECT * FROM posts 
        WHERE userId = ? 
        ORDER BY createdAt DESC
    `;
    
    db.all(userPostsQuery, [req.user.id], (err, userPosts) => {
        if (err) {
            console.error('Errore durante il recupero degli annunci dell\'utente:', err);
            userPosts = [];
        }
        
        res.render('profile', { 
            user: req.user, 
            package: pkg,
            userPosts: userPosts || [],
            isOwnProfile: true, // È il profilo dell'utente loggato
            currentUser: req.user
        });
    });
});

// Rotta per visualizzare il profilo di un altro utente
router.get('/profile/:username', (req, res) => {
    const username = req.params.username;
    
    // Controllo se l'utente è autenticato e sta cercando di visualizzare il proprio profilo
    if (req.isAuthenticated() && username === req.user.username) {
        return res.redirect('/profile');
    }
    
    // Query per recuperare i dati dell'utente tramite username
    const userQuery = 'SELECT * FROM users WHERE username = ?';
    
    // Query per recuperare gli annunci pubblicati dall'utente (useremo l'id trovato)
    const userPostsQuery = `
        SELECT * FROM posts 
        WHERE userId = ? 
        ORDER BY createdAt DESC
    `;
    db.get(userQuery, [username], (err, otherUser) => {
        if (err) {
            console.error('Errore durante il recupero dei dati dell\'utente:', err);
            req.flash('error_msg', 'Si è verificato un errore durante il recupero dei dati dell\'utente.');
            return res.redirect('/');
        }
        
        if (!otherUser) {
            req.flash('error_msg', 'Utente non trovato.');
            return res.redirect('/');
        }
        
        db.all(userPostsQuery, [otherUser.id], (err, userPosts) => {
            if (err) {
                console.error('Errore durante il recupero degli annunci dell\'utente:', err);
                userPosts = [];
            }
            
            res.render('profile', { 
                user: otherUser, 
                package: pkg,
                userPosts: userPosts || [],
                isOwnProfile: false, // Non è il profilo dell'utente loggato
                currentUser: req.user || null // Passa l'utente attuale (null se ospite)
            });
        });
    });
});

// Rotta per la ricerca
router.get('/search', (req, res) => {
    const query = req.query.q?.trim();
    const category = req.query.category?.trim();
    
    if (!query) {
        return res.redirect('/');
    }
    
    // Costruisci la query in base ai parametri di ricerca
    let searchQuery = `
        SELECT 
            p.*,
            u.businessName,
            u.firstName,
            u.lastName,
            u.website,
            u.profilePicture,
            u.username
        FROM posts p
        JOIN users u ON p.userId = u.id
        WHERE (
            p.title LIKE ? OR 
            p.content LIKE ? OR
            u.businessName LIKE ? OR
            (u.firstName || ' ' || u.lastName) LIKE ?
        )
    `;

    const queryParams = [];
    const searchParam = `%${query}%`;
    queryParams.push(searchParam, searchParam, searchParam, searchParam);
    
    // Aggiungi filtro per categoria se specificato
    if (category) {
        searchQuery += ` AND p.category = ?`;
        queryParams.push(category);
    }
    
    // Aggiungi ordinamento
    searchQuery += ` ORDER BY p.createdAt DESC`;
    
    db.all(searchQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca:', err);
            req.flash('error_msg', 'Si è verificato un errore durante la ricerca.');
            return res.redirect('/');
        }
        
        res.render('search', { 
            query,
            selectedCategory: category || '',
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

// Rotta POST per l'upload della foto profilo
router.post('/profile/upload-photo', upload.single('profilePicture'), (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per modificare la foto profilo.');
        return res.redirect('/login');
    }
    
    if (!req.file) {
        req.flash('error_msg', 'Nessun file è stato caricato o è avvenuto un errore.');
        return res.redirect('/profile');
    }
    
    // Percorso relativo all'immagine per la memorizzazione nel database
    // Per renderlo accessibile tramite browser, salviamo il percorso relativo a /public
    const relativePath = `/uploads/${req.file.filename}`;
    
    // Aggiorna il profilo dell'utente con il nuovo percorso dell'immagine
    db.run('UPDATE users SET profilePicture = ? WHERE id = ?', [relativePath, req.user.id], function(err) {
        if (err) {
            console.error('Errore durante l\'aggiornamento della foto profilo:', err);
            req.flash('error_msg', 'Si è verificato un errore durante l\'aggiornamento della foto profilo.');
            return res.redirect('/profile');
        }
        
        // Aggiorna la foto profilo nell'oggetto utente nella sessione
        req.user.profilePicture = relativePath;
        
        req.flash('success_msg', 'Foto profilo aggiornata con successo!');
        res.redirect('/profile');
    });
});

// Rotta POST per rimuovere la foto profilo
router.post('/profile/remove-photo', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per modificare la foto profilo.');
        return res.redirect('/login');
    }
    
    // Verifica se l'utente ha una foto profilo personalizzata
    if (req.user.profilePicture === 'img/profile.png' || !req.user.profilePicture) {
        req.flash('info_msg', 'Non hai una foto profilo personalizzata da rimuovere.');
        return res.redirect('/profile');
    }
    
    // Percorso completo del file della foto profilo attuale
    const fullPath = path.join(__dirname, '../public', req.user.profilePicture);
    
    // Verifica se il file esiste e non è l'immagine predefinita
    if (req.user.profilePicture !== 'img/profile.png' && fs.existsSync(fullPath)) {
        // Rimuovi il file
        try {
            fs.unlinkSync(fullPath);
        } catch (err) {
            console.error('Errore durante la rimozione del file della foto profilo:', err);
            // Continua comunque con l'aggiornamento del DB
        }
    }
    
    // Imposta l'immagine predefinita nel database
    db.run('UPDATE users SET profilePicture = ? WHERE id = ?', ['img/profile.png', req.user.id], function(err) {
        if (err) {
            console.error('Errore durante il reset della foto profilo:', err);
            req.flash('error_msg', 'Si è verificato un errore durante la rimozione della foto profilo.');
            return res.redirect('/profile');
        }
        
        // Aggiorna la foto profilo nell'oggetto utente nella sessione
        req.user.profilePicture = 'img/profile.png';
        
        req.flash('success_msg', 'Foto profilo rimossa con successo!');
        res.redirect('/profile');
    });
});

export default router;