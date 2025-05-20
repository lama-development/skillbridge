/*
Script per la gestione dell'upload di immagini con Multer
- Salvare le immagini nella cartella uploads
- Assegnare nomi univoci basati su username e timestamp
- Filtrare i file per accettare solo immagini
- Limitare la dimensione massima a 5MB
*/

"use strict";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Otteniamo __dirname che non è disponibile direttamente in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione dello storage per Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        // Crea la directory se non esiste
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    
    filename: (req, file, cb) => {
        // Estrazione dell'estensione dal MIME type (es. 'image/jpeg' > 'jpeg')
        const fileExtension = file.mimetype.split('/')[1];
        // Creazione nome univoco con username e timestamp
        const uniqueFilename = `${req.user.username}_${Date.now()}.${fileExtension}`;
        cb(null, uniqueFilename);
    }
});

// Permette solo formati immagine (mime type che inizia con 'image/')
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo i file immagine sono ammessi!'), false);
    }
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