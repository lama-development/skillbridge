// public/js/modal.js

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const infoLink = document.getElementById("info-link");
    const modal = document.getElementById("info-modal");
    const closeBtn = modal.querySelector(".modal-close");

    // Open the modal when "Informazioni" is clicked
    infoLink.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "block";
        document.body.classList.add("modal-open");
    });

    // Close the modal when clicking the close button
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
    });

    // Also close the modal when clicking outside the modal content
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            document.body.classList.remove("modal-open");
        }
    });
});
