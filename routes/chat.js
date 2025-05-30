"use strict";

import express from 'express';
import db from '../database/db.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

// Middleware per verificare se l'utente ha completato l'onboarding
const isOnboardingComplete = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
        return res.redirect('/login');
    }
    if (!req.user.type) {
        req.flash('error_msg', 'Completa l\'onboarding per accedere a questa funzionalità.');
        return res.redirect('/onboarding');
    }
    next();
};

// Middleware per verificare se l'utente può chattare con un altro utente
// (solo tra freelancer e business, non tra stesso tipo)
const isValidChatPartner = async (req, res, next) => {
    try {
        const otherUsername = req.params.username;
        
        // Recupera il tipo dell'altro utente
        const otherUser = await db.get('SELECT * FROM users WHERE username = ?', [otherUsername]);
        
        if (!otherUser) {
            req.flash('error_msg', 'Utente non trovato.');
            return res.redirect('/chat');
        }
        
        // Verifica che i tipi di utente siano compatibili per chattare
        if (req.user.type === otherUser.type) {
            req.flash('error_msg', 'Non puoi chattare con utenti dello stesso tipo. Le chat sono consentite solo tra freelancer e aziende.');
            return res.redirect('/chat');
        }
        
        // Continua con la richiesta
        next();
    } catch (err) {
        console.error('Errore nella verifica della compatibilità degli utenti:', err);
        req.flash('error_msg', 'Si è verificato un errore durante la verifica della compatibilità degli utenti.');
        return res.redirect('/chat');
    }
};

// Rotta per la pagina chat principale
router.get('/', isOnboardingComplete, async (req, res) => {
    try {
        // Recupera le conversazioni dell'utente
        const conversations = await db.all(`
            SELECT DISTINCT c.*, 
                CASE 
                    WHEN c.username1 = ? THEN c.username2 
                    ELSE c.username1 
                END as otherUser,
                u.name, u.profilePicture, u.type
            FROM conversations c
            LEFT JOIN users u ON (
                CASE 
                    WHEN c.username1 = ? THEN u.username = c.username2 
                    ELSE u.username = c.username1 
                END
            )
            WHERE c.username1 = ? OR c.username2 = ?
            ORDER BY c.updatedAt DESC
        `, [req.user.username, req.user.username, req.user.username, req.user.username]);
        res.render('chat', { 
            user: req.user,
            package: pkg,
            conversations: conversations || [],
            selectedConversation: null,
            messages: []
        });
    } catch (err) {
        console.error('Errore durante il caricamento delle conversazioni:', err);
        req.flash('error_msg', 'Si è verificato un errore durante il caricamento delle conversazioni.');
        res.redirect('/');
    }
});

