"use strict";

document.addEventListener('DOMContentLoaded', function() {
    const profileWrapper = document.querySelector('.navbar-profile-wrapper');
    const profileMenu = document.querySelector('.profile-menu');

    // Apertura menu profilo quando si preme l'icona
    if (profileWrapper && profileMenu) {
        profileWrapper.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            profileMenu.classList.remove('show');
        });
    }

    const infoLink = document.getElementById("info-link");
    const modal = new bootstrap.Modal(document.getElementById("info-modal"));

    // Apertura modale quando si preme 'Informazioni'
    if (infoLink && modal) {
        infoLink.addEventListener("click", (e) => {
            e.preventDefault();
            modal.show();
        });
    }
});