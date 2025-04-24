const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Relay signal to the intended recipient
  socket.on('send-signal', ({ signalData, to }) => {
    if (to) {
      io.to(to).emit('receive-signal', { from: socket.id, signalData });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Backend running on http://192.168.8.100:5000');
});
