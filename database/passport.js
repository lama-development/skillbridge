"use strict";

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import db from './db.js';
import { promisify } from 'util';

// Promisify bcrypt.compare
const compareAsync = promisify(bcrypt.compare);

passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
        try {
            // Utilizzo della versione promise di db.get
            const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
            if (!user) return done(null, false);
            // Utilizzo della versione promise di bcrypt.compare
            const isMatch = await compareAsync(password, user.password);
            if (isMatch) return done(null, user);
            return done(null, false);
        } catch (err) {
            return done(err);
        }
    }
));

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