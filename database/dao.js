"use strict";

import db from './db.js';

/* ------ OPERAZIONI UTENTE ------ */

// Trova un utente per email
export const findUserByEmail = async (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
            resolve(user);
        } catch (error) {
            reject(error);
        }
    });
};

// Trova un utente per username
export const findUserByUsername = async (username) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
            resolve(user);
        } catch (error) {
            reject(error);
        }
    });
};

// Verifica se email o username esistono già
export const findExistingUser = async (email, username) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await db.get(
                'SELECT * FROM users WHERE email = ? OR username = ?', 
                [email, username]
            );
            resolve(user);
        } catch (error) {
            reject(error);
        }
    });
};

// Crea un nuovo utente
export const createUser = async (email, username, hashedPassword) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'INSERT INTO users (email, username, password) VALUES (?, ?, ?)', 
                [email, username, hashedPassword]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Aggiorna i dati di onboarding dell'utente
export const updateUserOnboarding = async (username, type, name, website, phone, location, profilePicture) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'UPDATE users SET type = ?, name = ?, website = ?, phone = ?, location = ?, profilePicture = ? WHERE username = ?',
                [type, name, website, phone, location, profilePicture, username]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Aggiorna la foto profilo dell'utente
export const updateUserProfilePicture = async (username, profilePicture) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'UPDATE users SET profilePicture = ? WHERE username = ?', 
                [profilePicture, username]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Aggiorna la biografia dell'utente
export const updateUserBio = async (username, bio) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'UPDATE users SET bio = ? WHERE username = ?', 
                [bio, username]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Aggiorna i contatti dell'utente
export const updateUserContacts = async (username, website, phone, name, location) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'UPDATE users SET website = ?, phone = ?, name = ?, location = ? WHERE username = ?',
                [website, phone, name, location, username]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

/* ------ OPERAZIONI POST ------ */

// Crea un nuovo post
export const createPost = async (username, type, title, content, category) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'INSERT INTO posts (username, type, title, content, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                [username, type, title, content, category, new Date().toISOString()]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Recupera i post per la homepage con limite
export const getPostsByType = async (type, limit) => {
    return new Promise(async (resolve, reject) => {
        try {
            const posts = await db.all(`
                SELECT p.*, u.name, u.website, u.profilePicture, u.username 
                FROM posts p 
                JOIN users u ON p.username = u.username 
                WHERE p.type = ? 
                ORDER BY p.createdAt DESC
                LIMIT ?
            `, [type, limit]);
            resolve(posts);
        } catch (error) {
            reject(error);
        }
    });
};

// Conta i post per tipo
export const countPostsByType = async (type) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.get(
                'SELECT COUNT(*) as total FROM posts WHERE type = ?', 
                [type]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Recupera i post di un utente specifico
export const getPostsByUser = async (username) => {
    return new Promise(async (resolve, reject) => {
        try {
            const posts = await db.all(
                'SELECT * FROM posts WHERE username = ? ORDER BY createdAt DESC', 
                [username]
            );
            resolve(posts);
        } catch (error) {
            reject(error);
        }
    });
};

// Trova un post per ID
export const findPostById = async (postId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);
            resolve(post);
        } catch (error) {
            reject(error);
        }
    });
};


// Elimina un post per ID
export const deletePostById = async (postId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run('DELETE FROM posts WHERE id = ?', [postId]);
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Ricerca post con filtri e paginazione
export const searchPosts = async (baseCondition, params, limit, offset) => {
    return new Promise(async (resolve, reject) => {
        try {
            const searchQuery = `
                SELECT p.*, u.name, u.website, u.profilePicture, u.username
                FROM posts p
                JOIN users u ON p.username = u.username
                ${baseCondition}
                ORDER BY p.createdAt DESC
                LIMIT ? OFFSET ?
            `;
            
            const searchParams = [...params, limit, offset];
            const posts = await db.all(searchQuery, searchParams);
            resolve(posts);
        } catch (error) {
            reject(error);
        }
    });
};

// Conta i risultati di ricerca
export const countSearchResults = async (baseCondition, params) => {
    return new Promise(async (resolve, reject) => {
        try {
            const countQuery = `
                SELECT COUNT(*) as total
                FROM posts p
                JOIN users u ON p.username = u.username
                ${baseCondition}
            `;
            
            const result = await db.get(countQuery, params);
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

/* ------ OPERAZIONI COMPETENZE ------ */

// Recupera le competenze di un utente
export const getUserSkills = async (username) => {
    return new Promise(async (resolve, reject) => {
        try {
            const skills = await db.all(
                'SELECT skill FROM skills WHERE username = ?', 
                [username]
            );
            resolve(skills);
        } catch (error) {
            reject(error);
        }
    });
};

// Elimina tutte le competenze di un utente
export const deleteUserSkills = async (username) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'DELETE FROM skills WHERE username = ?', 
                [username]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};


// Aggiunge una competenza per un utente
export const addUserSkill = async (username, skill) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'INSERT INTO skills (username, skill) VALUES (?, ?)', 
                [username, skill]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

/* ------ OPERAZIONI CHAT ------ */

// Trova o crea una conversazione tra due utenti
export const findOrCreateConversation = async (user1, user2) => {
    return new Promise(async (resolve, reject) => {
        try {
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
            resolve(conversation);
        } catch (error) {
            reject(error);
        }
    });
};

// Recupera le conversazioni di un utente
export const getUserConversations = async (username) => {
    return new Promise(async (resolve, reject) => {
        try {
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
            `, [username, username, username, username]);
            resolve(conversations);
        } catch (error) {
            reject(error);
        }
    });
};

// Inserisce un nuovo messaggio
export const createMessage = async (conversationId, senderUsername, content) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'INSERT INTO messages (conversationId, senderUsername, content) VALUES (?, ?, ?)',
                [conversationId, senderUsername, content]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Aggiorna il timestamp di una conversazione
export const updateConversationTimestamp = async (conversationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.run(
                'UPDATE conversations SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId]
            );
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

// Recupera i messaggi di una conversazione
export const getConversationMessages = async (conversationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const messages = await db.all(`
                SELECT m.*, u.profilePicture 
                FROM messages m
                LEFT JOIN users u ON m.senderUsername = u.username
                WHERE m.conversationId = ?
                ORDER BY m.createdAt ASC
            `, [conversationId]);
            resolve(messages);
        } catch (error) {
            reject(error);
        }
    });
};

// Recupera i nuovi messaggi di una conversazione dopo un certo ID
export const getNewMessages = async (conversationId, lastMessageId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const messages = await db.all(`
                SELECT m.*, u.profilePicture 
                FROM messages m
                LEFT JOIN users u ON m.senderUsername = u.username
                WHERE m.conversationId = ? AND m.id > ?
                ORDER BY m.createdAt ASC
            `, [conversationId, lastMessageId]);
            resolve(messages);
        } catch (error) {
            reject(error);
        }
    });
};