const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let rooms = {};

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('createRoom', ({ roomId, numberOfGood, numberOfBad, playerName }) => {
        rooms[roomId] = {
            players: [],
            numberOfGood,
            numberOfBad,
            gameStarted: false
        };
        const player = { id: socket.id, name: playerName, role: null, cards: [], ready: false };
        rooms[roomId].players.push(player);
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
        io.to(roomId).emit('updatePlayers', rooms[roomId].players);
    });

    socket.on('joinRoom', ({ roomId, playerName }) => {
        if (rooms[roomId]) {
            const room = rooms[roomId];
            if (!room.gameStarted) {
                const player = { id: socket.id, name: playerName, role: null, cards: [], ready: false };
                room.players.push(player);
                socket.join(roomId);
                io.to(roomId).emit('updatePlayers', room.players);
            } else {
                socket.emit('error', 'Game already started');
            }
        } else {
            socket.emit('error', 'Room does not exist');
        }
    });

    socket.on('startGame', (roomId) => {
        const room = rooms[roomId];
        if (room && room.players.length >= room.numberOfGood + room.numberOfBad) {
            room.gameStarted = true;
            assignRolesAndCards(room);
            io.to(roomId).emit('gameStarted', room.players);
        }
    });

    socket.on('playerReady', (roomId) => {
        const room = rooms[roomId];
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.ready = true;
            const allReady = room.players.every(p => p.ready);
            if (allReady) {
                io.to(roomId).emit('allPlayersReady');
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        for (let roomId in rooms) {
            const room = rooms[roomId];
            room.players = room.players.filter(p => p.id !== socket.id);
            io.to(roomId).emit('updatePlayers', room.players);
        }
    });
});

function assignRolesAndCards(room) {
    let roles = Array(room.numberOfGood).fill('good').concat(Array(room.numberOfBad).fill('bad'));
    shuffleArray(roles);
    room.players.forEach((player, index) => {
        player.role = roles[index];
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
