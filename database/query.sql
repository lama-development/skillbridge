-- Esempi di inserimento dati nel database con campo fullName unificato
INSERT INTO users (username, email, password, type, fullName, businessName, website, phone, location, bio)
VALUES
("acme-digital", "contact@acme.it", "password1", "business", "", "Acme Digital Srl", "https://acme.it", "+39 01122457812", "Torino, Italia", "Acme Digital è un'agenzia specializzata nella realizzazione di soluzioni digitali su misura. Lavoriamo con PMI e startup per sviluppare prodotti scalabili, performanti e user-friendly. Dal 2012 supportiamo la trasformazione digitale delle imprese offrendo consulenza strategica, sviluppo software, e marketing digitale integrato. Il nostro team è composto da sviluppatori, designer e consulenti con esperienze multidisciplinari e una forte attenzione all'innovazione."),
("nextgen-solutions", "hr@nextgensolutions.com", "password2", "business", "", "NextGen Solutions", "https://nextgensolutions.com", "+39 01234567890", "Milano, Italia", "NextGen Solutions è una società di consulenza tecnologica che aiuta le imprese a innovare attraverso soluzioni software avanzate. Forniamo servizi di sviluppo personalizzato, integrazione di sistemi, analisi dati e gestione infrastrutture cloud. Operiamo in ambito enterprise e lavoriamo a stretto contatto con i team IT dei clienti per garantire soluzioni affidabili, sostenibili e sicure. Il nostro approccio combina rigore tecnico e attenzione al business."),
("creativa-studio", "info@creativa.com", "password3", "business", "", "Creativa Studio", "https://creativa.com", "+39 069876 432", "Roma, Italia", "Creativa Studio è uno studio creativo multidisciplinare specializzato in branding, comunicazione visiva e digital design. Aiutiamo le aziende a costruire identità visive forti e coerenti attraverso strategie di design centrate sull'utente. Dal naming al logo, dalle interfacce utente alla comunicazione social, accompagniamo i clienti in ogni fase del processo creativo, con un approccio curato, strategico e distintivo."),
("luca-dev", "luca.dev@mail.com", "password4", "freelancer", "Luca Rossi", "", "https://lucarossi.dev", "+39 3334455561", "Bologna, Italia", "Sono uno sviluppatore web freelance con oltre 7 anni di esperienza nello sviluppo di applicazioni moderne. Specializzato in backend (Node.js, Laravel) e ottimizzazione delle performance, collaboro con agenzie e clienti diretti per la realizzazione di progetti su misura. Offro soluzioni scalabili e sicure, e mi occupo anche di DevOps, testing automatizzato e integrazione API. Lavoro con un approccio orientato alla qualità del codice e alla soddisfazione del cliente."),
("anna-copy", "anna.copy@mail.com", "password5", "freelancer", "Anna Bianchi", "", "https://annabianchi.it", "+39 3336677782", "Firenze, Italia", "Mi chiamo Anna e sono una copywriter freelance con una forte passione per la scrittura persuasiva e strategica. Aiuto brand, startup e agenzie a comunicare in modo efficace, umano e differenziante. Ho una solida esperienza nella scrittura di landing page ad alto tasso di conversione, testi per campagne pubblicitarie online, articoli SEO, script per video e newsletter. Il mio obiettivo è sempre quello di creare contenuti capaci di generare valore e risultati concreti."),
("mario-design", "mario.design@mail.com", "password6", "freelancer", "Mario Verdi", "", "https://mariodesign.it", "+39 3339998887", "Venezia, Italia", "Sono un designer grafico e UI con oltre 10 anni di esperienza nel settore. Realizzo progetti su misura per aziende, startup e agenzie di comunicazione. Mi occupo di branding, progettazione di interfacce utente, design di prodotto, materiali per la stampa e grafica pubblicitaria. Ho collaborato con clienti nazionali e internazionali in ambiti come fintech, education, food e moda. Lavoro con cura artigianale, attenzione al dettaglio e una forte sensibilità estetica.");

