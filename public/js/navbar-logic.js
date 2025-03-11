// public/js/navbar-logic.js
"use strict";

document.addEventListener('DOMContentLoaded', function() {
    const profileWrapper = document.querySelector('.navbar-profile-wrapper');
    const profileMenu = document.querySelector('.profile-menu');

    if (profileWrapper && profileMenu) {
        profileWrapper.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            profileMenu.classList.remove('show');
        });
    }
});