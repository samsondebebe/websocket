import React from 'react';
import WebSocketComponent from './components/WebSocketComponent';

function App() {
    return (
        <div>
            <h1>Private Chat</h1>
            <WebSocketComponent userId="user1" /> {/* Change for each user */}
        </div>
    );
}

export default App;
