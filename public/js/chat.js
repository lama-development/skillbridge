/*
Script per gestire funzionalità della chat lato client
*/

document.addEventListener('DOMContentLoaded', function() {
    // Auto-scroll al fondo della pagina
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        scrollToBottom();
    }

    // Invio dei messaggi
    const chatForm = document.querySelector('.chat-input form');
    if (chatForm) {
        const messageInput = chatForm.querySelector('input[name="message"]');
        
        // Auto-focus sull'input del messaggio
        if (messageInput) {
            messageInput.focus();
        }

        // Gestisce l'invio del form
        chatForm.addEventListener('submit', function(e) {
            const messageText = messageInput.value.trim();
            
            if (!messageText) {
                e.preventDefault();
                messageInput.focus();
                return false;
            }
            
            // Show sending state
            const submitBtn = chatForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalContent = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
                
                // Re-enable after a short delay (the form will submit anyway)
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalContent;
                }, 1000);
            }
        });
    }

    // Auto-refresha i messaggi ogni 10 secondi (polling)
    if (window.location.pathname.startsWith('/chat/') && window.location.pathname !== '/chat/') {
        setInterval(function() {
            // Only refresh if user is not currently typing
            const messageInput = document.querySelector('.chat-input input[name="message"]');
            if (messageInput && document.activeElement !== messageInput) {
                refreshMessages();
            }
        }, 10000); // 10 seconds
    }
});

function scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function refreshMessages() {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/chat/') || currentPath === '/chat/') {
        return;
    }

    // Simple page refresh for now 
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        // Store scroll position
        const wasAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10;
        // Only refresh if user was at bottom (they're actively chatting)
        if (wasAtBottom) {
            window.location.reload();
        }
    }
}