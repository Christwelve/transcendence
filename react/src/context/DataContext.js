import React, { createContext, useContext, useState, useReducer, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { showToast } from '../components/Toast/ToastPresenter'


// console.log("REACT_APP_SOCKET_SERVER_URL: ", process.env.REACT_APP_SOCKET_SERVER_URL);


const DataContext = createContext();

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

	const [data, setData] = useState(dataDefault);
	const [initialized, setInitialized] = useState(false);

	const socketRef = useRef(null);
	const send = socketRef.current?.emit?.bind(socketRef.current);

	const dataRef = useRef(null);
	dataRef.current = data;

	const initializedRef = useRef(null);
	initializedRef.current = initialized;

	useEffect(() => {
		const socket = io(process.env.REACT_APP_SOCKET_SERVER_URL, {
			withCredentials: true,
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('Connected to server');

			socket.emit('initial');
		});

		socket.on('reconnect', () => {
			socket.emit('initial');
		});

		socket.on('disconnect', () => {
			console.log('Disconnected');
		});

		socket.on('state', payload => {
			const { id, userId, data: incomingData } = payload;

			const data = dataRef.current;

			if (id <= data.lastId)
				return;

			const newData = { ...data, lastId: id, userId: data.userId || userId, ...incomingData };

			setData(newData);

			if (!initializedRef.current)
				setInitialized(true);
		});

		socket.on('instruction', instructions => setData(instructions));

		socket.on('notice', showToast);

		socket.on('pushstate', roomId => {
			window.history.pushState({ room: roomId }, '', roomId == null ? '/' : `/room/${roomId}`);
		});

		const onPopState = event => {
			const { state } = event;

			const room = state?.room;

			if (room == null)
				return socket.emit('room.leave');

			enterInitialRoom(socket, dataRef.current);
		};

		window.addEventListener('popstate', onPopState);

		return () => {
			socket.disconnect(true);
			window.removeEventListener('popstate', onPopState);
		};

	}, []);

	useEffect(() => {
		if (initialized)
			enterInitialRoom(socketRef.current, dataRef.current);
	}, [initialized]);

	const fns = {
		getStateId: getStateId.bind(null, data),
		getPlayer: getPlayer.bind(null, data),
		getPlayerById: getPlayerById.bind(null, data),
		getRoom: getRoom.bind(null, data),
		getRoomList: getRoomList.bind(null, data),
		getPlayerList: getPlayerList.bind(null, data),
		getPlayerListForRoom: getPlayerListForRoom.bind(null, data),
		getTournament: getTournament.bind(null, data),
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

// helper functions
function enterInitialRoom(socket, data) {
	const [_, room, id] = window.location.pathname.split('/');

	if (room !== 'room' || id == null)
		return;

	if (data.userId == null)
		return;

	const player = data.players[data.userId];

	if (player == null)
		return;

	if (player.roomId === id)
		return;

	socket.emit('room.join', id);
}

// api functions
function getStateId(data) {
	return data.lastId;
}

function getPlayer(data) {
	const { userId, players } = data;

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
	if (roomId == null)
		return [];

	const room = data.rooms[roomId];

	if (room == null)
		return [];

	return room.players.map(playerId => data.players[playerId]);
}

function getTournament(data) {
	const playerId = data.userId;
	const player = data.players[playerId];
	const tournament = data.tournaments[player?.roomId];

	return tournament;
}

function createRoom(send, options) {
	send('room.create', options);
}

function joinRoom(send, roomId, record = false) {
	send('room.join', roomId, record);
}

function quickJoinRoom(send) {
	send('room.join.quick');
}

function leaveRoom(send, record = false) {
	send('room.leave', record);
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