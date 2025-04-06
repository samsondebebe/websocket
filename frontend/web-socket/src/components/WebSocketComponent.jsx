import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import '../app.css'
const WebSocketComponent = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [typingMessage, setTypingMessage] = useState('');

    useEffect(() => {
        const newSocket = io('http://192.168.0.105:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to Socket.io server');
        });

        newSocket.on('message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Listen for typing event
        newSocket.on('typing', (typingMsg) => {
            setTypingMessage(typingMsg);
            setTimeout(() => setTypingMessage(''), 2000); // Clear after 2 sec
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        return () => newSocket.disconnect();
    }, []);

    const sendMessage = () => {
        if (socket && input.trim()) {
            socket.emit('message', input);
            setInput('');
        }
    };

    const handleTyping = (e) => {
        setInput(e.target.value);
        socket.emit('typing', 'samson');
    };
    return (
        <div>
            <h2>Chat</h2>
            {typingMessage && <p>{typingMessage}</p>}
            <input
                type="text"
                value={input}
                onChange={handleTyping}
                placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
        </div>
    );
};

export default WebSocketComponent;
