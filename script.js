document.addEventListener('DOMContentLoaded', () => {
    let socket = null;

    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const connectionStatus = document.getElementById('connection-status');
    const iniciarBtn = document.getElementById('iniciarBtn');
    const encerrarBtn = document.getElementById('encerrarBtn');

    let userSessionId = null;

    // Função para adicionar mensagens no chat
    function addMessageToChat(sender, text, type = 'normal') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'max-w-[70%]', 'px-4', 'py-3', 'rounded-2xl', 'shadow-md', 'break-words');

    if (sender.toLowerCase() === 'user') {
        // Mensagem do usuário: alinhada à direita, balão azul escuro com texto branco
        messageElement.classList.add('user-message', 'bg-blue-900', 'text-white', 'self-end', 'rounded-tr-2xl', 'rounded-bl-2xl', 'rounded-br-xl');
        sender = 'Você';
    } else if (sender.toLowerCase() === 'bot') {
        // Mensagem do bot: alinhada à esquerda, balão azul claro com texto azul escuro
        messageElement.classList.add('bot-message', 'bg-blue-200', 'text-blue-900', 'self-start', 'rounded-tl-2xl', 'rounded-br-2xl', 'rounded-tr-xl');
        sender = 'Bot';
    } else {
        // Mensagem de status ou erro centralizada, sem balão
        messageElement.classList.add('status-message', 'bg-transparent', 'text-center', 'text-gray-600', 'italic', 'self-center', 'max-w-full', 'p-0', 'shadow-none');
    }

    if (type === 'error') {
        messageElement.classList.remove('status-message');
        messageElement.classList.add('error-text', 'bg-red-100', 'text-red-700', 'self-center', 'max-w-full', 'p-4', 'rounded-xl');
        sender = 'Erro';
    } else if (type === 'status') {
        messageElement.classList.remove('error-text');
        messageElement.classList.add('status-text', 'bg-gray-100', 'text-gray-500', 'self-center', 'max-w-full', 'p-2', 'rounded-xl', 'italic');
        sender = 'Status';
    }

    // Criar o conteúdo da mensagem com o remetente em negrito + texto, mas só para mensagens normais
    if (type === 'normal') {
        const senderSpan = document.createElement('strong');
        senderSpan.textContent = `${sender}: `;
        messageElement.appendChild(senderSpan);
    }

    const textSpan = document.createElement('span');
    textSpan.innerHTML = marked.parse(text);
    messageElement.appendChild(textSpan);

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    }
    // Função para habilitar/desabilitar o chat
    function setChatEnabled(enabled) {
        messageInput.disabled = !enabled;
        sendButton.disabled = !enabled;
    }
    // Inicialmente desativa o chat
    setChatEnabled(false);
    connectionStatus.textContent = 'Desconectado';
    connectionStatus.className = 'status-offline';
    addMessageToChat('Status', 'Clique em "Iniciar conversa" para começar.', 'status');
    // Função para conectar ao servidor
    function iniciarConversa() {
        if (socket && socket.connected) return;

            socket = io('http://localhost:5000');
            
            socket.on('connect', () => {
            console.log('Conectado ao servidor Socket.IO! SID:', socket.id);
            connectionStatus.textContent = 'Conectado';
            connectionStatus.className = 'status-online';
            addMessageToChat('Status', 'Conectado ao servidor de chat.', 'status')
            setChatEnabled(true);
            });
        socket.on('disconnect', () => {
            console.log('Desconectado do servidor Socket.IO.');
            connectionStatus.textContent = 'Desconectado';
            connectionStatus.className = 'status-offline';
            addMessageToChat('Status', 'Você foi desconectado.', 'status');
            setChatEnabled(false);
        });
        socket.on('status_conexao', (data) => {
            if (data.session_id) {
            userSessionId = data.session_id;
            }
            });
        socket.on('nova_mensagem', (data) => {
        addMessageToChat(data.remetente, data.texto);
        });
        socket.on('erro', (data) => {
        addMessageToChat('Erro', data.erro, 'error');
        });
    }
    // Função para encerrar a conversa
    function encerrarConversa() {
        if (socket && socket.connected) {
            socket.disconnect();
            setChatEnabled(false);
            addMessageToChat('Status', 'Conversa encerrada pelo usuário.', 'status');
        }
    }
    // Enviar mensagem para o servidor
    function sendMessageToServer() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;
    if (socket && socket.connected) {
        addMessageToChat('user', messageText);
        socket.emit('enviar_mensagem', { mensagem: messageText });
        messageInput.value = '';
        messageInput.focus();
    } else {
        addMessageToChat('Erro', 'Não conectado ao servidor.', 'error');
        }
    }
    // Eventos dos botões
    iniciarBtn.addEventListener('click', iniciarConversa);
    encerrarBtn.addEventListener('click', encerrarConversa);
    sendButton.addEventListener('click', sendMessageToServer);

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
        sendMessageToServer();
        }
    });
});
