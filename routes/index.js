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
router.get('/', async (req, res) => {
    try {
        // Mostra un alert per l'onboarding se l'utente è autenticato ma non ha completato l'onboarding
        let showOnboardingAlert = false;
        if (req.isAuthenticated() && !req.user.type) {
            showOnboardingAlert = true;
        }
          // Query per prendere le offerte di lavoro con i dati dell'azienda
        const businessPostsQuery = `
            SELECT p.*, u.businessName, u.website, u.profilePicture, u.username 
            FROM posts p 
            JOIN users u ON p.userId = u.username 
            WHERE p.type = 'job_offer' 
            ORDER BY p.createdAt DESC
        `;
          // Query per prendere le promozioni dei freelancer con i dati dell'utente
        const freelancerPostsQuery = `
            SELECT p.*, u.fullName, u.website, u.profilePicture, u.username 
            FROM posts p 
            JOIN users u ON p.userId = u.username
            WHERE p.type = 'freelancer_promo' 
            ORDER BY p.createdAt DESC
        `;
        
        // Esegui entrambe le query in parallelo usando async/await
        let [businessPosts, freelancerPosts] = await Promise.all([
            db.all(businessPostsQuery, []).catch(err => {
                console.error('Errore durante il recupero delle offerte di lavoro:', err);
                return [];
            }),
            db.all(freelancerPostsQuery, []).catch(err => {
                console.error('Errore durante il recupero delle promozioni freelancer:', err);
                return [];
            })
        ]);
        
        // Assicurati che businessPosts e freelancerPosts non siano null
        businessPosts = businessPosts || [];
        freelancerPosts = freelancerPosts || [];
        
        res.render('index', { 
            showOnboardingAlert, 
            package: pkg, 
            user: req.user,
            businessPosts,
            freelancerPosts
        });
    } catch (error) {
        console.error('Errore nella rotta della homepage:', error);
        res.status(500).send('Si è verificato un errore');
    }
});

// Rotta GET per il form di onboarding
router.get('/onboarding', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
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
router.post('/onboarding', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
            return res.redirect('/login');
        }    
        
        const { type, fullName, businessName, website, phone, location, defaultProfilePicture } = req.body;
        let updateQuery, updateData;

        if (type === 'freelancer') {
            updateQuery = 'UPDATE users SET type = ?, fullName = ?, website = ?, phone = ?, location = ?, profilePicture = ? WHERE username = ?';
            updateData = [type, fullName, website, phone, location, defaultProfilePicture, req.user.username];
        } else if (type === 'business') {
            updateQuery = 'UPDATE users SET type = ?, businessName = ?, website = ?, phone = ?, location = ?, profilePicture = ? WHERE username = ?';
            updateData = [type, businessName, website, phone, location, defaultProfilePicture, req.user.username];
        } else {
            req.flash('error_msg', 'Tipo utente non valido.');
            return res.redirect('/onboarding');
        }

        await db.run(updateQuery, updateData);
        req.flash('success_msg', 'Onboarding completato con successo!');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Errore durante l\'onboarding.');
        return res.redirect('/onboarding');
    }
});

// Rotta POST per saltare l'onboarding
router.post('/onboarding/skip', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
        return res.redirect('/login');
    }

    // Semplicemente reindirizza l'utente alla pagina principale
    res.redirect('/');
});

// Rotta per la pagina del profilo
router.get('/profile', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
            return res.redirect('/login');
        }
        if (!req.user.type) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
            return res.redirect('/onboarding');
        }
        
        // Query per recuperare gli annunci pubblicati dall'utente
        const userPostsQuery = `
            SELECT * FROM posts 
            WHERE userId = ? 
            ORDER BY createdAt DESC
        `;
          const [userPosts, userSkills] = await Promise.all([
            db.all(userPostsQuery, [req.user.username])
                .catch(err => {
                    console.error('Errore durante il recupero degli annunci dell\'utente:', err);
                    return [];
                }),
            db.all('SELECT skill FROM skills WHERE username = ?', [req.user.username])
                .catch(err => {
                    console.error('Errore durante il recupero delle competenze dell\'utente:', err);
                    return [];
                })
        ]);

        // Aggiungi le skills all'oggetto user
        req.user.skills = userSkills.map(s => s.skill);
        
        res.render('profile', { 
            user: req.user, 
            package: pkg,
            userPosts: userPosts || [],
            isOwnProfile: true, // È il profilo dell'utente loggato
            currentUser: req.user
        });
    } catch (error) {
        console.error('Errore nella rotta del profilo:', error);
        req.flash('error_msg', 'Si è verificato un errore nel caricamento del profilo.');
        res.redirect('/');
    }
});

