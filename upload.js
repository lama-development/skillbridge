/*
Script per la gestione di immagini con Multer
- Salva le immagini nella cartella uploads
- Assegna nomi univoci basati sull'username
- Filtra i file per accettare solo immagini
- Limita la dimensione massima a 5MB
*/

"use strict";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Ottengo __dirname che non è disponibile direttamente in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione dello storage per Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        // Crea la directory se non esiste
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => { 
        // Estrazione dell'estensione dal MIME type (es. 'image/jpeg' > 'jpeg')
        const fileExtension = file.mimetype.split('/')[1];
        // Creazione nome univoco con solo username (l'username è già univoco)
        const uniqueFilename = `${req.user.username}.${fileExtension}`;
        cb(null, uniqueFilename);
    }
});

// Permette solo formati immagine (mime type che inizia con 'image/')
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('INVALID_FILE_TYPE'), false);
};

// Configurazione di Multer con le impostazioni definite
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

export default upload;