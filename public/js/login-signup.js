"use strict";

const usernameInput = document.getElementById('username');

document.querySelectorAll('.toggle-password').forEach(function (button) {
    button.addEventListener('click', function () {
        const input = this.parentElement.querySelector('input');
        if (input.type === "password") {
            input.type = "text";
            this.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
            input.type = "password";
            this.innerHTML = '<i class="bi bi-eye"></i>';
        }
    });
});

if (usernameInput) {
    usernameInput.addEventListener('input', function () {
        // Converte il testo in minuscolo
        let currentValue = this.value.toLowerCase();
        // Rimuove caratteri non ammessi tramite regex (solo a-z, 0-9 e trattini)
        let cleanedValue = currentValue.replace(/[^a-z0-9-]/g, '');
        // Aggiorna il valore dell'input con il testo ripulito
        this.value = cleanedValue;
    });
}