// Rotta per visualizzare il profilo di un altro utente
router.get('/profile/:username', async (req, res) => {
    try {
        const username = req.params.username;
        
        // Controllo se l'utente è autenticato e sta cercando di visualizzare il proprio profilo
        if (req.isAuthenticated() && username === req.user.username) {
            return res.redirect('/profile');
        }
        
        // Query per recuperare i dati dell'utente tramite username
        const userQuery = 'SELECT * FROM users WHERE username = ?';
        
        // Recupera i dati dell'utente
        const otherUser = await db.get(userQuery, [username]);
        
        if (!otherUser) {
            req.flash('error_msg', 'Utente non trovato.');
            return res.redirect('/');
        }
        
        // Query per recuperare gli annunci pubblicati dall'utente
        const userPostsQuery = `
            SELECT * FROM posts 
            WHERE userId = ? 
            ORDER BY createdAt DESC
        `;
          const [userPosts, userSkills] = await Promise.all([
            db.all(userPostsQuery, [otherUser.username])
                .catch(err => {
                    console.error('Errore durante il recupero degli annunci dell\'utente:', err);
                    return [];
                }),
            db.all('SELECT skill FROM skills WHERE username = ?', [otherUser.username])
                .catch(err => {
                    console.error('Errore durante il recupero delle competenze dell\'utente:', err);
                    return [];
                })
        ]);

        // Aggiungi le skills all'oggetto user
        otherUser.skills = userSkills.map(s => s.skill);
        
        res.render('profile', { 
            user: otherUser, 
            package: pkg,
            userPosts: userPosts || [],
            isOwnProfile: false, // Non è il profilo dell'utente loggato
            currentUser: req.user || null // Passa l'utente attuale (null se ospite)
        });
    } catch (err) {
        console.error('Errore durante il recupero dei dati dell\'utente:', err);
        req.flash('error_msg', 'Si è verificato un errore durante il recupero dei dati dell\'utente.');
        return res.redirect('/');
    }
});

// Rotta per la ricerca
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q?.trim();
        const category = req.query.category?.trim();
        const page = parseInt(req.query.page) || 1; // Pagina corrente, default 1
        const resultsPerPage = 5; // Numero di risultati per pagina
        
        if (!query) {
            return res.redirect('/');
        }
        
        // Costruisci la query in base ai parametri di ricerca
        let countQuery = `
            SELECT COUNT(*) as total
            FROM posts p
            JOIN users u ON p.userId = u.username
            WHERE (
                p.title LIKE ? OR 
                p.content LIKE ? OR
                u.businessName LIKE ? OR
                u.fullName LIKE ?
            )
        `;

        let searchQuery = `
            SELECT 
                p.*,
                u.businessName,
                u.fullName,
                u.website,
                u.profilePicture,
                u.username
            FROM posts p
            JOIN users u ON p.userId = u.username
            WHERE (
                p.title LIKE ? OR 
                p.content LIKE ? OR
                u.businessName LIKE ? OR
                u.fullName LIKE ?
            )
        `;

        const queryParams = [];
        const countParams = [];
        const searchParam = `%${query}%`;
        
        // Parametri per la query di conteggio
        countParams.push(searchParam, searchParam, searchParam, searchParam);
        
        // Parametri per la query di ricerca
        queryParams.push(searchParam, searchParam, searchParam, searchParam);
          // Aggiungi filtro per categoria se specificato
        if (category) {
            countQuery += ` AND p.category = ?`;
            searchQuery += ` AND p.category = ?`;
            countParams.push(category);
            queryParams.push(category);
        }
        
        // Aggiungi ordinamento e paginazione alla query di ricerca
        searchQuery += ` ORDER BY p.createdAt DESC LIMIT ? OFFSET ?`;
        queryParams.push(resultsPerPage, (page - 1) * resultsPerPage);
        
        // Esegui entrambe le query in parallelo
        const [countResult, results] = await Promise.all([
            db.get(countQuery, countParams),
            db.all(searchQuery, queryParams)
        ]);
        
        const totalResults = countResult.total;
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        res.render('search', { 
            query,
            selectedCategory: category || '',
            results: results || [],
            package: pkg,
            user: req.user,
            pagination: {
                page,
                totalPages,
                totalResults,
                resultsPerPage,
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

// Rotta per la pagina chat
router.get('/chat', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
        return res.redirect('/login');
    }
    
    if (!req.user.type) {
        req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
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
router.post('/profile/upload-photo', upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
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
        await db.run('UPDATE users SET profilePicture = ? WHERE username = ?', [relativePath, req.user.username]);
        
        // Aggiorna la foto profilo nell'oggetto utente nella sessione
        req.user.profilePicture = relativePath;
        
        req.flash('success_msg', 'Foto profilo aggiornata con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore durante l\'aggiornamento della foto profilo:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'aggiornamento della foto profilo.');
        return res.redirect('/profile');
    }
});

// Rotta POST per rimuovere la foto profilo
router.post('/profile/remove-photo', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
            return res.redirect('/login');
        }
          // Determina l'immagine predefinita in base al tipo di utente
        const defaultProfilePicture = req.user.type === 'business' ? 'img/business.png' : 'img/freelancer.png';
        
        // Verifica se l'utente ha una foto profilo personalizzata
        if (req.user.profilePicture === defaultProfilePicture || !req.user.profilePicture) {
            req.flash('info_msg', 'Non hai una foto profilo personalizzata da rimuovere.');
            return res.redirect('/profile');
        }
        
        // Percorso completo del file della foto profilo attuale
        const fullPath = path.join(__dirname, '../public', req.user.profilePicture);
        
        // Verifica se il file esiste e non è l'immagine predefinita
        if (req.user.profilePicture !== defaultProfilePicture && fs.existsSync(fullPath)) {
            // Rimuovi il file
            try {
                fs.unlinkSync(fullPath);
            } catch (err) {
                console.error('Errore durante la rimozione del file della foto profilo:', err);
                // Continua comunque con l'aggiornamento del DB
            }
        }
        
        // Imposta l'immagine predefinita nel database in base al tipo di utente
        await db.run('UPDATE users SET profilePicture = ? WHERE username = ?', [defaultProfilePicture, req.user.username]);
          // Aggiorna la foto profilo nell'oggetto utente nella sessione
        req.user.profilePicture = defaultProfilePicture;
        
        req.flash('success_msg', 'Foto profilo rimossa con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore durante il reset della foto profilo:', err);
        req.flash('error_msg', 'Si è verificato un errore durante la rimozione della foto profilo.');
        return res.redirect('/profile');
    }
});

