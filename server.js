const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { randomBytes } = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json()); // For JSON POST bodies
app.use(express.static('public'));

// Map socket users to rooms
const users = {};
// Optional: store message history per room
const roomMessages = {};

// Generate random room code
function generateRoomCode() {
  return randomBytes(2).toString('hex').toUpperCase(); // 4 chars
}

// WebSocket (Socket.io) handlers
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('create room', (username, callback) => {
    const room = generateRoomCode();
    socket.join(room);
    users[socket.id] = { username, room };
    roomMessages[room] = [];
    console.log(`${username} created room ${room}`);
    callback(room);
  });

  socket.on('join room', (username, room, callback) => {
    if (!io.sockets.adapter.rooms.has(room)) {
      callback({ success: false, message: 'Room not found' });
      return;
    }
    socket.join(room);
    users[socket.id] = { username, room };
    io.to(room).emit('system', `${username} joined ${room}`);
    callback({ success: true });
  });

  socket.on('chat message', (msg) => {
    const user = users[socket.id];
    if (user && user.room) {
      const payload = { user: user.username, text: msg };
      io.to(user.room).emit('chat message', payload);
      roomMessages[user.room].push(payload);
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('system', `${user.username} left ❌`);
      delete users[socket.id];
    }
  });
});
