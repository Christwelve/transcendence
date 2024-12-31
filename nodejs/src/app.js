import http from 'http'
import express from 'express'
import cookie from 'cookie'
import { Server as WebSocketServer } from 'socket.io'
import { createProxy, sendInstructions } from './proxy.js'
import { ServerTick } from 'shared/tick'

import * as https from 'https';
import fs from 'fs';

const app = express();

// const options = {
// 	key: fs.readFileSync('/code/nodejs/certs/key.pem'),
// 	cert: fs.readFileSync('/code/nodejs/certs/cert.pem')
// };

// console.log("key: ", options.key);
// console.log("cert: ", options.cert);


// Create an HTTPS server
// const server = https.createServer(options, app);

// Create an HTTP server
const server = http.createServer(app);

const io = new WebSocketServer(server, {
	serveClient: false,
	cors: {
		// origin: 'http://localhost:3000',
		// origin: 'http://10.11.2.25:3000',
		// origin: 'https://10.11.2.25:3000',
		origin: 'https://10.11.2.25',
		methods: ['GET', 'POST'],
		credentials: true
	}
});


const port = 4000;

let stateId = 0;
let roomId = 0;

const data = {
	players: {},
	rooms: {},
	tournaments: {},
}

const games = {};

// async function fetchMatches() {
// 	try {
// 		const response = await fetch('http://django:8000/api/matches/', {
// 			method: 'GET',
// 			headers: {
// 				'Content-Type': 'application/json',
// 			},
// 		});

// 		if (!response.ok) {
// 			throw new Error('Failed to fetch matches');
// 		}
// 		const data = await response.json();
// 		console.log('Fetched matches:', data);
// 		return data;
// 	} catch (error) {
// 		console.error('Error fetching matches:', error);
// 	}
// }

// async function fetchStatistics() {
// 	try {
// 		const response = await fetch('http://django:8000/api/statistics/', {
// 			method: 'GET',
// 			headers: {
// 				'Content-Type': 'application/json',
// 			},
// 		});

// 		if (!response.ok) {
// 			throw new Error('Failed to fetch statistics');
// 		}
// 		const data = await response.json();
// 		console.log('Fetched statistics:', data);
// 		return data;
// 	} catch (error) {
// 		console.error('Error fetching statistics:', error);
// 	}
// }

async function postMatch(matchData) {
	try {
		const response = await fetch('http://django:8000/api/matches/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(matchData),
		});

		if (!response.ok) {
			throw new Error('Failed to post match data');
		}

		const data = await response.json();
		console.log('Posted match data:', data);
		return data.id;
	} catch (error) {
		console.error('Error posting match data:', error);
	}
}

async function postStatistic(statisticData) {
	try {

		const response = await fetch('http://django:8000/api/statistics/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(statisticData),
		});

		if (!response.ok) {
			throw new Error('Failed to post statistics');
		}

		const data = await response.json();
		console.log('Posted statistics data:', data);
		return data;
	} catch (error) {
		console.error('Error posting statistics data:', error);
	}
}


setInterval(sendInstructions.bind(null, io.emit.bind(io, 'instruction')), 0);

