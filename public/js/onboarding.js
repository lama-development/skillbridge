/*
Script per gestire il processo di onboarding utente
- Gestisce la selezione del tipo di account (freelancer o business)
- Gestisce la visualizzazione dinamica dei relativi campi del form
*/

"use strict";

document.addEventListener('DOMContentLoaded', () => {
    selectRole('freelancer');
});

function selectRole(role) {
    // Aggiorna lo stile visuale delle opzioni di selezione
    updateSelectionStyles(role);
    // Aggiorna i campi del form in base al ruolo selezionato
    if (role === 'freelancer') handleFreelancerSelection();
    else if (role === 'business') handleBusinessSelection();
}

function updateSelectionStyles(role) {
    // Rimuove gli stili di selezione da tutte le opzioni
    document.querySelectorAll('.option').forEach(el => {
        el.classList.remove('selected', 'border-primary', 'bg-light');
    });
    
    // Aggiunge gli stili di selezione all'opzione corrente
    const selectedOption = document.querySelector(`[onclick="selectRole('${role}')"]`);
    if (selectedOption) selectedOption.classList.add('selected', 'border-primary', 'bg-light');
    
    // Aggiorna il valore dell'input hidden per il form
    const selectedTypeInput = document.getElementById('selected-type');
    if (selectedTypeInput) selectedTypeInput.value = role;
}

function handleFreelancerSelection() {
    // Gestisce la visibilità delle sezioni
    const freelancerFields = document.getElementById('freelancer-fields');
    const businessFields = document.getElementById('business-fields');
    
    if (freelancerFields) freelancerFields.style.display = 'block';
    if (businessFields) businessFields.style.display = 'none';
      // Configura i campi per freelancer
    document.querySelectorAll('#freelancer-fields input').forEach(input => {
        input.disabled = false;
        // Solo il fullName è obbligatorio per i freelancer
        input.required = (input.name === 'fullName');
    });
    // Disabilita i campi per business
    document.querySelectorAll('#business-fields input').forEach(input => {
        input.disabled = true;
        input.required = false;
    });
}

function handleBusinessSelection() {
    // Gestisce la visibilità delle sezioni
    const freelancerFields = document.getElementById('freelancer-fields');
    const businessFields = document.getElementById('business-fields');
    
    if (freelancerFields) freelancerFields.style.display = 'none';
    if (businessFields) businessFields.style.display = 'block';
    
    // Configura i campi per business
    document.querySelectorAll('#business-fields input').forEach(input => {
        input.disabled = false;
        // Solo il nome dell'azienda è obbligatorio per i business
        input.required = (input.name === 'businessName');
    });
    
    // Disabilita i campi per freelancer
    document.querySelectorAll('#freelancer-fields input').forEach(input => {
        input.disabled = true;
        input.required = false;
    });
}