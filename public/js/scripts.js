document.addEventListener('DOMContentLoaded', function() {
    // Toggle visiblità password
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input.type === "password") {
                input.type = "text";
                this.innerHTML = '<i class="bi bi-eye-slash-fill"></i>';
            } else {
                input.type = "password";
                this.innerHTML = '<i class="bi bi-eye-fill"></i>';
            }
        });
    });

    // Validazione input username 
    const usernameInput = document.querySelector('input[name="username"]');
    if (usernameInput) {
        usernameInput.addEventListener('input', function(e) {
            // Mantieni solo lettere minuscole, numeri e trattini
            const validValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (e.target.value !== validValue) {
                e.target.value = validValue;
            }
        });
        
        // Previene incolla di contenuto non valido
        usernameInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const validPaste = paste.toLowerCase().replace(/[^a-z0-9-]/g, '');
            e.target.value = validPaste;
        });
    }

    // Auto-scroll chat alla fine
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Auto-focus su input messaggio chat
    const messageInput = document.querySelector('.chat-input input[name="message"]');
    if (messageInput) {
        messageInput.focus();
    }
});