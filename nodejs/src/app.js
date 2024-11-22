const http = require('http');
const express = require('express');
const {Server: WebSocketServer} = require('socket.io');
const app = express();
const server = http.createServer(app);
const {createProxy, sendInstructions} = require('./proxy.js');

const io = new WebSocketServer(server, {
	serveClient: false,
	cors: {
		origin: '*',
		// origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
		// allowedHeaders: ['my-custom-header'],
		credentials: true
	}
});

const port = 4000;

let roomId = 0;

const template = {
	players: {},
	rooms: {},
}
const data = createProxy(template);

setInterval(sendInstructions.bind(null, io.emit.bind(io, 'instruction')), 0);

server.listen(port, () => {
	console.log(`Nodejs listening at http://localhost:${port}`);
});

function getPlayerFromSocket(socket) {
	return data.players[socket.id];
}

function createRoom(player, options) {
	const {name, type, playersMax} = options;

	const id = roomId++;
	const status = 0;
	const players = [player.id];

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
		room: null,
		ready: false,
	};

	data.players[player.id] = player;

	socket.on('ready', () => {
		socket.emit('user.id', player.id);
		socket.emit('instruction', [{action: 'overwrite', value: data}]);
	});

	socket.on('room.create', options => {
		const player = getPlayerFromSocket(socket);
		const room = createRoom(player, options);

		data.rooms[room.id] = room;
		player.state = 1;
		player.roomId = room.id;
	});

	socket.on('room.join', options => {
		const {id} = options;
		const player = getPlayerFromSocket(socket);

		const room = data.rooms[id];

		if(room == null)
			return socket.emit('game.error', {title: 'Can not join room', message: `Room with id ${id} does not exist.`});

		const {players, playersMax} = room;

		if(players.length === playersMax)
			return socket.emit('game.error', {title: 'Can not join room', message: `Room is full.`});

		player.state = 1;
		player.roomId = room.id;
		room.players.push(player.id);
	});

	socket.on('room.leave', () => {
		const player = getPlayerFromSocket(socket);
		const {roomId} = player;

		if(roomId == null)
			return;

		const room = data.rooms[roomId];

		if(room != null) {
			const index = room.players.findIndex(id => id === player.id);
			room.players.splice(index, 1);

			if(room.players.length === 0)
				delete data.rooms[roomId];
		}

		player.roomId = null;
		player.ready = false;
		player.state = 0;
	});

	socket.on('player.ready', () => {
		const player = getPlayerFromSocket(socket);

		if(player.roomId == null)
			return;

		player.ready = !player.ready;
	});

	socket.on('disconnect', () => {
		const player = getPlayerFromSocket(socket);
		const room = data.rooms[player.roomId];

		if(room != null) {
			const index = room.players.findIndex(id => id === player.id);
			room.players.splice(index, 1);
		}

		delete data.players[player.id];
	});

	console.log('user connected', socket.handshake.address);
});
