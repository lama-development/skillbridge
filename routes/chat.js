"use strict";

import express from 'express';
import db from '../database/db.js';
import { createRequire } from "module";
import { requireOnboarding } from '../middleware/auth.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

// Middleware per verificare compatibilità chat (freelancer <-> business)
const checkChatCompatibility = async (req, res, next) => {
    try {
        const otherUsername = req.params.username;
        
        // Cerca l'altro utente
        const otherUser = await db.get('SELECT * FROM users WHERE username = ?', [otherUsername]);
        if (!otherUser) {
            req.flash('error_msg', 'Utente non trovato.');
            return res.redirect('/chat');
        }
        
        // Verifica che i tipi siano diversi (freelancer può chattare solo con business e viceversa)
        if (req.user.type === otherUser.type) {
            req.flash('error_msg', 'Puoi chattare solo con utenti di tipo diverso (freelancer <> business).');
            return res.redirect('/chat');
        }
        
        next();
    } catch (err) {
        console.error('Errore verifica compatibilità:', err);
        req.flash('error_msg', 'Errore durante la verifica della compatibilità.');
        return res.redirect('/chat');
    }
};

// Helper per recuperare le conversazioni dell'utente
async function getUserConversations(username) {
    return db.all(`
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
    `, [username, username, username, username]);
}

// Helper per trovare o creare una conversazione
async function findOrCreateConversation(user1, user2) {
    // Cerca se esiste già una conversazione
    let conversation = await db.get(`
        SELECT * FROM conversations 
        WHERE (username1 = ? AND username2 = ?) OR (username1 = ? AND username2 = ?)
    `, [user1, user2, user2, user1]);
    
    // Se non esiste, la crea
    if (!conversation) {
        const result = await db.run(
            'INSERT INTO conversations (username1, username2) VALUES (?, ?)',
            [user1, user2]
        );
        conversation = await db.get('SELECT * FROM conversations WHERE id = ?', [result.lastID]);
    }
    
    return conversation;
}

// Pagina principale delle chat
router.get('/', requireOnboarding, async (req, res) => {
    try {
        // Recupera tutte le conversazioni dell'utente
        const conversations = await getUserConversations(req.user.username);
        
        res.render('chat', { 
            user: req.user,
            package: pkg,
            conversations: conversations || [],
            selectedConversation: null,
            messages: []
        });
    } catch (err) {
        console.error('Errore caricamento chat:', err);
        req.flash('error_msg', 'Errore durante il caricamento delle conversazioni.');
        res.redirect('/');
    }
});

// Chat con un utente specifico
router.get('/:username', requireOnboarding, checkChatCompatibility, async (req, res) => {
    try {
        const otherUsername = req.params.username;
        
        // Validazione username
        if (!otherUsername || typeof otherUsername !== 'string') {
            req.flash('error_msg', 'Username non valido.');
            return res.redirect('/chat');
        }
        
        // Validazione formato username
        const usernameRegex = /^[a-z0-9-]+$/;
        if (!usernameRegex.test(otherUsername)) {
            req.flash('error_msg', 'Username non valido.');
            return res.redirect('/chat');
        }
        
        // Non permettere di chattare con se stessi
        if (otherUsername === req.user.username) {
            req.flash('error_msg', 'Non puoi chattare con te stesso.');
            return res.redirect('/chat');
        }
        
        // Recupera i dati dell'altro utente
        const otherUser = await db.get('SELECT * FROM users WHERE username = ?', [otherUsername]);
        
        // Trova o crea la conversazione
        const conversation = await findOrCreateConversation(req.user.username, otherUsername);
        
        // Recupera i messaggi della conversazione
        const messages = await db.all(`
            SELECT m.*, u.profilePicture 
            FROM messages m
            LEFT JOIN users u ON m.senderUsername = u.username
            WHERE m.conversationId = ?
            ORDER BY m.createdAt ASC
        `, [conversation.id]);
        
        // Recupera tutte le conversazioni per la sidebar
        const conversations = await getUserConversations(req.user.username);
        
        res.render('chat', { 
            user: req.user,
            package: pkg,
            conversations: conversations || [],
            selectedConversation: conversation,
            otherUser: otherUser,
            messages: messages || []
        });
    } catch (err) {
        console.error('Errore caricamento conversazione:', err);
        req.flash('error_msg', 'Errore durante il caricamento della conversazione.');
        res.redirect('/chat');
    }
});

