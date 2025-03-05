// public/js/navbar.js

document.addEventListener('DOMContentLoaded', function() {
    const profileWrapper = document.querySelector('.navbar-profile-wrapper');
    const profileMenu = document.querySelector('.profile-menu');

    profileWrapper.addEventListener('click', function(e) {
        e.stopPropagation();
        profileMenu.classList.toggle('show');
    });

    document.addEventListener('click', function() {
        profileMenu.classList.remove('show');
    });
});
