"use strict";

function selectRole(role) {
    // Rimuove gli stili di selezione da tutte le opzioni
    document.querySelectorAll('.option').forEach(el => {
        el.classList.remove('selected');
        el.classList.remove('border-primary');
        el.classList.remove('bg-light');
    });
    
    // Aggiunge gli stili di selezione all'elemento cliccato
    const selectedOption = document.querySelector(`[onclick="selectRole('${role}')"]`);
    selectedOption.classList.add('selected');
    selectedOption.classList.add('border-primary');
    selectedOption.classList.add('bg-light');
    
    // Aggiorna il valore dell'input hidden
    document.getElementById('selected-type').value = role;

    if (role === 'freelancer') {
        // Gestisce la visualizzazione dei campi freelancer
        document.getElementById('freelancer-fields').style.display = 'block';
        document.getElementById('business-fields').style.display = 'none';
        
        // Gestisce i campi required per freelancer
        document.querySelectorAll('#freelancer-fields input').forEach(input => {
            input.disabled = false;
            if (input.name !== 'website') {
                input.setAttribute('required', '');
            }
        });
        
        // Disabilita i campi azienda
        document.querySelectorAll('#business-fields input').forEach(input => {
            input.disabled = true;
            input.removeAttribute('required');
        });
    } else if (role === 'business') {
        // Gestisce la visualizzazione dei campi azienda
        document.getElementById('freelancer-fields').style.display = 'none';
        document.getElementById('business-fields').style.display = 'block';
        
        // Gestisce i campi required per azienda
        document.querySelectorAll('#business-fields input').forEach(input => {
            input.disabled = false;
            if (input.name !== 'website') {
                input.setAttribute('required', '');
            }
        });
        
        // Disabilita i campi freelancer
        document.querySelectorAll('#freelancer-fields input').forEach(input => {
            input.disabled = true;
            input.removeAttribute('required');
        });
    }
}