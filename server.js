const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { randomBytes } = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

const users = {};          // socket.id → { username, room }
const roomMessages = {};   // roomCode → [messages]

// Generate 4-letter room codes
function generateRoomCode() {
  return randomBytes(2).toString('hex').toUpperCase();
}

// ----- SOCKET.IO -----
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

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

// ----- EXPRESS API -----
app.post('/api/send', (req, res) => {
  const { room, user, text } = req.body;
  if (!room || !text) {
    return res.status(400).json({ error: 'Missing room or text' });
  }
  if (!io.sockets.adapter.rooms.has(room)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  const message = { user: user || 'API Bot 🤖', text };
  io.to(room).emit('chat message', message);
  if (!roomMessages[room]) roomMessages[room] = [];
  roomMessages[room].push(message);
  res.json({ success: true, delivered: true });
});

app.get('/api/rooms/:room', (req, res) => {
  const room = req.params.room;
  const messages = roomMessages[room];

  if (!messages) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Map to store most recent message per user
  const latestByUser = new Map();

  // Loop through messages in order and overwrite older ones
  for (const msg of messages) {
    latestByUser.set(msg.user, msg);
  }

  // Convert Map back to an array
  const latestMessages = Array.from(latestByUser.values());

  res.json({ room, messages: latestMessages });
});


const PORT = 3000;
server.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
