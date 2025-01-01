import http from 'http'
import express from 'express'
import cookie from 'cookie'
import { Server as WebSocketServer } from 'socket.io'
import { ServerTick } from 'shared/tick'

const app = express();
const server = http.createServer(app);

const io = new WebSocketServer(server, {
	serveClient: false,
	cors: {
		origin: 'http://localhost:3000',
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
};

const statistics = {};

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

// async function postMatch(matchData) {
// 	try {
// 		const response = await fetch('http://django:8000/api/matches/', {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json',
// 			},
// 			body: JSON.stringify(matchData),
// 		});

// 		if (!response.ok) {
// 			throw new Error('Failed to post match data');
// 		}

// 		const data = await response.json();
// 		console.log('Posted match data:', data);
// 		return data.id;
// 	} catch (error) {
// 		console.error('Error posting match data:', error);
// 	}
// }

// async function postStatistic(statisticData) {
// 	try {

// 		const response = await fetch('http://django:8000/api/statistics/', {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json',
// 			},
// 			body: JSON.stringify(statisticData),
// 		});

// 		if (!response.ok) {
// 			throw new Error('Failed to post statistics');
// 		}

// 		const data = await response.json();
// 		console.log('Posted statistics data:', data);
// 		return data;
// 	} catch (error) {
// 		console.error('Error posting statistics data:', error);
// 	}
// }

server.listen(port, () => {
	console.log(`Nodejs listening at http://localhost:${port}`);
});

function getPlayerFromSocket(socket) {
	return data.players[socket.id];
}

function getRoomFromPlayer(player) {
	if(player == null)
		return null;

	return data.rooms[player.roomId];
}

function getPlayersFromRoom(room) {
	return room.players.map(playerId => data.players[playerId]);
}

function removePlayerFromRoom(player, room) {
	if (room == null)
		return;

	const { id, players, masterId, type } = room;

	const playerIndex = players.findIndex(playerId => playerId === player.id);
	players.splice(playerIndex, 1);

	const activePlayerIndex = room.activePlayers.indexOf(player.id);

	if (activePlayerIndex !== -1)
		room.activePlayers[activePlayerIndex] = null;

	if (players.length > 0 && player.id === masterId) {
		const newMasterId = players[0];

		data.players[newMasterId].ready = false;

		room.masterId = newMasterId;

		updateState();
	}

	if(games[id] != null)
		createScoreData(room, player);

	if (type === 0)
		removeFromSingle(room);
	else
		removeFromTournament(room);

	player.roomId = null;
	player.ready = false;
	player.index = -1;

	updateState();
}

function removeFromSingle(room) {
	const {id, players} = room;

	if(players.length === 1 && games[id] != null) {
		endSingleGame(room, room.counter, true);

		room.counter++;

		updateState();
	}

	if (players.length === 0) {

		delete data.rooms[id];

		updateState();
	}
}

function removeFromTournament(room) {
	if(room.status === 0)
		return;

	createScoresForPlayers(room);
	finishedMatchData(room, true);

	const {id} = room;

	room.status = 0;
	room.counter++;

	endRoom(room);
	resetRoom(room);

	games[id]?.detach();

	delete games[id];
	delete data.tournaments[id];

	updateState();

}

function createStatistic(room) {
	const { id, type } = room;

	const data = {
		type,
		matchIndex: -1,
		matchIndexFinished: -1,
		matches: [],
	};

	statistics[id] = data;
}

function createMatchData(room) {
	const { id } = room;
	const datetimeStart = new Date().toISOString();

	const matchData = {
		db: {
			datetimeStart,
			datetimeEnd: null,
			tournamentId: null,
			prematureEnd: false,
		},
		scores: [],
	};

	const matchIndex = ++statistics[id].matchIndex;

	statistics[id].matches[matchIndex] = matchData;
}

function finishedMatchData(room, prematureEnd = false) {
	const { id } = room;
	const {matchIndex, matchIndexFinished, matches} = statistics[id];

	if(matchIndex === -1 || matchIndexFinished === matchIndex)
		return;

	console.log('stats', statistics);

	const match = matches[matchIndex];

	match.db.datetimeEnd = new Date().toISOString();
	match.db.prematureEnd = prematureEnd;
	statistics[id].matchIndexFinished = matchIndex;
}

function createScoreData(room, player) {
	const { id, scores } = room;
	const {matchIndex, matchIndexFinished, matches} = statistics[id];

	if(matchIndex === -1 || matchIndexFinished === matchIndex)
		return;

	const {tid, index} = player;

	if(index === -1)
		return;

	const {scored, received} = scores[index];
	const time = new Date().toISOString();

	const scoreData = {
		userId: tid,
		goalsScored: scored,
		goalsReceived: received,
		datetimeLeft: time,
	};

	matches[matchIndex]?.scores?.push(scoreData);
}

function createScoresForPlayers(room) {
	const {id, players} = room;

	if(games[id] == null)
		return;

	players.forEach(id => {
		const player = data.players[id];

		if (player == null)
			return;

		createScoreData(room, player);
	});
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
		counter: 0,
	};

	resetRoom(room);

	return room;
}
// TODO: 60*60
function resetRoom(room) {
	room.scores = [...Array(4)].map(() => ({ scored: 0, received: 0 }));
	room.timer = 60 * 10;
}

function createTournament(room, players) {
	const activePlayers = players.map(player => player.id);

	activePlayers.sort(() => Math.random() - 0.5);

	const tournament = {
		roomId: room.id,
		bracketIndex: 0,
		matchIndex: 0,
		announceNext: false,
		activePlayers: activePlayers,
		brackets: createBrackets(activePlayers),
	};

	return tournament;
}

function createBrackets(players) {
	let count = Math.ceil(players.length / 2);

	const brackets = [];

	while(true) {
		const bracket = createBracket(count);

		brackets.push(bracket);

		if (count === 1)
			break;

		count = Math.ceil(count / 2);
	}

	fillFirstBracket(players, brackets[0]);

	return brackets;
}

function createBracket(count) {
	const bracket = [];

	for (let i = 0; i < count; i++) {
		const match = {
			stage: 0,
			players: [null, null],
			scores: [...Array(2)].map(() => ({ scored: 0, received: 0 })),
		};

		bracket.push(match);
	}

	return bracket;
}

function fillFirstBracket(players, bracket) {
	const count = bracket.length;

	players = [...players];

	for (let i = 0; i < count; i++) {
		const match = bracket[i];
		const player1 = players.shift();
		const player2 = players.shift();

		match.players = [player1, player2];
	}
}

const onTick = tick => {
	const room = tick.getRoom();

	updatePlayers(tick);
	updateBall(tick);

	tick.sendGoalToPlayers(io, updateState, endGame.bind(null, room.counter));

	if (tick.getTick() % 300 === 0)
		updateState();

	if (room.running && room.timer > 0)
		room.timer--;

	if (tick.getTick() % 20 === 0) {
		const roomId = room.id;
		const game = games[roomId];
		game?.sendCollisionToPlayers(io);
	}

	if(room.running && room.timer === 0) {
		room.running = false;

		updateState();
	}
};

function endGame(counter, room) {
	console.log('endGame', counter, room, arguments);
	if(room.type === 0)
		endSingleGame(room, counter);
	else
		endTournamentGame(room, counter);
}

async function endSingleGame(room, counter, immediate = false) {

	createScoresForPlayers(room);
	finishedMatchData(room, immediate);

	room.status = 3;

	updateState();

	if(room.counter !== counter)
		return;

	console.log('before wait');

	if(!immediate)
		await wait(10000);

	console.log('after wait');

	if(room.counter !== counter)
		return;

	endRoom(room);

	games[room.id]?.detach();
	delete games[room.id];

	resetRoom(room);

	updateState();

	console.log('done');
}

async function saveStatistics(room) {
	const {id} = room;

	const stats = statistics[id];

	if(stats == null)
		return;

	delete statistics[id];

	if(stats.matchIndex === -1)
		return;

	try {
		const response = await fetch('http://django:8000/api/statistics/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(stats),
		});

		if (!response.ok)
			throw new Error('Failed to post stats');

		const data = await response.json();
		console.log('Posted stats:', data);
	} catch (error) {
		console.error('Error posting stats:', error);
	}
}

