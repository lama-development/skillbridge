// app.js

import express from 'express';
import path from 'path';
import passport from 'passport';
import session from 'express-session';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware per il parsing dei dati
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurazione della cartella pubblica
app.use(express.static(path.join(__dirname, 'public')));

// Sessioni per Passport
app.use(session({
    secret: 'SkillBridge', // Da cambiare in produzione
    resave: false,
    saveUninitialized: false
}));

// Inizializzazione Passport
app.use(passport.initialize());
app.use(passport.session());

// Definizione rotte di base
app.get('/', (req, res) => {
    res.render('index');  // renderizza la homepage
});

app.get('/login', (req, res) => {
    res.render('login'); // renderizza la pagina di login
});

// Rotta POST per gestire l'invio del form di login 
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Puoi implementare qui la logica di autenticazione con Passport
    // Per ora, reindirizziamo semplicemente alla homepage
    res.redirect('/');
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});
