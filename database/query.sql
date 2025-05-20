INSERT INTO users (username, email, password, type, firstName, lastName, businessName, website, phone, bio)
VALUES
('acme-digital', 'contact@acme.it', 'password1', 'business', '', '', 'Acme Digital Srl', 'https://acme.it', '+390112223344', 'Agenzia specializzata in soluzioni digitali per aziende e startup.'),
('nextgen-solutions', 'hr@nextgensolutions.com', 'password2', 'business', '', '', 'NextGen Solutions', 'https://nextgensolutions.com', '+390123456789', 'Agenzia di consulenza IT e sviluppo software per aziende.'),
('creativa-studio', 'info@creativa.com', 'password3', 'business', '', '', 'Creativa Studio', 'https://creativa.com', '+390698765432', 'Studio creativo per design, branding e comunicazione.'),
('luca-dev', 'luca.dev@mail.com', 'password4', 'freelancer', 'Luca', 'Rossi', '', 'https://lucarossi.dev', '+393334445556', 'Sviluppatore web freelance con focus su backend e performance.'),
('anna-copy', 'anna.copy@mail.com', 'password5', 'freelancer', 'Anna', 'Bianchi', '', 'https://annabianchi.it', '+393336667778', 'Copywriter freelance con passione per lo storytelling efficace.'),
('mario-design', 'mario.design@mail.com', 'password6', 'freelancer', 'Mario', 'Verdi', '', 'https://mariodesign.it', '+393339998887', 'Graphic e UI designer con 10 anni di esperienza nel settore.');

INSERT INTO posts (userId, type, category, title, content)
VALUES
('acme-digital', 'job_offer', 'Sviluppo', 'Cerchiamo sviluppatore backend', 'ACME cerca un backend developer esperto in Node.js per progetto di 6 mesi.'),
('creativa-studio', 'job_offer', 'Design', 'UI/UX Designer per app mobile', 'Stiamo cercando un designer freelance per creare interfacce mobile intuitive.'),
('nextgen-solutions', 'job_offer', 'Marketing', 'Social Media Manager', 'Cerchiamo un esperto di social media per gestire le nostre campagne pubblicitarie.'),
('luca-dev', 'freelancer_promo', 'Sviluppo', 'Full-stack developer disponibile', 'Sviluppatore web con 5 anni di esperienza in React e Laravel.'),
('mario-design', 'freelancer_promo', 'Design', 'Graphic designer freelance', 'Creo identità visive e loghi personalizzati per brand di ogni tipo.'),
('anna-copy', 'freelancer_promo', 'Copywriting', 'Copywriter freelance', 'Specializzata in testi persuasivi per landing page e campagne ADV.');