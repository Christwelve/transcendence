import React, { createContext, useContext, useState, useReducer, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import {showToast} from '../Toast/ToastPresenter'

const SOCKET_SERVER_URL = `http://${window.location.hostname}:4000`;


const DataContext = createContext();

let lastInstructions = null;

const useDataContext = () => {
	return useContext(DataContext);
};

function DataContextProvider(props) {
	const { children } = props;

	const dataDefault = {
		lastId: -1,
		userId: null,
		players: {},
		rooms: {},
		tournaments: {},
	};

	// const [data, setData] = useReducer(dataReducer, dataDefault);
	const [data, setData] = useState(dataDefault);

	const socketRef = useRef(null);
	const send = socketRef.current?.emit?.bind(socketRef.current);

	const dataRef = useRef(null);
	dataRef.current = data;

	useEffect(() => {
		const socket = io(SOCKET_SERVER_URL);

		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('Connected to server');
		});

		socket.on('reconnect', () => {
			socket.emit('initial');
		});

		socket.on('state', payload => {
			const {id, userId, data: incomingData} = payload;

			const data = dataRef.current;

			if(id <= data.lastId)
				return;

			const newData = {...data, lastId: id, userId: data.userId ?? userId, ...incomingData};

			setData(newData);
		});

		socket.on('instruction', instructions => setData(instructions));

		socket.on('notice', showToast);

		socket.emit('initial');

		return () => {
			socket.disconnect();
		};

	}, []);

	const fns = {
		getPlayer: getPlayer.bind(null, data),
		getPlayerById: getPlayerById.bind(null, data),
		getRoom: getRoom.bind(null, data),
		getRoomList: getRoomList.bind(null, data),
		getPlayerList: getPlayerList.bind(null, data),
		getPlayerListForRoom: getPlayerListForRoom.bind(null, data),
		getTournamentForRoom: getTournamentForRoom.bind(null, data),
		createRoom: createRoom.bind(null, send),
		joinRoom: joinRoom.bind(null, send),
		quickJoinRoom: quickJoinRoom.bind(null, send),
		leaveRoom: leaveRoom.bind(null, send),
		toggleReady: toggleReady.bind(null, send),
		gameStart: gameStart.bind(null, send),
		sendPlayerEvent: sendPlayerEvent.bind(null, send),
		useListener: useListener.bind(null, socketRef),
		requestServerTick: requestServerTick.bind(null, send),
		requestTickAdjust: requestTickAdjust.bind(null, send),
	};

	return (
		<DataContext.Provider value={fns}>
			{children}
		</DataContext.Provider>
	);
};

// reducer functions
// function dataReducer(state, instructions) {


// 	if(instructions === lastInstructions)
// 		return state;

// 	const fns = {
// 		object: applyStateObject,
// 		array: applyStateArray,
// 	};

// 	console.log('state', state);
// 	console.log('inst', instructions);


// 	let newState = {...state};

// 	for(const instruction of instructions) {
// 		const {type, action, path, value} = instruction;

// 		if(action === 'overwrite') {
// 			newState = {...newState, ...value};
// 			continue;
// 		}

// 		const [entity, property] = getEntity(newState, path);


// 		console.log(entity, property, action, value);

// 		if(entity == null)
// 			continue;


// 		fns[type](entity, property, action, value);
// 	}

// 	lastInstructions = instructions;

// 	console.log('newState', newState);

// 	return {...newState};
// }

// function applyStateObject(entity, property, action, value) {
// 	switch(action) {
// 		case 'set':
// 			return entity[property] = value;
// 		case 'unset':
// 			return delete entity[property];
// 		default:
// 			return;
// 	}
// }

// function applyStateArray(entity, property, action, value) {
// 	switch(action) {
// 		case 'push':
// 			return entity[property].push(value);
// 		case 'pop':
// 			return entity[property].pop();
// 		case 'splice':
// 			return entity[property].splice(...value);
// 		case 'set':
// 			return entity[property] = value;
// 		case 'unset':
// 			return delete entity[property];
// 		default:
// 			return;
// 	}
// }

// function getEntity(state, path) {
// 	const parts = path.split('.');
// 	const last = parts.pop();

// 	const entity = parts.reduce((result, part) => result == null ? null : result[part], state);

// 	return [entity, last];
// }

// api functions
function getPlayer(data) {
	const {userId, players} = data;

	return players[userId] || null;
}

function getPlayerById(data, playerId) {
	return data.players[playerId];
}

function getRoom(data, roomId) {
	return data.rooms[roomId];
}

function getRoomList(data) {
	return Object.values(data.rooms);
}

function getPlayerList(data) {
	return Object.values(data.players);
};

function getPlayerListForRoom(data, roomId) {

	if(roomId == null)
		return [];

	const room = data.rooms[roomId];

	if(room == null)
		return [];

	return room.players.map(playerId => data.players[playerId]);
}

function getTournamentForRoom(data, roomId) {
	const room = data.rooms[roomId];

	if(room == null)
		return null;

	return data.tournaments[room.tournamentId];
}

function createRoom(send, options) {
	send('room.create', options);
}

function joinRoom(send, roomId) {
	send('room.join', { id: roomId });
}

function quickJoinRoom(send) {
	send('room.join.quick');
}

function leaveRoom(send) {
	send('room.leave');
}

function toggleReady(send) {
	send('player.ready');
}

function gameStart(send) {
	send('game.start');
}

function sendPlayerEvent(send, data) {
	send('player.event', data);
}

function useListener(socketRef, name, callback) {
	const socket = socketRef.current;

	useEffect(() => {
		socket.on(name, callback);

		return socket.off.bind(socket, name, callback);
	}, [name, callback]);
}

function requestServerTick(send) {
	send('game.tick');
}

function requestTickAdjust(send, tick) {
	send('game.tick', tick.getTick());
}

export default DataContextProvider;

export {
	useDataContext,
};