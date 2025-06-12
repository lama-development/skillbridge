"use strict";

// Middleware di autenticazione condivisi
export const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
        return res.redirect('/login');
    }
    next();
};

export const requireOnboarding = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Devi essere loggato per effettuare questa operazione.');
        return res.redirect('/login');
    }
    if (!req.user.type) {
        req.flash('error_msg', 'Completa l\'onboarding per accedere a questa funzionalità.');
        return res.redirect('/onboarding');
    }
    next();
};

export const requireBusinessUser = (req, res, next) => {
    if (req.user.type !== 'business') {
        req.flash('error_msg', 'Solo le aziende possono accedere a questa funzionalità.');
        return res.redirect('/');
    }
    next();
};

export const requireFreelancerUser = (req, res, next) => {
    if (req.user.type !== 'freelancer') {
        req.flash('error_msg', 'Solo i freelancer possono accedere a questa funzionalità.');
        return res.redirect('/');
    }
    next();
};

export const preventOnboardingIfComplete = (req, res, next) => {
    if (req.isAuthenticated() && req.user.type) {
        req.flash('info_msg', 'Hai già completato l\'onboarding.');
        return res.redirect('/');
    }
    next();
};