// Invia un messaggio
router.post('/:username/send', requireOnboarding, checkChatCompatibility, async (req, res) => {
    const isAjax = req.headers.accept?.includes('application/json');
    
    try {
        const otherUsername = req.params.username;
        const message = req.body?.message?.trim();
        
        // Validazione username
        if (!otherUsername || typeof otherUsername !== 'string') {
            const error = 'Username non valido.';
            if (isAjax) return res.status(400).json({ error });
            req.flash('error_msg', error);
            return res.redirect('/chat');
        }
        
        // Validazione formato username
        const usernameRegex = /^[a-z0-9-]+$/;
        if (!usernameRegex.test(otherUsername)) {
            const error = 'Username non valido.';
            if (isAjax) return res.status(400).json({ error });
            req.flash('error_msg', error);
            return res.redirect('/chat');
        }
        
        // Validazione messaggio
        if (!message) {
            const error = 'Il messaggio non può essere vuoto.';
            if (isAjax) return res.status(400).json({ error });
            req.flash('error_msg', error);
            return res.redirect(`/chat/${otherUsername}`);
        }
        
        // Validazione lunghezza messaggio
        if (message.length > 1000) {
            const error = 'Il messaggio non può superare i 1000 caratteri.';
            if (isAjax) return res.status(400).json({ error });
            req.flash('error_msg', error);
            return res.redirect(`/chat/${otherUsername}`);
        }
        
        // Trova o crea la conversazione
        const conversation = await findOrCreateConversation(req.user.username, otherUsername);
        
        // Inserisce il messaggio
        const messageResult = await db.run(
            'INSERT INTO messages (conversationId, senderUsername, content) VALUES (?, ?, ?)',
            [conversation.id, req.user.username, message]
        );
        
        // Aggiorna il timestamp della conversazione
        await db.run(
            'UPDATE conversations SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [conversation.id]
        );        
        
        // Risposta in base al tipo di richiesta
        if (isAjax) {
            return res.json({ 
                success: true, 
                messageId: messageResult.lastID,
                message: 'Messaggio inviato con successo'
            });
        }
        
        res.redirect(`/chat/${otherUsername}`);
    } catch (err) {
        console.error('Errore invio messaggio:', err);
        const error = 'Errore durante l\'invio del messaggio.';
        
        if (isAjax) {
            return res.status(500).json({ error });
        }
        
        req.flash('error_msg', error);
        res.redirect(`/chat/${req.params.username}`);
    }
});

// API per ottenere nuovi messaggi (polling)
router.get('/api/messages/:username', requireOnboarding, checkChatCompatibility, async (req, res) => {
    try {
        const otherUsername = req.params.username;
        const lastMessageId = parseInt(req.query.lastMessageId) || 0;
        
        // Trova la conversazione
        const conversation = await db.get(`
            SELECT * FROM conversations 
            WHERE (username1 = ? AND username2 = ?) OR (username1 = ? AND username2 = ?)
        `, [req.user.username, otherUsername, otherUsername, req.user.username]);
        
        if (!conversation) {
            return res.json({ messages: [] });
        }
        
        // Recupera i nuovi messaggi
        const newMessages = await db.all(`
            SELECT m.*, u.profilePicture 
            FROM messages m
            LEFT JOIN users u ON m.senderUsername = u.username
            WHERE m.conversationId = ? AND m.id > ?
            ORDER BY m.createdAt ASC
        `, [conversation.id, lastMessageId]);
        
        res.json({ messages: newMessages || [] });
    } catch (err) {
        console.error('Errore recupero nuovi messaggi:', err);
        res.status(500).json({ error: 'Errore del server' });
    }
});

export default router;