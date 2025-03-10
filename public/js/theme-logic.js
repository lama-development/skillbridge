// public/js/theme-logic.js
"use strict";

document.addEventListener('DOMContentLoaded', function() {
    // Select theme button (may be null on login page)
    const themeBtn = document.querySelector('.theme-btn');
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;

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

    function applyTheme(theme) {
        Object.keys(theme).forEach(key => {
            document.documentElement.style.setProperty(key, theme[key]);
        });
    }

    function updateThemeIcon(currentTheme) {
        if (themeIcon) {
            if (currentTheme === 'dark') {
                themeIcon.classList.remove('bx-moon');
                themeIcon.classList.add('bx-sun');
            } else {
                themeIcon.classList.remove('bx-sun');
                themeIcon.classList.add('bx-moon');
            }
        }
    }

    let currentTheme = localStorage.getItem('theme');
    if (!currentTheme) {
        currentTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    applyTheme(currentTheme === 'dark' ? darkTheme : lightTheme);
    updateThemeIcon(currentTheme);

    // Only add event listener if the theme button exists
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', currentTheme);
            applyTheme(currentTheme === 'dark' ? darkTheme : lightTheme);
            updateThemeIcon(currentTheme);
        });
    }
});
