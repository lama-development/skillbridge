// punlic/js/onboarding-logic.js
"use strict";

function selectRole(role) {
    // Rimuove la classe 'selected' da tutte le opzioni
    document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
    // Aggiunge la classe 'selected' all'elemento cliccato
    document.querySelector(`[onclick="selectRole('${role}')"]`).classList.add('selected');

    // Aggiorna il valore dell'input hidden per il ruolo selezionato
    document.getElementById('selected-type').value = role;

    if (role === 'freelancer') {
        // Mostra i campi per freelancer e nasconde quelli per azienda
        document.getElementById('freelancer-fields').style.display = 'block';
        document.getElementById('business-fields').style.display = 'none';

        // Abilita e rende required i campi per freelancer
        document.querySelectorAll('#freelancer-fields input').forEach(input => {
            input.disabled = false;
            input.setAttribute('required', '');
        });
        // Disabilita e rimuove required dai campi per azienda
        document.querySelectorAll('#business-fields input').forEach(input => {
            input.disabled = true;
            input.removeAttribute('required');
        });
    } else if (role === 'business') {
        // Mostra i campi per azienda e nasconde quelli per freelancer
        document.getElementById('freelancer-fields').style.display = 'none';
        document.getElementById('business-fields').style.display = 'block';

        // Abilita e rende required i campi per azienda
        document.querySelectorAll('#business-fields input').forEach(input => {
            input.disabled = false;
            input.setAttribute('required', '');
        });
        // Disabilita e rimuove required dai campi per freelancer
        document.querySelectorAll('#freelancer-fields input').forEach(input => {
            input.disabled = true;
            input.removeAttribute('required');
        });
    }
}