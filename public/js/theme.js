// public/js/theme.js
"use strict";

document.addEventListener('DOMContentLoaded', function() {
    const themeBtn = document.querySelector('.theme-btn');
    let themeIcon = null;
    if (themeBtn) {
        themeIcon = themeBtn.querySelector('i');
    }

    function updateThemeIcon(isDark) {
        if (themeIcon) {
            if (isDark) {
                themeIcon.classList.remove('bx-moon');
                themeIcon.classList.add('bx-sun');
            } else {
                themeIcon.classList.remove('bx-sun');
                themeIcon.classList.add('bx-moon');
            }
        }
    }

    // Imposta il tema iniziale
    let currentTheme = localStorage.getItem('theme') || 'light';
    if (!currentTheme) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = 'dark';
        } else {
            currentTheme = 'light';
        }
    }

    // Applica il tema
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    updateThemeIcon(currentTheme === 'dark');

    // Gestisci il cambio tema
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', currentTheme);
            document.documentElement.setAttribute('data-bs-theme', currentTheme);
            updateThemeIcon(currentTheme === 'dark');
        });
    }

    // Ascolta i cambiamenti delle preferenze di sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (!localStorage.getItem('theme')) {
            currentTheme = event.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-bs-theme', currentTheme);
            updateThemeIcon(currentTheme === 'dark');
        }
    });
});