// async function storeMatchData(room) {
// 	const endTime = new Date().toISOString();
// 	// TODO: Adjust Tourmanent Id
// 	const matchData = {
// 		startTime: room.startTime,
// 		endTime: endTime,
// 		tournamentId: null
// 	};

// 	console.log('Sending match data:', matchData);

// 	const matchId = await postMatch(matchData);

// 	if (matchId) {
// 		// STATISTIC DATA
// 		// TODO: handle logged out player (maybe store preliminary stats while game is running)
// 		const statisticData = room.activePlayers.reduce((acc, playerId, i) => {

// 			if (playerId == null)
// 				return acc;

// 			const player = data.players[playerId];
// 			const score = room.scores[i];

// 			const obj = {
// 				userId: player.tid,
// 				goalsScored: score.scored,
// 				goalsReceived: score.received,
// 				datetimeLeft: endTime,
// 				matchId
// 			};

// 			return [...acc, obj];
// 		}, []);

// 		console.log('Sending statistic data:', statisticData);
// 		await postStatistic(statisticData, matchId);
// 	} else {
// 		console.error('Match ID is undefined, cannot post statistics.');
// 	}
// }

async function endTournamentGame(room, counter, leavingPlayerId) {
	if(room.counter !== counter)
		return;

	createScoresForPlayers(room);
	finishedMatchData(room);

	const tournament = data.tournaments[room.id];

	if(tournament == null)
		return;

	if(leavingPlayerId == null)
		await wait(7000);

	if(room.counter !== counter)
		return;

	const match = getCurrentMatch(tournament);

	transferScores(room, match);

	const winner = getWinnerForMatch(match, leavingPlayerId);

	match.winner = winner;

	room.players.forEach(id => {
		const player = data.players[id];

		if (player == null)
			return;

		player.state = 3;
		player.index = -1;
	});

	games[room.id]?.detach();
	delete games[room.id];

	resetRoom(room);

	updateState();

	await wait(2000);

	if(room.counter !== counter)
		return;

	match.stage = 2;

	advancePlayer(tournament, winner);

	updateState();

	if(isTurnamentOver(tournament))
		return endTournament(room, tournament, winner, counter);

	nextMatch(tournament);

	console.log("STARTING NEW GAME")

	startTournamentGame(room, counter);
}

