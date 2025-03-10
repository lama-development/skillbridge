// public/js/navbar-logic.js
"use strict";

document.addEventListener('DOMContentLoaded', function() {
    // Toggle del menu del profilo
    const profileWrapper = document.querySelector('.navbar-profile-wrapper');
    const profileMenu = document.querySelector('.profile-menu');

    profileWrapper.addEventListener('click', function(e) {
        e.stopPropagation();
        profileMenu.classList.toggle('show');
    });

    document.addEventListener('click', function() {
        profileMenu.classList.remove('show');
    });

    // Funzionalità per il cambio tema
    const themeBtn = document.querySelector('.theme-btn');
    const themeIcon = themeBtn.querySelector('i');

    // Definizione degli oggetti per il tema chiaro e il tema scuro
    const lightTheme = {
        '--color-bg-1': '#fff',
        '--color-bg-2': '#f1f1f1',
        '--color-border': '#c9cdd1',
        '--color-accent': '#0b99ff',
        '--color-accent-hover': '#0383c4',
        '--color-gradient-start': '#4c53ba',
        '--color-gradient-end': '#0b99ff',
        '--color-text-primary': '#000',
        '--color-text-secondary': '#666'
    };

    const darkTheme = {
        '--color-bg-1': '#000',
        '--color-bg-2': '#0f1117',
        '--color-border': '#23252c',
        '--color-accent': '#0b99ff',
        '--color-accent-hover': '#0383c4',
        '--color-gradient-start': '#4c53ba',
        '--color-gradient-end': '#0b99ff',
        '--color-text-primary': '#fff',
        '--color-text-secondary': '#95969e'
    };

    // Funzione per applicare il tema impostando le variabili CSS sull'elemento root
    function applyTheme(theme) {
        Object.keys(theme).forEach(key => {
            document.documentElement.style.setProperty(key, theme[key]);
        });
    }

    // Funzione per aggiornare l'icona del tema in base al tema corrente
    function updateThemeIcon(currentTheme) {
        if (currentTheme === 'dark') {
            // Se il tema scuro è attivo, mostra l'icona del sole per indicare il passaggio al tema chiaro
            themeIcon.classList.remove('bx-moon');
            themeIcon.classList.add('bx-sun');
        } else {
            // Se il tema chiaro è attivo, mostra l'icona della luna per indicare il passaggio al tema scuro
            themeIcon.classList.remove('bx-sun');
            themeIcon.classList.add('bx-moon');
        }
    }

    // Controlla se c'è un tema salvato in localStorage; altrimenti, utilizza la preferenza di sistema
    let currentTheme = localStorage.getItem('theme');
    if (!currentTheme) {
        currentTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    // Applica il tema corrente e aggiorna l'icona all'avvio della pagina
    applyTheme(currentTheme === 'dark' ? darkTheme : lightTheme);
    updateThemeIcon(currentTheme);

    // Cambia il tema al click del pulsante e salva la scelta in localStorage
    themeBtn.addEventListener('click', function() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme === 'dark' ? darkTheme : lightTheme);
        updateThemeIcon(currentTheme);
    });
});