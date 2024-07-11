const socket = io();

let roomId;
let playerName;

function createRoom() {
    roomId = document.getElementById('create-room-id').value;
    playerName = document.getElementById('creator-name').value;
    const numberOfGood = parseInt(document.getElementById('number-of-good').value);
    const numberOfBad = parseInt(document.getElementById('number-of-bad').value);
    socket.emit('createRoom', { roomId, numberOfGood, numberOfBad, playerName });
}

function joinRoom() {
    roomId = document.getElementById('join-room-id').value;
    playerName = document.getElementById('player-name').value;
    socket.emit('joinRoom', { roomId, playerName });
}

function startGame() {
    socket.emit('startGame', roomId);
}

function playerReady() {
    socket.emit('playerReady', roomId);
}

socket.on('roomCreated', (roomId) => {
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    console.log(`Room ${roomId} created`);
});

socket.on('updatePlayers', (players) => {
    const playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-info');
        playerDiv.innerHTML = `<h3>${player.name}</h3>`;
        playersDiv.appendChild(playerDiv);
    });
});

socket.on('gameStarted', (players) => {
    const playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-info');
        playerDiv.innerHTML = `
            <h3>${player.name}</h3>
            <p>Rôle: ${player.role === 'good' ? 'Gentil' : 'Méchant'}</p>
            <h4>Cartes:</h4>
            <div class="cards">
                ${player.cards.map(card => `<div class="card"><img src="cards/${card.display()}" alt="${card.display()}"></div>`).join('')}
            </div>
            <p class="${player.ready ? 'ready' : ''}">Prêt: ${player.ready ? 'Oui' : 'Non'}</p>
        `;
        playersDiv.appendChild(playerDiv);
    });
    document.getElementById('ready-button').style.display = 'block';
});

socket.on('allPlayersReady', () => {
    console.log('All players are ready');
});
