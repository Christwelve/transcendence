import React, {createContext, useContext, useState, useReducer, useEffect, useRef} from 'react'
import io from 'socket.io-client'

const SOCKET_SERVER_URL = `http://${window.location.hostname}:4000`;
// const SOCKET_SERVER_URL = `http://192.168.86.218:4000`;


const DataContext = createContext();

let lastInstructions = null;

const useDataContext = () => {
	return useContext(DataContext);
  };

function DataContextProvider(props) {
	const {children} = props;

	const dataDefault = {
		rooms: [],
		players: [],
	};

	const [userId, setUserId] = useState(null);
	const [data, setData] = useReducer(dataReducer, dataDefault);

	const socketRef = useRef(null);
	const send = socketRef.current?.emit?.bind(socketRef.current);

	useEffect(() => {
		const socket = io(SOCKET_SERVER_URL);

		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('Connected to server');
		});

		// const game = new Game(ENUM_SIDE_CLIENT, {statsUpdate});

		socket.on('user.id', id => setUserId(id));
		socket.on('instruction', instructions => setData(instructions));

		return () => {
			socket.disconnect();
		};

	}, []);

	const fns = {
		getPlayer: getPlayer.bind(null, data, userId),
		getRoom: getRoom.bind(null, data),
		getRoomList: getRoomList.bind(null, data),
		getPlayerList: getPlayerList.bind(null, data),
		getPlayerListForRoom: getPlayerListForRoom.bind(null, data),
		createRoom: createRoom.bind(null, send),
		joinRoom: joinRoom.bind(null, send),
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
function dataReducer(state, instructions) {

	if(instructions === lastInstructions)
		return state;

	console.log(instructions);

	const fns = {
		object: applyStateObject,
		array: applyStateArray,
	};

	for(const instruction of instructions) {
		const {type, action, path, value} = instruction;

		if(action === 'overwrite') {
			state = value;
			continue;
		}

		const [entity, property] = getEntity(state, path);

		if(entity == null)
			continue;

		fns[type](entity, property, action, value);
	}

	lastInstructions = instructions;

	return {...state};
}

function applyStateObject(entity, property, action, value) {
	switch(action) {
		case 'set':
			return entity[property] = value;
		case 'unset':
			return delete entity[property];
		default:
			return;
	}
}

function applyStateArray(entity, property, action, value) {
	switch(action) {
		case 'push':
			return entity[property].push(value);
		case 'pop':
			return entity[property].pop();
		case 'splice':
			return entity[property].splice(...value);
		case 'set':
			return entity[property] = value;
		case 'unset':
			return delete entity[property];
		default:
			return;
	}
}

function getEntity(state, path) {
	const parts = path.split('.');
	const last = parts.pop();

	const entity = parts.reduce((result, part) => result == null ? null : result[part], state);

	return [entity, last];
}

// api functions
function getPlayer(data, userId) {
	return data.players[userId];
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
	const room = data.rooms[roomId];

	if(room == null)
		return [];

	const players = room.players.map(playerId => data.players[playerId]);

	return players;
}

function createRoom(send, options) {
	send('room.create', options);
}

function joinRoom(send, roomId) {
	send('room.join', {id: roomId});
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