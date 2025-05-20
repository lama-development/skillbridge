/*
Script per gestire le funzionalità della navbar
- Menu a tendina del profilo utente
- Apertura modale informazioni del progetto
*/

"use strict";

document.addEventListener('DOMContentLoaded', () => {
    initProfileMenu();
    initInfoModal();
});

function initProfileMenu() {
    const profileWrapper = document.querySelector('.navbar-profile-wrapper');
    const profileMenu = document.querySelector('.profile-menu');

    if (!profileWrapper || !profileMenu) return;

    // Gestisce l'apertura del menu profilo al click sull'icona
    profileWrapper.addEventListener('click', e => {
        e.stopPropagation(); // Previene la propagazione del click al documento
        profileMenu.classList.toggle('show');
    });

    // Chiude il menu profilo quando si clicca in qualsiasi punto della pagina
    document.addEventListener('click', () => {
        profileMenu.classList.remove('show');
    });
}

function initInfoModal() {
    const infoLink = document.getElementById("info-link");
    const modal = new bootstrap.Modal(document.getElementById("info-modal"));
    
    if (!infoLink || !modal) return;

    // Apertura della modale informazioni al click sul link
    infoLink.addEventListener("click", e => {
        e.preventDefault();
        modal.show();
    });
}