server.listen(port, () => {
	console.log(`Node.js server listening at http://localhost:${port}, proxied through nginx`);
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
	if (room == null)
		return;

	const { id, players, masterId } = room;

	const playerIndex = players.findIndex(playerId => playerId === player.id);
	players.splice(playerIndex, 1);

	const activePlayerIndex = room.activePlayers.indexOf(player.id);

	if (activePlayerIndex !== -1)
		room.activePlayers[activePlayerIndex] = null;

	if (players.length === 0) {
		games[id]?.detach();

		delete games[id];
		delete data.rooms[id];
	}
	else if (player.id === masterId) {
		const newMasterId = players[0];

		data.players[newMasterId].ready = false;

		room.masterId = newMasterId;
	}

	if (room.type === 1) {
		const tournament = data.tournaments[room.id];
		const match = getMatchForPlayer(tournament, player.id);

		if (match != null && match.stage === 0)
			endMatch(tournament, match, player.id);
	}

	player.roomId = null;
	player.ready = false;
	player.index = -1;
}

function getMatchForPlayer(tournament, playerId) {
	const { level, brackets } = tournament;

	const bracket = brackets[level];

	const match = bracket.find(match => match.players.includes(playerId));

	return match;
}

function endMatch(tournament, match, leavingPlayerId) {
	match.stage = 2;

	const winnerIndex = getWinnerForMatch(match, leavingPlayerId);

	match.winner = match.players[winnerIndex];
}

function getWinnerForMatch(match, leavingPlayerId) {
	const winningPlayerIndex = +!match.players.indexOf(leavingPlayerId);

	if (leavingPlayerId != null)
		return winningPlayerIndex;

	const { scores } = match;
	const [score1, score2] = scores;

	if (score1 > score2)
		return 0;

	return 1;
}

function createRoom(player, options) {
	const { name: nameRaw, type, playersMax } = options;

	const name = nameRaw == null || nameRaw === '' ? Math.random().toString(36).substring(2, 9) : nameRaw.trim().substring(0, 16);

	const id = roomId++;
	const status = 0;
	const players = [player.id];
	const masterId = player.id;

	const room = {
		id,
		name,
		type,
		startTime: null,
		status,
		players,
		playersMax,
		activePlayers: [],
		masterId,
		scores: null,
		timer: 0,
		running: false,
	};

	resetRoom(room);

	return room;
}
// TODO: 60*60
function resetRoom(room) {
	room.scores = [...Array(4)].map(() => ({ scored: 0, received: 0 }));
	room.timer = 60 * 10;
}

function createTournament(room) {
	const players = [...getPlayersFromRoom(room)].map(player => player.id);

	players.sort(() => Math.random() - 0.5);

	const tournament = {
		roomId: room.id,
		level: -1,
		match: -1,
		activePlayers: players,
		brackets: [],
	};

	startBracket(tournament);

	return tournament;
}

function startBracket(tournament) {
	const bracket = createBracket(tournament);

	tournament.brackets.push(bracket);
	tournament.level++;
}

function startMatch(tournament) {
	const { roomId, level, brackets } = tournament;

	const bracket = brackets[level];

	const match = bracket.find(match => match.stage === 0);

	match.stage = 1;

	data.rooms[roomId].activePlayers = match.players;
}

function createBracket(tournament) {
	const players = getActivePlayers(tournament);

	const matches = [];

	while (players.length > 0) {
		const player1 = extractPlayer(players);
		const player2 = extractPlayer(players);

		const skipMatch = player1 == null || player2 == null;

		const match = {
			stage: skipMatch ? 2 : 0,
			players: [player1, player2],
			scores: [0, 0],
		};

		matches.push(match);
	}

	return matches;
}

function getActivePlayers(tournament) {
	const { level, activePlayers, brackets } = tournament;

	if (level === -1)
		return activePlayers.filter(player => data.players[player.id]);

	const bracket = brackets[level];

	return bracket.reduce((acc, match) => {
		const { players, scores } = match;
		const [player1, player2] = players;
		const [score1, score2] = scores;

		if (score1 > score2)
			return [...acc, player1];

		return [...acc, player2];
	}, []).filter(player => data.players[player.id]);
}

function extractPlayer(players) {
	const player = players.shift();

	if (player == null)
		return null;

	if (data.players[player] == null)
		return null;

	return player;
}

const onTick = tick => {
	const room = tick.getRoom();

	updatePlayers(tick);
	updateBall(tick);

	tick.sendGoalToPlayers(io, updateState, room)

	if (tick.getTick() % 300 === 0)
		updateState();

	if (room.running && room.timer > 0)
		room.timer--;

	if (tick.getTick() % 20 === 0) {
		const roomId = room.id;
		const game = games[roomId];
		game.sendCollisionToPlayers(io);
	}

	if (room.timer === 0 && room.running) {
		room.running = false;
		room.status = 3;

		setTimeout(async () => {
			await endGame(room);

			room.status = 0;
			room.players.forEach(id => {
				const player = data.players[id];

				if (player == null)
					return;

				player.state = 1;
				player.ready = false;
				player.index = -1;
			});

			resetRoom(room);

			updateState();
		}, 10000);

		updateState();
	}
};

async function endGame(room) {
	const endTime = new Date().toISOString();
	// TODO: Adjust Tourmanent Id
	const matchData = {
		startTime: room.startTime,
		endTime: endTime,
		tournamentId: null
	};

	console.log('Sending match data:', matchData);

	const matchId = await postMatch(matchData);

	if (matchId) {
		// STATISTIC DATA
		// TODO: handle logged out player (maybe store preliminary stats while game is running)
		const statisticData = room.activePlayers.reduce((acc, playerId, i) => {

			if (playerId == null)
				return acc;

			const player = data.players[playerId];
			const score = room.scores[i];

			const obj = {
				userId: player.tid,
				goalsScored: score.scored,
				goalsReceived: score.received,
				datetimeLeft: endTime,
				matchId
			};

			return [...acc, obj];
		}, []);

		console.log('Sending statistic data:', statisticData);
		await postStatistic(statisticData, matchId);
	} else {
		console.error('Match ID is undefined, cannot post statistics.');
	}
}

function updateBall(tick) {
	const { activePlayers } = tick.getRoom();
	const collided = tick.moveBall(activePlayers);

	if (!collided)
		return;

	tick.sendCollisionToPlayers(io);
}

function updatePlayers(tick) {
	const entries = tick.getQueueEntries();

	if (entries.length === 0)
		return;

	entries.forEach(entry => {
		const { player, event } = entry;
		const eventId = event[0];
		const input = event[3];

		tick.applyInput(input, player.index);
		tick.updateVerifiedEventId(eventId, player.index);
	});

	tick.sendUpdateToPlayers(io);
}

function updateState() {
	const payload = {
		id: ++stateId,
		data,
	};

	io.emit('state', payload);
}

function createPlayer(id, tid, username) {
	const fallbackName = Math.random().toString(36).substring(2, 7);

	const player = {
		id,
		tid,
		name: username ?? fallbackName,
		state: 0,
		roomId: null,
		ready: false,
		index: -1,
	};

	return player;
}

async function initConnection(socket) {
	const { cookie: cookieHeader } = socket.handshake.headers
	const cookies = cookie.parse(cookieHeader);

	const options = {
		method: 'GET',
		headers: {
			'Authorization': `Token ${cookies.authToken}`,
			'Content-Type': 'application/json',
			'Cookie': cookieHeader
		},
	};
	const response = await fetch('http://django:8000/api/user/validate/', options);

	if (!response.ok) {

		const body = await response.json();

		console.log('verify failed', body);

		return socket.disconnect(true);

	}

	const { tid, username } = await response.json();

	const player = createPlayer(socket.id, tid, username);

	data.players[player.id] = player;

	setPlayerStatus(socket, true);

	updateState();

	return player;
}

function setPlayerStatus(socket, status) {
	const { cookie: cookieHeader } = socket.handshake.headers
	const cookies = cookie.parse(cookieHeader);

	const options = {
		method: 'GET',
		headers: {
			'Authorization': `Token ${cookies.authToken}`,
			'Content-Type': 'application/json',
			'Cookie': cookieHeader
		},
	};

	fetch(`http://django:8000/api/user/status/?status=${status}`, options);
}

io.on('connection', async socket => {

	socket.on('initial', async () => {
		const player = await initConnection(socket);

		socket.emit('state', { id: ++stateId, userId: player.id, data });
	});

	socket.on('room.create', options => {
		const player = getPlayerFromSocket(socket);

		const currentRoom = getRoomFromPlayer(player);

		removePlayerFromRoom(player, currentRoom);

		const room = createRoom(player, options);

		data.rooms[room.id] = room;
		player.state = 1;
		player.roomId = room.id;

		updateState();
	});

	socket.on('room.join', options => {
		const { id } = options;
		const player = getPlayerFromSocket(socket);

		if (player == null)
			return;

		const room = data.rooms[id];

		if (room == null)
			return socket.emit('notice', { type: 'error', title: 'Can not join room', message: `Room with id ${id} does not exist.` });

		if (player.roomId === room.id)
			return;

		const { status, players, playersMax } = room;

		if (status !== 0)
			return socket.emit('notice', { type: 'error', title: 'Can not join room', message: `Room already started.` });

		if (players.length === playersMax)
			return socket.emit('notice', { type: 'error', title: 'Can not join room', message: `Room is full.` });

		const currentRoom = getRoomFromPlayer(player);

		removePlayerFromRoom(player, currentRoom);

		player.state = 1;
		player.roomId = room.id;
		room.players.push(player.id);

		updateState();
	});

	socket.on('room.join.quick', () => {
		const player = getPlayerFromSocket(socket);

		if (player == null || player.state !== 0)
			return;

		const availableRooms = Object.values(data.rooms).filter(room => room.status === 0 && room.players.length < room.playersMax);

		if (availableRooms.length === 0)
			return socket.emit('notice', { type: 'error', title: 'Can not join room', message: `No available rooms.` });

		availableRooms.sort((a, b) => b.players.length - a.players.length);

		const room = availableRooms[0];

		player.state = 1;
		player.roomId = room.id;
		room.players.push(player.id);

		updateState();
	});

	socket.on('room.leave', () => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if (room == null)
			return;

		removePlayerFromRoom(player, room);

		player.state = 0;

		updateState();
	});

	socket.on('player.ready', () => {
		const player = getPlayerFromSocket(socket);

		if (player.state !== 1)
			return;
		if (player.roomId == null)
			return;

		player.ready = !player.ready;

		updateState();
	});

	socket.on('game.start', () => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if (room == null)
			return;
		if (player.id !== room.masterId)
			return;
		if (player.state !== 1)
			return;

		const players = getPlayersFromRoom(room);

		const activePlayers = players.slice(0, 4);

		if (activePlayers.length < 2)
			return socket.emit('notice', { type: 'error', title: 'Can not start game', message: `Not enough players.` });

		const otherPlayers = players.filter(player => player.id !== room.masterId);
		const allReady = otherPlayers.every(player => player.ready);

		if (!allReady)
			return socket.emit('notice', { type: 'error', title: 'Can not start game', message: `Not all players are ready.` });

		const activePlayerIds = activePlayers.map(player => player.id);

		room.status = 1;
		room.activePlayers = activePlayerIds;

		players.forEach(player => player.state = 2);

		const game = new ServerTick(room, activePlayers, onTick);

		games[room.id] = game;

		// if(room.type === 1)


		setTimeout(() => {

			game.startGame(io);
			room.startTime = new Date().toISOString();

			setTimeout(() => {
				room.status = 2;
				room.running = true;

				updateState();
			}, 3000);

		}, 1000);

		updateState();
	});

	socket.on('game.tick', (tickClient) => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if (room == null)
			return;

		const tick = games[room.id];

		if (tickClient == null)
			return socket.emit('game.tick', 'set', tick.getTick());

		const difference = tick.calculateOffsetDelta(tickClient);

		if (difference === 0)
			return;

		socket.emit('game.tick', 'adjust', difference);
	});

	socket.on('player.event', event => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if (room == null)
			return;

		const tick = games[room.id];

		if (tick.canQueueEvent(event))
			return tick.queueEvent(player, event);

		const [eventId] = event;

		socket.emit('packet.dropped', eventId);

		console.log('dropped packet from', player.name, event);
	});

	socket.on('disconnect', () => {
		const player = getPlayerFromSocket(socket);

		if (player == null)
			return;

		setPlayerStatus(socket, false);

		const room = getRoomFromPlayer(player);

		removePlayerFromRoom(player, room);

		delete data.players[player.id];

		updateState();
	});

	console.log('user connected', socket.handshake.address);
});
