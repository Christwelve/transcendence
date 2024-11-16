const http = require('http');
const express = require('express');
const {Server: WebSocketServer} = require('socket.io');
const app = express();
const server = http.createServer(app);

const io = new WebSocketServer(server, {
	serveClient: false,
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
		// allowedHeaders: ['my-custom-header'],
		credentials: true
	}
});

const port = 4000;

let roomId = 0;
const playerList = [];
const roomList = [];

server.listen(port, () => {
	console.log(`Nodejs listening at http://localhost:${port}`);
});

function randi(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function getRoomMeta(room) {
	const {id, name, type, status, players, playersMax} = room;

	const playersCurrent = players.length;

	return {
		id,
		name,
		type,
		status,
		playersCurrent,
		playersMax,
	};
}

function getRoomMetaList() {
	return roomList.map(getRoomMeta);
}

function createRoom(player, options) {
	const {name, type, playersMax} = options;

	const id = roomId++;
	const status = 0;
	const players = [player];

	return {
		id,
		name,
		type,
		status,
		players,
		playersMax,
	};
}

io.on('connection', async socket => {

	const player = {
		id: socket.id,
		name: Math.random().toString(36).substring(2, 7),
		state: 0,
	};

	playerList.push(player);

	socket.emit('game.room.list', getRoomMetaList());

	// setInterval(() => {
	// 	const index = randi(0, roomList.length - 1);
	// 	const room = roomList[index];
	// 	const randomPlayerCount = randi(0, room.playersMax);
	// 	room.players = randomPlayerCount;
	// 	socket.emit('game.room.update', room);
	// }, 1000);

	socket.on('game.room.create', options => {
		const room = createRoom(player, options);
		const meta = getRoomMeta(room);

		roomList.push(room);

		io.emit('game.room.create', meta);
	});

	console.log('user connected');
});
