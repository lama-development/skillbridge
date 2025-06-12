"use strict";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Ottiene il percorso della directory corrente (necessario con ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione di dove e come salvare i file caricati
const storage = multer.diskStorage({
    // Cartella dove salvare i file
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public', 'uploads');
        // Crea la cartella se non esiste
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    
    // Nome del file salvato
    filename: (req, file, cb) => {
        // Prende l'estensione dal tipo di file (es: "image/jpeg" -> "jpeg")
        const extension = file.mimetype.split('/')[1];
        // Il nome del file sarà: username.estensione (es: mario.jpg)
        const filename = `${req.user.username}.${extension}`;
        cb(null, filename);
    }
});

// Controlla che il file sia un'immagine
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accetta il file
    } else {
        cb(new Error('INVALID_FILE_TYPE'), false); // Rifiuta il file
    }
};

// Configurazione principale per l'upload
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Max 5MB
    },
    fileFilter: fileFilter
});

// Gestisce gli errori durante l'upload
export const handleMulterError = (err, req, res, next) => {
    if (err) {
        // Se c'è un file temporaneo, lo elimina
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupErr) {
                console.error('Errore durante la pulizia del file:', cleanupErr);
            }
        }
        
        // Mostra un messaggio di errore appropriato
        if (err.code === 'LIMIT_FILE_SIZE') {
            req.flash('error_msg', 'Il file è troppo grande. La dimensione massima è 5MB.');
        } else if (err.message === 'INVALID_FILE_TYPE') {
            req.flash('error_msg', 'Solo le immagini sono ammesse!');
        } else {
            req.flash('error_msg', 'Errore durante l\'upload del file.');
        }
        
        return res.redirect('/profile');
    }
    next();
};

// Elimina le vecchie foto profilo di un utente (tranne quella specificata)
export const deleteExistingProfilePictures = (username, keepFilename = null) => {
    try {
        const uploadDir = path.join(__dirname, '../public/uploads');
        const possibleExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        
        possibleExtensions.forEach(extension => {
            const filename = `${username}.${extension}`;
            const filepath = path.join(uploadDir, filename);
            
            // Non elimina il file che abbiamo appena caricato
            if (keepFilename && filename === keepFilename) {
                return;
            }
            
            // Elimina il file se esiste
            if (fs.existsSync(filepath)) {
                try {
                    fs.unlinkSync(filepath);
                } catch (deleteError) {
                    console.error(`Errore nell'eliminazione di ${filename}:`, deleteError);
                }
            }
        });
    } catch (error) {
        console.error('Errore durante l\'eliminazione delle foto esistenti:', error);
    }
};