// Rotta per iniziare una conversazione con un utente specifico
router.get('/:username', isOnboardingComplete, isValidChatPartner, async (req, res) => {
    try {
        const otherUsername = req.params.username;
        // Verifica che l'altro utente esista
        const otherUser = await db.get('SELECT * FROM users WHERE username = ?', [otherUsername]);
        if (!otherUser) {
            req.flash('error_msg', 'Utente non trovato.');
            return res.redirect('/chat');
        }
        // Non permettere di chattare con se stessi
        if (otherUsername === req.user.username) {
            req.flash('error_msg', 'Non puoi avviare una conversazione con te stesso.');
            return res.redirect('/chat');
        }
        // Cerca se esiste già una conversazione tra i due utenti
        let conversation = await db.get(`
            SELECT * FROM conversations 
            WHERE (username1 = ? AND username2 = ?) OR (username1 = ? AND username2 = ?)
        `, [req.user.username, otherUsername, otherUsername, req.user.username]);
        // Se non esiste, creala
        if (!conversation) {
            // Doppio controllo per sicurezza - verifichiamo nuovamente i tipi di utente
            if (req.user.type === otherUser.type) {
                req.flash('error_msg', 'Non puoi chattare con utenti dello stesso tipo. Le chat sono consentite solo tra freelancer e aziende.');
                return res.redirect('/chat');
            }
            
            const result = await db.run(`
                INSERT INTO conversations (username1, username2) 
                VALUES (?, ?)
            `, [req.user.username, otherUsername]);
            
            conversation = await db.get('SELECT * FROM conversations WHERE id = ?', [result.lastID]);
        }
        // Recupera tutti i messaggi della conversazione
        const messages = await db.all(`
            SELECT m.*, u.profilePicture 
            FROM messages m
            LEFT JOIN users u ON m.senderUsername = u.username
            WHERE m.conversationId = ?
            ORDER BY m.createdAt ASC
        `, [conversation.id]);
        // Recupera tutte le conversazioni per la sidebar
        const conversations = await db.all(`
            SELECT DISTINCT c.*, 
                CASE 
                    WHEN c.username1 = ? THEN c.username2 
                    ELSE c.username1 
                END as otherUser,
                u.name, u.profilePicture, u.type
            FROM conversations c
            LEFT JOIN users u ON (
                CASE 
                    WHEN c.username1 = ? THEN u.username = c.username2 
                    ELSE u.username = c.username1 
                END
            )
            WHERE c.username1 = ? OR c.username2 = ?
            ORDER BY c.updatedAt DESC
        `, [req.user.username, req.user.username, req.user.username, req.user.username]);
        res.render('chat', { 
            user: req.user,
            package: pkg,
            conversations: conversations || [],
            selectedConversation: conversation,
            otherUser: otherUser,
            messages: messages || []
        });
    } catch (err) {
        console.error('Errore durante il caricamento della conversazione:', err);
        req.flash('error_msg', 'Si è verificato un errore durante il caricamento della conversazione.');
        res.redirect('/chat');
    }
});

// Rotta per inviare un messaggio
router.post('/:username/send', isOnboardingComplete, isValidChatPartner, async (req, res) => {
    try {
        const otherUsername = req.params.username;
        const { message } = req.body;
        if (!message || message.trim() === '') {
            req.flash('error_msg', 'Il messaggio non può essere vuoto.');
            return res.redirect(`/chat/${otherUsername}`);
        }
        // Verifica che l'altro utente esista
        const otherUser = await db.get('SELECT * FROM users WHERE username = ?', [otherUsername]);
        if (!otherUser) {
            req.flash('error_msg', 'Utente non trovato.');
            return res.redirect('/chat');
        }
        // Cerca se esiste già una conversazione tra i due utenti
        let conversation = await db.get(`
            SELECT * FROM conversations 
            WHERE (username1 = ? AND username2 = ?) OR (username1 = ? AND username2 = ?)
        `, [req.user.username, otherUsername, otherUsername, req.user.username]);
        // Se non esiste, creala
        if (!conversation) {
            // Doppio controllo per sicurezza - verifichiamo nuovamente i tipi di utente
            if (req.user.type === otherUser.type) {
                req.flash('error_msg', 'Non puoi chattare con utenti dello stesso tipo. Le chat sono consentite solo tra freelancer e aziende.');
                return res.redirect('/chat');
            }
            
            const result = await db.run(`
                INSERT INTO conversations (username1, username2) 
                VALUES (?, ?)
            `, [req.user.username, otherUsername]);
            
            conversation = await db.get('SELECT * FROM conversations WHERE id = ?', [result.lastID]);
        }
        // Inserisci il messaggio
        await db.run(`
            INSERT INTO messages (conversationId, senderUsername, content) 
            VALUES (?, ?, ?)
        `, [conversation.id, req.user.username, message.trim()]);
        // Aggiorna il timestamp della conversazione
        await db.run(`
            UPDATE conversations SET updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [conversation.id]);
        res.redirect(`/chat/${otherUsername}`);
    } catch (err) {
        console.error('Errore durante l\'invio del messaggio:', err);
        req.flash('error_msg', 'Si è verificato un errore durante l\'invio del messaggio.');
        res.redirect(`/chat/${req.params.username}`);
    }
});

export default router;