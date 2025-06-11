// Funzionalità di polling della chat
document.addEventListener('DOMContentLoaded', function() {
    // Controlla se siamo in una pagina di chat
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const chatForm = document.querySelector('.chat-input form');
    if (chatMessagesContainer && chatForm) {
        // Estrae il nome utente dell'altro utente dall'azione del form
        const formAction = chatForm.getAttribute('action');
        const usernameMatch = formAction.match(/\/chat\/([^\/]+)\/send$/);
        if (usernameMatch) {
            const otherUsername = usernameMatch[1];
            let lastMessageId = getLastMessageId();
            let isPolling = false;
            // Traccia la visibilità della pagina per ottimizzare il polling
            let isPageVisible = !document.hidden;
            // Funzione per ottenere l'ID dell'ultimo messaggio nella chat
            function getLastMessageId() {
                const messages = chatMessagesContainer.querySelectorAll('.message[data-message-id]');
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    const messageId = lastMessage.getAttribute('data-message-id');
                    const id = messageId ? parseInt(messageId) : 0;
                    return id;
                }
                return 0;
            }
            // Funzione per aggiungere nuovi messaggi alla chat
            function appendNewMessages(messages) {
                // Rimuove il messaggio placeholder se esiste (quando viene aggiunto il primo messaggio)
                const placeholderMessage = chatMessagesContainer.querySelector('.text-center.text-muted');
                if (placeholderMessage && messages.length > 0) {
                    placeholderMessage.remove();
                }
                
                messages.forEach(message => {
                    const messageElement = createMessageElement(message);
                    chatMessagesContainer.appendChild(messageElement);
                    lastMessageId = Math.max(lastMessageId, message.id);
                });
                // Scrolla verso il basso se sono stati aggiunti nuovi messaggi
                if (messages.length > 0) {
                    scrollChatToBottom();
                    // Aggiunge un effetto flash sottile per indicare nuovi messaggi
                    const newMessages = Array.from(chatMessagesContainer.children).slice(-messages.length);
                }
            }
            // Funzione per creare un elemento messaggio
            function createMessageElement(message) {
                const messageDiv = document.createElement('div');
                const currentUsername = chatForm.getAttribute('data-current-user');    
                const isOwnMessage = message.senderUsername === currentUsername;
                messageDiv.className = `message ${isOwnMessage ? 'message-sent' : 'message-received'}`;
                messageDiv.setAttribute('data-message-id', message.id);
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.textContent = message.content;
                messageDiv.appendChild(contentDiv);
                return messageDiv;
            }
            // Funzione per inviare messaggio tramite AJAX
            async function sendMessage(messageText) {
                try {
                    const response = await fetch(chatForm.getAttribute('action'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            message: messageText
                        })
                    });
                    if (response.ok) {
                        // Svuota l'input
                        const messageInput = chatForm.querySelector('input[name="message"]');
                        messageInput.value = '';    
                        // Effettua il polling per nuovi messaggi immediatamente per ottenere il messaggio inviato
                        setTimeout(pollForNewMessages, 100);
                        return true;
                    } else {
                        console.error('Failed to send message');
                        return false;
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    return false;
                }
            }
            // Funzione per effettuare il polling per nuovi messaggi
            async function pollForNewMessages() {
                if (isPolling) return;
                // Salta il polling se la pagina non è visibile (ottimizzazione)
                if (!isPageVisible) return;
                isPolling = true;
                try {
                    const response = await fetch(`/chat/api/messages/${otherUsername}?lastMessageId=${lastMessageId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.messages && data.messages.length > 0) {
                            appendNewMessages(data.messages);
                        }
                    }
                } catch (error) {
                    console.error('Error polling for new messages:', error);
                } finally {
                    isPolling = false;
                }
            }
            // Funzione per scorrere la chat verso il basso (riutilizza da scripts.js esistente)
            function scrollChatToBottom() {
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            }
            // Inizia il polling immediatamente e poi ogni 2 secondi
            pollForNewMessages(); // Polling iniziale
            const pollInterval = setInterval(pollForNewMessages, 2000);
            // Gestisce i cambiamenti di visibilità della pagina per ottimizzare il polling
            document.addEventListener('visibilitychange', function() {
                isPageVisible = !document.hidden;
                if (isPageVisible) {
                    // Effettua il polling immediatamente quando la pagina diventa visibile
                    setTimeout(pollForNewMessages, 100);
                }
            });
            // Gestisce l'invio del form per inviare messaggio tramite AJAX
            chatForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const messageInput = chatForm.querySelector('input[name="message"]');
                const messageText = messageInput.value.trim();
                if (messageText) {
                    const submitButton = chatForm.querySelector('button[type="submit"]');
                    submitButton.disabled = true;
                    const success = await sendMessage(messageText); 
                    submitButton.disabled = false;
                    if (success) {
                        messageInput.focus();
                    }
                }
            });
            // Pulisce il polling quando si lascia la pagina
            window.addEventListener('beforeunload', function() {
                clearInterval(pollInterval);
            });
            // Pulisce anche quando si naviga via tramite link
            document.addEventListener('click', function(e) {
                const link = e.target.closest('a[href]');
                if (link && !link.href.includes('/chat/')) {
                    clearInterval(pollInterval);
                }
            });
        }
    }
});