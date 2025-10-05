import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { randomBytes } from 'crypto';
import { describe } from './utility/gemini_management.mjs';

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

// --- SOCKET.IO HANDLERS (same as before) ---
io.on('connection', (socket) => {
  socket.on('create room', (username, callback) => {
    const room = generateRoomCode();
    socket.join(room);
    users[socket.id] = { username, room };
    roomMessages[room] = [];
    callback(room);
  });

  socket.on('join room', (username, room, callback) => {
    if (!roomMessages[room]) {
      roomMessages[room] = []; // create the room if it doesn’t exist
    }
    socket.join(room);
    users[socket.id] = { username, room };
    io.to(room).emit('system', `${username} joined ${room}`);
    callback({ success: true });
  });

  socket.on('chat message', (msg) => {
    const user = users[socket.id];
    if (user && user.room) {
        console.log(msg);
        if (msg == "a great big tree") {console.log( describe(["tree", "big", "great"], "English"))}
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

// --- REST API ROUTES ---
// 1. Create Room (external apps)
app.post('/api/createRoom', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const room = generateRoomCode();
  roomMessages[room] = [];
  res.json({ room, username });
});

// 2. Join Room (optional for external apps if needed)
app.post('/api/joinRoom', (req, res) => {
  const { username, room } = req.body;
  if (!username || !room) return res.status(400).json({ error: 'Missing username or room' });
  if (!roomMessages[room]) return res.status(404).json({ error: 'Room not found' });

  res.json({ success: true, room });
});

// 3. Send message
app.post('/api/send', (req, res) => {
  const { room, user, text } = req.body;
  if (!room || !text) return res.status(400).json({ error: 'Missing room or text' });
  if (!roomMessages[room]) return res.status(404).json({ error: 'Room not found' });

  const message = { user: user || 'API Bot 🤖', text };
  io.to(room).emit('chat message', message);
  roomMessages[room].push(message);
  res.json({ success: true, delivered: true });
});

// 4. Get messages (latest per user optional)
app.get('/api/rooms/:room', (req, res) => {
  const room = req.params.room;
  const latest = req.query.latest === 'true'; // ?latest=true
  const messages = roomMessages[room];

  if (!messages) return res.status(404).json({ error: 'Room not found' });

  if (latest) {
    const latestByUser = new Map();
    for (const msg of messages) latestByUser.set(msg.user, msg);
    return res.json({ room, messages: Array.from(latestByUser.values()) });
  }

  res.json({ room, messages });
});

const PORT = 443;

// Always bind to 0.0.0.0 (not localhost)
server.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));