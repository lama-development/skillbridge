"use strict";

document.addEventListener('DOMContentLoaded', function() {
    // Inizializzazione dei tooltip Bootstrap
    const tooltipElement = document.querySelector('[data-bs-toggle="tooltip"]');
    if (tooltipElement) new bootstrap.Tooltip(tooltipElement);

    // Bottone per mostrare/nascondere la password
    const passwordToggleButtons = document.querySelectorAll('.toggle-password');
    passwordToggleButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');            
            if (passwordInput.type === "password") {
                // Mostra la password
                passwordInput.type = "text";
                this.innerHTML = '<i class="bi bi-eye-slash-fill"></i>';
            } else {
                // Nasconde la password
                passwordInput.type = "password";
                this.innerHTML = '<i class="bi bi-eye-fill"></i>';
            }
        });
    });
    
    // Controllo del campo username (solo lettere minuscole, numeri e trattini)
    const usernameInput = document.querySelector('input[name="username"]');
    if (usernameInput) {
        // Filtra i caratteri mentre l'utente scrive
        usernameInput.addEventListener('input', function(event) {
            const validChars = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (event.target.value !== validChars) event.target.value = validChars;
        });
        // Filtra anche quando l'utente incolla del testo
        usernameInput.addEventListener('paste', function(event) {
            event.preventDefault();
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            const validText = pastedText.toLowerCase().replace(/[^a-z0-9-]/g, '');
            event.target.value = validText;
        });
    }
    
    // Gestione automatica dello scroll nella chat
    const chatMessagesContainer = document.querySelector('.chat-messages');
    if (chatMessagesContainer) {
        // Scrolla in basso appena si apre la chat
        scrollToBottom();
        // Scrolla in basso ogni volta che arrivano nuovi messaggi
        const observer = new MutationObserver(scrollToBottom);
        observer.observe(chatMessagesContainer, { childList: true, subtree: true });
    }

    // Funzione per scorrere la chat verso il basso
    function scrollToBottom() {
        const container = document.querySelector('.chat-messages');
        if (container) container.scrollTop = container.scrollHeight;
    }

    // Mette automaticamente il focus sul campo messaggio della chat
    const chatInput = document.querySelector('.chat-input input[name="message"]');
    if (chatInput) chatInput.focus();
    
    // Gestione del modal di conferma cancellazione post
    const deletePostModal = document.getElementById('deletePostModal');
    if (deletePostModal) {
        deletePostModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const postId = button.getAttribute('data-post-id');
            const postTitle = button.getAttribute('data-post-title');
            // Update form action
            const deleteForm = document.getElementById('deletePostForm');
            deleteForm.action = '/posts/' + postId + '/delete';
        });
    }
});