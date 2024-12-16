import http from 'http'
import express from 'express'
import {Server as WebSocketServer} from 'socket.io'
import {createProxy, sendInstructions} from './proxy.js'
import {ServerTick} from 'shared/tick'

const app = express();
const server = http.createServer(app);

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

const games = {};

setInterval(sendInstructions.bind(null, io.emit.bind(io, 'instruction')), 0);

server.listen(port, () => {
	console.log(`Nodejs listening at http://localhost:${port}`);
});

function getPlayerFromSocket(socket) {
	return data.players[socket.id];
}

function getRoomFromPlayer(player) {
	return data.rooms[player.roomId];
}

function getPlayersFromRoom(room) {
	return room.players.map(playerId => data.players[playerId]);
}

function removePlayerFromRoom(player, room) {
	if(room == null)
		return;

	const {id, players, masterId} = room;

	const playerIndex = players.findIndex(playerId => playerId === player.id);
	players.splice(playerIndex, 1);

	const game = games[id];

	if(game != null)
		game.removePlayer(player);

	if(players.length === 0) {
		games[id]?.detach();

		delete games[id];
		delete data.rooms[id];
	}
	else if(player.id === masterId) {
		const newMasterId = players[0];

		data.players[newMasterId].ready = false;

		room.masterId = newMasterId;
	}

	player.roomId = null;
	player.ready = false;
	player.index = -1;
}

function createRoom(player, options) {
	const {name: nameRaw, type, playersMax} = options;

	const name = nameRaw == null || nameRaw === '' ? Math.random().toString(36).substring(2, 9) : nameRaw.trim().substring(0, 16);

	const id = roomId++;
	const status = 0;
	const players = [player.id];
	const masterId = player.id;

	return {
		id,
		name,
		type,
		status,
		players,
		playersMax,
		activePlayers: [],
		masterId,
	};
}

const onTick = tick => {
	updatePlayers(tick);
	updateBall(tick);
}

function updateBall(tick) {
	const collided = tick.moveBall();

	if(!collided)
		return;

	tick.sendCollisionToPlayers(io);
}

function updatePlayers(tick) {
	const entries = tick.getQueueEntries();

	if(entries.length === 0)
		return;

	entries.forEach(entry => {
		const {player, event} = entry;
		const eventId = event[0];
		const input = event[3];

		tick.applyInput(input, player.index);
		tick.updateVerifiedEventId(eventId, player.index);
	});

	tick.sendUpdateToPlayers(io);
}

io.on('connection', async socket => {

	const player = {
		id: socket.id,
		name: Math.random().toString(36).substring(2, 7),
		state: 0,
		roomId: null,
		ready: false,
		index: -1,
	};

	data.players[player.id] = player;

	// const room = createRoom(player, {name: 'test', type: 0, playersMax: 4});
	// data.rooms[room.id] = room;

	// ---- test
	// const roomIds = Reflect.ownKeys(data.rooms);
	// let room;

	// if(roomIds.length === 0) {
	// 	room = createRoom(player, {name: 'test', type: 0, playersMax: 4});
	// 	data.rooms[room.id] = room;
	// 	games[room.id] = new ServerTick([player], onTick);
	// } else {
	// 	room = data.rooms[roomIds[0]];
	// }

	// player.roomId = room.id;
	// room.players.push(player.id);
	// ---- test


	socket.emit('user.id', player.id);
	socket.emit('instruction', [{action: 'overwrite', value: data}]);

	socket.on('room.create', options => {
		const player = getPlayerFromSocket(socket);

		const currentRoom = getRoomFromPlayer(player);

		removePlayerFromRoom(player, currentRoom);

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
			return socket.emit('notice', {type: 'error', title: 'Can not join room', message: `Room with id ${id} does not exist.`});

		if(player.roomId === room.id)
			return;

		const {status, players, playersMax} = room;

		if(status !== 0)
			return socket.emit('notice', {type: 'error', title: 'Can not join room', message: `Room already started.`});

		if(players.length === playersMax)
			return socket.emit('notice', {type: 'error', title: 'Can not join room', message: `Room is full.`});

		const currentRoom = getRoomFromPlayer(player);

		removePlayerFromRoom(player, currentRoom);

		player.state = 1;
		player.roomId = room.id;
		room.players.push(player.id);
	});

	socket.on('room.leave', () => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if(room == null)
			return;

		removePlayerFromRoom(player, room);

		player.state = 0;
	});

	socket.on('player.ready', () => {
		const player = getPlayerFromSocket(socket);

		if(player.state !== 1)
			return;
		if(player.roomId == null)
			return;

		player.ready = !player.ready;
	});

	socket.on('game.start', () => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if(room == null)
			return;
		if(player.id !== room.masterId)
			return;
		if(player.state !== 1)
			return;

		const players = getPlayersFromRoom(room);

		const activePlayers = players.slice(0, 4);
		const activePlayerIds = activePlayers.map(player => player.id);

		room.status = 1;
		room.activePlayers = activePlayerIds;

		players.forEach(player => player.state = 2);

		const game = new ServerTick(activePlayers, room.activePlayers, onTick);

		games[room.id] = game;

		setTimeout(() => {

			game.startGame(io);

			setInterval(() => game.sendCollisionToPlayers(io), 300);

			setTimeout(() => room.status = 2, 3000);

		}, 1000);
	});

	socket.on('game.tick', (tickClient) => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if(room == null)
			return;

		const tick = games[room.id];

		if(tickClient == null)
			return socket.emit('game.tick', 'set', tick.getTick());

		const difference = tick.calculateOffsetDelta(tickClient);

		if(difference === 0)
			return;

		socket.emit('game.tick', 'adjust', difference);
	});

	socket.on('player.event', event => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if(room == null)
			return;

		const tick = games[room.id];

		// console.log(player.name, 'ct', event[1], 'st', tick._tick, 'diff', event[1] - tick._tick);

		if(tick.canQueueEvent(event))
			return tick.queueEvent(player, event);

		const [eventId] = event;

		socket.emit('packet.dropped', eventId);

		console.log('dropped packet from', player.name, event);
	});

	socket.on('disconnect', () => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		removePlayerFromRoom(player, room);

		delete data.players[player.id];
	});

	console.log('user connected', socket.handshake.address);
});
