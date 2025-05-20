/*
Script per gestire funzionalità nelle pagine di login e registrazione
- Funzionalità mostra/nascondi password con icona
- Validazione username in tempo reale
*/

"use strict";
const usernameInput = document.getElementById('username');

// Configurazione pulsanti per mostrare/nascondere password
const setupPasswordToggles = () => {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            // Cambia il tipo di input e l'icona in base allo stato attuale
            if (input.type === "password") {
                input.type = "text";
                this.innerHTML = '<i class="bi bi-eye-slash"></i>';
            } else {
                input.type = "password";
                this.innerHTML = '<i class="bi bi-eye"></i>';
            }
        });
    });
};

// Validazione username in tempo reale con solo caratteri consentiti
const setupUsernameValidation = () => {
    if (!usernameInput) return;
    usernameInput.addEventListener('input', function() {
        // Converte il testo in minuscolo 
        const currentValue = this.value.toLowerCase();
        // Rimuove caratteri non ammessi (solo a-z, 0-9 e trattini)
        const cleanedValue = currentValue.replace(/[^a-z0-9-]/g, '');
        // Aggiorna l'input con il valore ripulito
        this.value = cleanedValue;
    });
};

setupPasswordToggles();
setupUsernameValidation();