function isTurnamentOver(tournament) {
	const {brackets, bracketIndex, matchIndex} = tournament;

	if(bracketIndex !== brackets.length - 1)
		return false;

	const bracket = brackets[bracketIndex];

	if(matchIndex !== bracket.length - 1)
		return false;

	return true;
}

function advancePlayer(tournament, playerId) {
	const {bracketIndex, matchIndex, brackets} = tournament;

	const nextBracketIndex = bracketIndex + 1;
	const nextMatchIndex = Math.floor(matchIndex / 2);
	const nextPlayerIndex = matchIndex % 2;

	if(nextBracketIndex === brackets.length)
		return;

	const bracket = brackets[nextBracketIndex];
	const match = bracket[nextMatchIndex];

	match.players[nextPlayerIndex] = playerId;
}

async function endTournament(room, tournament, winner, counter) {

	if(room.counter !== counter)
		return;

	await wait(1000);

	if(room.counter !== counter)
		return;

	room.status = 3;
	tournament.winner = winner;

	updateState();

	await wait(10000);

	if(room.counter !== counter)
		return;

	endRoom(room);

	delete data.tournaments[room.id];

	updateState();
}

function endRoom(room) {

	saveStatistics(room);
	console.log('Ending room', JSON.stringify(statistics[room.id], null, 4));

	room.status = 0;
	room.players.forEach(id => {
		const player = data.players[id];

		if (player == null)
			return;

		player.state = 1;
		player.index = -1;
		player.ready = false;
	});
}

function transferScores(room, match) {
	const { players, scores } = match;

	players.forEach((playerId, i) => {
		const playerIndex = room.activePlayers.indexOf(playerId);

		if(playerIndex === -1)
			return;

		scores[i] = room.scores[playerIndex]
	});
}

function getWinnerForMatch(match, leavingPlayerId) {
	const index = getWinnerIndex(match, leavingPlayerId);

	return match.players[index];
}

function getWinnerIndex(match, leavingPlayerId) {
	if (leavingPlayerId != null)
		return +!match.players.indexOf(leavingPlayerId);

	const [{scored: score1}, {scored: score2}] = match.scores;

	if(score1 === score2)
		return Math.floor(Math.random() * 2);

	if (score1 > score2)
		return 0;

	return 1;
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
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

	if(entries.length === 0)
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
	try {
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

			throw new Error('Failed to verify user');
		}

		const { tid, username } = await response.json();

		const player = createPlayer(socket.id, tid, username);

		data.players[player.id] = player;

		setPlayerStatus(socket, true);

		updateState();

		return player;
	} catch (error) {
		console.error('Failed to verify user:', error);
	}

	return null;
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

function startSingleGame(room, players, counter) {
	const activePlayers = players.slice(0, 4).sort(() => Math.random() - 0.5);

	startRoom(room, players, activePlayers, counter);
}