INSERT INTO posts (userId, type, category, title, content)
VALUES
("acme-digital", "job_offer", "Sviluppo", "Cerchiamo sviluppatore backend", "Acme Digital è alla ricerca di uno sviluppatore backend senior da inserire in un team multidisciplinare per un progetto innovativo nel settore retail. Richiesta esperienza con Node.js, PostgreSQL e architetture RESTful. Il candidato ideale ha familiarità con ambienti cloud (AWS) e metodologie Agile. Contratto di collaborazione per 6 mesi con possibilità di rinnovo. Lavoro da remoto con incontri periodici in sede."),
("creativa-studio", "job_offer", "Design", "UI/UX Designer per app mobile", "Creativa Studio seleziona un UI/UX designer freelance per lo sviluppo del design di un'app mobile in ambito wellness. Richiesta esperienza in progettazione di wireframe, prototipazione (Figma) e attenzione all'esperienza utente. Il progetto prevede una durata di circa 2 mesi con consegne cadenzate. Collaborazione 100% da remoto con possibilità di estendere l'ingaggio su altri progetti."),
("nextgen-solutions", "job_offer", "Marketing", "Social Media Manager", "NextGen Solutions è alla ricerca di un Social Media Manager con esperienza nel settore B2B per la gestione e ottimizzazione dei canali social aziendali (LinkedIn, Facebook, X). Il ruolo prevede la definizione della strategia, la creazione del piano editoriale, la produzione dei contenuti (con supporto grafico) e l'analisi delle performance tramite metriche avanzate. Richiesta conoscenza base di strumenti ADV (Meta Business Suite e LinkedIn Ads)."),
("luca-dev", "freelancer_promo", "Sviluppo", "Full-stack developer disponibile", "Sono disponibile per nuovi progetti full-stack. Sviluppo con React, Vue, Laravel e Node.js. Posso seguire l'intero ciclo di vita del progetto: progettazione architettura, sviluppo, testing, deploy su server cloud (DigitalOcean, AWS). Garantisco puntualità, comunicazione trasparente e codice documentato. Lavoro sia con aziende che con agenzie digitali come partner tecnico di fiducia."),
("mario-design", "freelancer_promo", "Design", "Graphic designer freelance", "Offro servizi di graphic design e visual branding per aziende, eventi, startup e progetti editoriali. Realizzo loghi, identità visive, layout per social media, packaging e UI design. Lavoro con Adobe Creative Suite, Figma e strumenti di prototipazione rapida. Aperto a collaborazioni sia continuative che per singoli progetti. Portfolio disponibile sul mio sito."),
("anna-copy", "freelancer_promo", "Copywriting", "Copywriter freelance", "Scrivo testi che aiutano le aziende a vendere di più e comunicare meglio. Sono specializzata in copywriting per il web: landing page, pagine prodotto, blog SEO, newsletter, annunci pubblicitari e script per video promozionali. Lavoro con clienti in ambiti diversi: tech, moda, servizi e formazione. Garantisco consegne puntuali, ascolto attento e testi che rispettano tono di voce e obiettivi di comunicazione.");

-- Inserimento delle skills per i freelancer (massimo 10 per utente)
-- Le aziende non possono avere skills, come richiesto

-- Skills per Luca Rossi (sviluppatore)
INSERT INTO skills (username, skill) VALUES 
("luca-dev", "JavaScript"),
("luca-dev", "Node.js"),
("luca-dev", "Laravel"),
("luca-dev", "Vue.js"),
("luca-dev", "React"),
("luca-dev", "REST API"),
("luca-dev", "DevOps"),
("luca-dev", "AWS"),
("luca-dev", "Docker"),
("luca-dev", "PostgreSQL");

-- Skills per Anna Bianchi (copywriter)
INSERT INTO skills (username, skill) VALUES 
("anna-copy", "Copywriting"),
("anna-copy", "Content Marketing"),
("anna-copy", "SEO Writing"),
("anna-copy", "Landing Page"),
("anna-copy", "Social Media Content"),
("anna-copy", "Email Marketing"),
("anna-copy", "Storytelling"),
("anna-copy", "Blog Writing"),
("anna-copy", "Script Writing");

-- Skills per Mario Verdi (designer)
INSERT INTO skills (username, skill) VALUES 
("mario-design", "UI Design"),
("mario-design", "Branding"),
("mario-design", "Adobe Photoshop"),
("mario-design", "Adobe Illustrator"),
("mario-design", "Figma"),
("mario-design", "Logo Design"),
("mario-design", "Graphic Design"),
("mario-design", "Print Design"),
("mario-design", "Web Design"),
("mario-design", "Visual Identity");