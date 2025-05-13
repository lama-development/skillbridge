"use strict";

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Ricavo __dirname siccome non è disponibile in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione di Multer per l'upload delle immagini del profilo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Assicuriamoci che la cartella esista
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Usa userId + timestamp come nome file per evitare conflitti
        // Il file.mimetype è ad esempio 'image/jpeg' quindi estraggo 'jpeg'
        const fileExtension = file.mimetype.split('/')[1];
        const uniqueFilename = `user_${req.user.id}_${Date.now()}.${fileExtension}`;
        cb(null, uniqueFilename);
    }
});

// Filtro per consentire solo immagini
const fileFilter = (req, file, cb) => {
    // Accetta solo immagini
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo i file immagine sono ammessi!'), false);
    }
};

// Creazione dell'uploader con le configurazioni
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite a 5MB
    },
    fileFilter: fileFilter
});

export default upload;
