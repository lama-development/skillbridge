"use strict";

import express from 'express';
import { createRequire } from "module";
import { requireOnboarding } from '../middleware/auth.js';
import * as dao from '../database/dao.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const router = express.Router();

// Middleware per verificare compatibilità chat (freelancer <-> business)
const checkChatCompatibility = async (req, res, next) => {
    try {
        const otherUsername = req.params.username;
        // Cerca l'altro utente 
        const otherUser = await dao.findUserByUsername(otherUsername);
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

// Pagina principale delle chat
router.get('/', requireOnboarding, async (req, res) => {
    try {
        // Recupera tutte le conversazioni dell'utente
        const conversations = await dao.getUserConversations(req.user.username);
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
        const otherUser = await dao.findUserByUsername(otherUsername);
        // Trova o crea la conversazione
        const conversation = await dao.findOrCreateConversation(req.user.username, otherUsername);
        // Recupera i messaggi della conversazione 
        const messages = await dao.getConversationMessages(conversation.id);
        // Recupera tutte le conversazioni per la sidebar
        const conversations = await dao.getUserConversations(req.user.username);
        
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
        const conversation = await dao.findOrCreateConversation(req.user.username, otherUsername);
        // Inserisce il messaggio
        const messageResult = await dao.createMessage(conversation.id, req.user.username, message);
        // Aggiorna il timestamp della conversazione 
        await dao.updateConversationTimestamp(conversation.id);
        
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
        const conversation = await dao.findOrCreateConversation(req.user.username, otherUsername);
        if (!conversation) {
            return res.json({ messages: [] });
        }
        
        // Recupera i nuovi messaggi 
        const newMessages = await dao.getNewMessages(conversation.id, lastMessageId);
        res.json({ messages: newMessages || [] });
    } catch (err) {
        console.error('Errore recupero nuovi messaggi:', err);
        res.status(500).json({ error: 'Errore del server' });
    }
});

export default router;