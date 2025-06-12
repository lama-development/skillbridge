"use strict";

import express from 'express';
import db from '../database/db.js';
import { createRequire } from "module";
import { requireAuth, requireOnboarding } from '../middleware/auth.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

// Funzione helper per recuperare i dati di un profilo
async function getUserProfileData(username) {
    const [userPosts, userSkills] = await Promise.all([
        db.all('SELECT * FROM posts WHERE username = ? ORDER BY createdAt DESC', [username])
            .catch(() => []),
        db.all('SELECT skill FROM skills WHERE username = ?', [username])
            .catch(() => [])
    ]);
    
    return {
        posts: userPosts || [],
        skills: userSkills.map(s => s.skill)
    };
}

// Profilo dell'utente loggato
router.get('/', requireAuth, requireOnboarding, async (req, res) => {
    try {
        // Recupera post e competenze dell'utente
        const profileData = await getUserProfileData(req.user.username);
        
        // Aggiunge le skills all'oggetto user
        req.user.skills = profileData.skills;
        
        res.render('profile', { 
            user: req.user, 
            package: pkg,
            userPosts: profileData.posts,
            isOwnProfile: true,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Errore caricamento profilo:', error);
        req.flash('error_msg', 'Si è verificato un errore nel caricamento del profilo.');
        res.redirect('/');
    }
});

// Profilo di un altro utente
router.get('/:username', async (req, res) => {
    try {
        const username = req.params.username;
        
        // Se l'utente loggato sta visualizzando il proprio profilo, reindirizza
        if (req.isAuthenticated() && username === req.user.username) {
            return res.redirect('/profile');
        }
        
        // Cerca l'utente nel database
        const otherUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!otherUser) {
            req.flash('error_msg', 'Utente non trovato.');
            return res.redirect('/');
        }
        
        // Recupera i dati del profilo
        const profileData = await getUserProfileData(otherUser.username);
        
        // Aggiunge le skills all'oggetto user
        otherUser.skills = profileData.skills;
        
        res.render('profile', { 
            user: otherUser, 
            package: pkg,
            userPosts: profileData.posts,
            isOwnProfile: false,
            currentUser: req.user || null
        });
    } catch (err) {
        console.error('Errore recupero profilo utente:', err);
        req.flash('error_msg', 'Si è verificato un errore durante il recupero del profilo.');
        return res.redirect('/');
    }
});

export default router;
