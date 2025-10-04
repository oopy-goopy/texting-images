const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = {}; // socket.id → username mapping

io.on('connection', (socket) => {
  console.log('A user connected 🟢', socket.id);

  // When a client sets their username
  socket.on('set username', (username) => {
    users[socket.id] = username;
    console.log(`${username} joined the chat 🎉`);
    io.emit('user joined', `${username} joined the chat`);
  });

  // When someone sends a message
  socket.on('chat message', (msg) => {
    const username = users[socket.id] || 'Anonymous';
    io.emit('chat message', { user: username, text: msg });
  });

  // When someone disconnects
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      io.emit('user left', `${username} left the chat ❌`);
      delete users[socket.id];
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