// Rotta POST per aggiornare la biografia
router.post('/profile/update-bio', upload.none(), async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
            return res.redirect('/login');
        }
        
        const { bio } = req.body;
        
        // Aggiorna la biografia dell'utente nel database
        await db.run('UPDATE users SET bio = ? WHERE username = ?', [bio, req.user.username]);
        
        // Aggiorna la biografia nell'oggetto utente nella sessione
        req.user.bio = bio;
        
        req.flash('success_msg', 'Biografia aggiornata con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore durante l\'aggiornamento della biografia:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'aggiornamento della biografia.');
        return res.redirect('/profile');
    }
});

// Rotta POST per aggiornare i contatti
router.post('/profile/update-contacts', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
            return res.redirect('/login');
        }
        
        const { website, phone, fullName, businessName, location } = req.body;
        
        // Validazione URL del sito web (opzionale)
        let validatedWebsite = website ? website.trim() : null;
        if (validatedWebsite && !validatedWebsite.startsWith('http://') && !validatedWebsite.startsWith('https://')) {
            validatedWebsite = 'https://' + validatedWebsite;
        }

        let query;
        const params = [];

        if (req.user.type === 'freelancer') {
            query = 'UPDATE users SET website = ?, phone = ?, fullName = ?, location = ? WHERE username = ?';
            params.push(validatedWebsite, phone, fullName, location, req.user.username);
            req.user.fullName = fullName;
        } else if (req.user.type === 'business') {
            query = 'UPDATE users SET website = ?, phone = ?, businessName = ?, location = ? WHERE username = ?';
            params.push(validatedWebsite, phone, businessName, location, req.user.username);
            req.user.businessName = businessName;
        } else {
            // Tipo utente non gestito o non dovrebbe essere qui
            req.flash('error_msg', 'Tipo utente non valido.');
            return res.redirect('/profile');
        }

        // Aggiorna i contatti dell'utente nel database
        await db.run(query, params);
        
        // Aggiorna i contatti nell'oggetto utente nella sessione
        req.user.website = validatedWebsite;
        req.user.phone = phone;
        req.user.location = location; // Added location
        if (req.user.type === 'freelancer') req.user.fullName = fullName;
        else if (req.user.type === 'business') req.user.businessName = businessName;
        
        req.flash('success_msg', 'Contatti aggiornati con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore durante l\'aggiornamento dei contatti:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'aggiornamento dei contatti.');
        return res.redirect('/profile');
    }
});

// Aggiornamento skills dell'utente
router.post('/profile/update-skills', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
            return res.redirect('/login');
        }

        // Controllo più restrittivo: solo i freelancer possono gestire le competenze
        if (req.user.type !== 'freelancer') {
            req.flash('error_msg', 'Le competenze sono disponibili solo per i profili freelancer.');
            return res.redirect('/profile');
        }

        // Assicurati che skills sia sempre un array, anche se vuoto o con un solo elemento
        const skills = Array.isArray(req.body.skills) ? req.body.skills : [req.body.skills].filter(Boolean);

        // Validazione
        if (skills.length > 10) {
            req.flash('error_msg', 'Non puoi aggiungere più di 10 competenze.');
            return res.redirect('/profile');
        }

        await db.run('DELETE FROM skills WHERE username = ?', [req.user.username]);

        if (skills.length > 0) {
            const insertSkills = skills.map(skill => ({
                username: req.user.username,
                skill: skill.trim()
            }));

            const insertQuery = 'INSERT INTO skills (username, skill) VALUES (?, ?)';
            for (const skillData of insertSkills) {
                await db.run(insertQuery, [skillData.username, skillData.skill]);
            }
        }

        req.flash('success_msg', 'Competenze aggiornate con successo!');
        res.redirect('/profile');
    } catch (err) {
        console.error('Errore durante l\'aggiornamento delle competenze:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'aggiornamento delle competenze.');
        res.redirect('/profile');
    }
});

export default router;