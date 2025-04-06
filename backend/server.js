const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {

    socket.on('message', (msg) => {
        io.emit('message', `Server: ${msg}`);
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', `${username} is typing...`);
    });

    socket.on('disconnect', () => console.log('Client disconnected'));
});

server.listen(5000, () => {
    console.log('Socket.io server running on port 5000');
});