function startTournament(room, players, counter) {
	const tournament = createTournament(room, players);

	data.tournaments[room.id] = tournament;

	room.status = 2;
	players.forEach(player => player.state = 3);

	updateState();

	startTournamentGame(room, counter);
}

async function startTournamentGame(room, counter) {
	if(room.counter !== counter)
		return;

	const tournament = data.tournaments[room.id];

	await wait(3000);

	if(room.counter !== counter)
		return;

	startMatch(tournament);

	const match = getCurrentMatch(tournament);
	const onlyOnePlayer = match.players[1] == null;

	console.log('tournament', tournament);
	console.log('match'	, match);
	console.log('onlyOnePlayer', onlyOnePlayer);

	if(onlyOnePlayer) {
		const player = match.players[0];

		console.log('player', player);

		match.stage = 2;
		match.winner = player;

		advancePlayer(tournament, player);

		nextMatch(tournament);
		startMatch(tournament);

		updateState();
	}

	tournament.announceNext = true;

	updateState();

	await wait(5000);

	if(room.counter !== counter)
		return;

	tournament.announceNext = false;

	const players = getPlayersFromRoom(room);
	const activePlayers = getActiveTourmanentPlayers(tournament);

	startRoom(room, players, activePlayers, counter);
}

function getActiveTourmanentPlayers(tournament) {
	const {brackets, bracketIndex, matchIndex} = tournament;

	const bracket = brackets[bracketIndex];
	const match = bracket[matchIndex];

	const players = match.players.map(playerId => data.players[playerId]);

	return players;
}

function startMatch(tournament) {
	const match = getCurrentMatch(tournament);

	match.stage = 1;
}

function nextMatch(tournament) {
	const {bracketIndex, matchIndex, brackets} = tournament;
	const bracket = brackets[bracketIndex];

	if(matchIndex === bracket.length - 1) {
		tournament.bracketIndex++;
		tournament.matchIndex = 0;
	} else
		tournament.matchIndex++;
}

function getCurrentMatch(tournament) {
	if(tournament == null)
		return {stage: 2};

	const {bracketIndex, matchIndex, brackets} = tournament;
	const bracket = brackets[bracketIndex];

	return bracket[matchIndex];
}

async function startRoom(room, players, activePlayers, counter) {

	if(room.counter !== counter)
		return;

	createMatchData(room);

	const spectators = players.filter(player => !activePlayers.includes(player));

	const game = new ServerTick(room, activePlayers, spectators, onTick);

	games[room.id] = game;

	players.forEach(player => player.state = 2);

	room.activePlayers = activePlayers.map(player => player.id);

	updateState();

	await wait(1000);

	if(room.counter !== counter)
		return;

	game.startGame(io);
	room.startTime = new Date().toISOString();

	updateState();

	await wait(3000);

	if(room.counter !== counter)
		return;

	room.status = 2;
	room.running = true;

	updateState();
}

io.on('connection', async socket => {

	socket.on('initial', async () => {
		const player = await initConnection(socket);

		if (player == null)
			return;

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

		socket.emit('pushstate', room.id);
	});

	socket.on('room.join', (id, record) => {
		const player = getPlayerFromSocket(socket);

		if (player == null)
			return;

		const room = data.rooms[id];

		console.log('room', room);

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

		if(record)
			socket.emit('pushstate', room.id);
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

		socket.emit('pushstate', room.id);
	});

	socket.on('room.leave', record => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if (room == null)
			return;

		removePlayerFromRoom(player, room);

		player.state = 0;

		updateState();

		if(record)
			socket.emit('pushstate', null);
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

		if (players.length < 2)
			return socket.emit('notice', { type: 'error', title: 'Can not start game', message: `Not enough players.` });

		const otherPlayers = players.filter(player => player.id !== room.masterId);
		const allReady = otherPlayers.every(player => player.ready);

		if (!allReady)
			return socket.emit('notice', { type: 'error', title: 'Can not start game', message: `Not all players are ready.` });

		room.counter++;
		room.status = 1;

		updateState();

		createStatistic(room);

		if(room.type === 0)
			startSingleGame(room, players, room.counter);
		else
			startTournament(room, players, room.counter);
	});

	socket.on('game.tick', (tickClient) => {
		const player = getPlayerFromSocket(socket);
		const room = getRoomFromPlayer(player);

		if (room == null)
			return;

		const tick = games[room.id];

		if (tick == null)
			return;

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

		if (tick == null)
			return;

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
