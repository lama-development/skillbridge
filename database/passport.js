"use strict";

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import db from './db.js';

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        // Converte email in minuscolo
        const emailLowerCase = email.toLowerCase();
        // Utilizzo della versione promise di db.get
        const user = await db.get('SELECT * FROM users WHERE email = ?', [emailLowerCase]);
        if (!user) return done(null, false, { message: 'User not found.' });
        // Utilizzo della versione promise di bcrypt.compare
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) return done(null, user);
        else return done(null, false, { message: 'Incorrect password.' });
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;