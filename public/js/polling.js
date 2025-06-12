"use strict";

document.addEventListener('DOMContentLoaded', function() {
    // Trova gli elementi della chat nella pagina
    const chatContainer = document.querySelector('.chat-messages');
    const chatForm = document.querySelector('.chat-input form');
    
    // Se non siamo in una pagina di chat, esci
    if (!chatContainer || !chatForm) return;
    
    // Prende il nome dell'altro utente dall'URL (es: /chat/mario -> "mario")
    const otherUsername = window.location.pathname.split('/chat/')[1];
    if (!otherUsername) return;
    
    let lastMessageId = getLastMessageId();
    let pollInterval;
    
    // Trova l'ID dell'ultimo messaggio già presente
    function getLastMessageId() {
        const messages = chatContainer.querySelectorAll('[data-message-id]');
        if (messages.length > 0) {
            return parseInt(messages[messages.length - 1].dataset.messageId);
        }
        return 0; // Se non ci sono messaggi, inizia da 0
    }
    
    // Crea un nuovo elemento messaggio per la chat
    function createMessage(message) {
        const currentUser = chatForm.dataset.currentUser;
        const div = document.createElement('div');
        
        // Decide se il messaggio è nostro o dell'altro utente
        const isMyMessage = message.senderUsername === currentUser;
        div.className = `message ${isMyMessage ? 'message-sent' : 'message-received'}`;
        div.dataset.messageId = message.id;
        
        div.innerHTML = `<div class="message-content">${message.content}</div>`;
        return div;
    }
      // Controlla se ci sono nuovi messaggi dal server
    async function checkForNewMessages() {
        try {
            const response = await fetch(`/chat/api/messages/${otherUsername}?lastMessageId=${lastMessageId}`);
            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                // Se è il primo messaggio, rimuove l'avviso "Ancora nessun messaggio"
                const emptyMessage = chatContainer.querySelector('.text-center.text-muted');
                if (emptyMessage && emptyMessage.textContent.includes('Ancora nessun messaggio')) {
                    emptyMessage.remove();
                }
                
                // Aggiunge ogni nuovo messaggio alla chat
                data.messages.forEach(message => {
                    chatContainer.appendChild(createMessage(message));
                    lastMessageId = message.id; // Aggiorna l'ultimo ID
                });
                
                // Scrolla in basso per vedere i nuovi messaggi
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        } catch (error) {
            console.error('Errore nel controllo messaggi:', error);
        }
    }
      // Invia un messaggio al server
    async function sendMessage(messageText) {
        try {
            const response = await fetch(chatForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message: messageText })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Se è il primo messaggio, rimuove l'avviso "Ancora nessun messaggio"
                const emptyMessage = chatContainer.querySelector('.text-center.text-muted');
                if (emptyMessage && emptyMessage.textContent.includes('Ancora nessun messaggio')) {
                    emptyMessage.remove();
                }
                
                // Crea immediatamente il messaggio nella chat
                const currentUser = chatForm.dataset.currentUser;
                const newMessage = {
                    id: result.messageId,
                    content: messageText,
                    senderUsername: currentUser
                };
                
                chatContainer.appendChild(createMessage(newMessage));
                lastMessageId = result.messageId;
                
                // Scrolla in basso
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                chatForm.reset(); // Pulisce il campo di input
                return true;
            }
        } catch (error) {
            console.error('Errore nell\'invio del messaggio:', error);
        }
        return false;
    }
    
    // Quando l'utente invia il form
    chatForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impedisce il refresh della pagina
        
        const input = chatForm.querySelector('input[name="message"]');
        const messageText = input.value.trim();
        
        if (messageText) {
            const sendButton = chatForm.querySelector('button');
            
            // Disabilita il pulsante per evitare invii multipli
            sendButton.disabled = true;
            await sendMessage(messageText);
            sendButton.disabled = false;
            
            input.focus(); // Rimette il cursore nel campo di input
        }
    });
    
    // Avvia il controllo automatico dei messaggi
    checkForNewMessages(); // Prima verifica immediata
    pollInterval = setInterval(checkForNewMessages, 2000); // Poi ogni 2 secondi
    
    // Ferma il controllo quando si chiude la pagina
    window.addEventListener('beforeunload', function() {
        clearInterval(pollInterval);
    });
});