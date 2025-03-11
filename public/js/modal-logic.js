// public/js/modal-logic.js
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const infoLink = document.getElementById("info-link");
    const modal = document.getElementById("info-modal");
    const closeBtn = modal.querySelector(".modal-close");

    // Apertura modale quando si preme 'Informazioni'
    infoLink.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "block";
        document.body.classList.add("modal-open");
    });

    // Chiusura modale quando si preme la 'X'
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
    });

    // Chiusura modale quando si clicca fuori dalla finestra
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            document.body.classList.remove("modal-open");
        }
    });
});