import React, {useEffect, useState, useReducer, useRef} from 'react'
import {Canvas, useFrame} from '@react-three/fiber'
import io from 'socket.io-client'
import Game, {ENUM_SIDE_CLIENT} from '../game'
import GameRoomList from '../components/RoomList'
import GameRoomButtonBar from '../components/RoomListButtonBar'
import CreateRoomModal from '../components/Modal'
import showModal from '../utils/modal'
import cls from '../utils/cls'
import scss from './Page.module.scss'

const SOCKET_SERVER_URL = 'http://localhost:4000';

function Box(props) {
	// This reference will give us direct access to the mesh
	const meshRef = useRef()
	// Set up state for the hovered and active state
	const [hovered, setHover] = useState(false)
	const [active, setActive] = useState(false)
	// Subscribe this component to the render-loop, rotate the mesh every frame
	useFrame((state, delta) => (meshRef.current.rotation.x += delta))
	// Return view, these are regular three.js elements expressed in JSX
	return (
		<mesh
			{...props}
			ref={meshRef}
			scale={active ? 1.5 : 1}
			onClick={(event) => setActive(!active)}
			onPointerOver={(event) => setHover(true)}
			onPointerOut={(event) => setHover(false)}>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
		</mesh>
	)
}

function gameRoomListReducer(state, action) {
	const {type, data} = action;

	switch(type) {
		case 'list':
			return data;
		case 'create':
			return [...state, data];
		case 'update':
			const index = state.findIndex(room => room.id === data.id);
			const room = state[index];
			state[index] = {...room, ...data};
			return state;
		case 'close':
			return state.filter(room => room.id !== data.id);
		default:
			return state;
	}
}

function Page() {

	const [stats, statsUpdate] = useState({});
	const [gameRoomList, gameRoomListDispatch] = useReducer(gameRoomListReducer, []);
	const socketEmitRef = useRef(() => {});

	const send = socketEmitRef.current;

	useEffect(() => {
		const socket = io(SOCKET_SERVER_URL);

		socketEmitRef.current = socket.emit.bind(socket);

        socket.on('connect', () => {
            console.log('Connected to the Socket.IO server');
        });

		socket.on('game.room.list', gameRoomList => gameRoomListDispatch({type: 'list', data: gameRoomList}));
		socket.on('game.room.create', room => gameRoomListDispatch({type: 'create', data: room}));
		socket.on('game.room.update', room => gameRoomListDispatch({type: 'update', data: room}));
		socket.on('game.room.close', room => gameRoomListDispatch({type: 'close', data: room}));

		const game = new Game(ENUM_SIDE_CLIENT, {statsUpdate});


        return () => {
            socket.disconnect();
        };
	}, []);

	const roomCreateCallback = async () => {
		const defaultValues = {
			type: 0,
			playersMax: 2,
		};

		const [action, data] = await showModal(CreateRoomModal, defaultValues);

		if(action !== 'confirm')
			return;

		send('game.room.create', data);
	}

	const buttons = [
		{
			classes: ['button', 'create'],
			label: 'Create Room',
			action: roomCreateCallback,
			enabled: true,
		},
		{
			classes: ['button', 'random'],
			label: 'Quick Join',
			action: () => send('game.room.create', null),
			// action: () => send('game.room.random'),
			enabled: true,
		},
		{
			classes: ['button', 'join'],
			label: 'Join Room',
			action: () => send('game.room.create', null),
			// action: () => send('game.room.join'),
			enabled: false,
		},
	];

	return (
		<>
			{/* <Canvas>
				<ambientLight intensity={Math.PI / 2} />
				<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
				<pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
				<Box position={[-1.2, 0, 0]} />
				<Box position={[1.2, 0, 0]} />
			</Canvas> */}
			<div id="stats">
				<span>tick: {stats.tick}</span>
				<span>fps: {stats.fps?.toFixed(2)}</span>
			</div>
			<div className={cls(scss.ui)}>
				<GameRoomList list={gameRoomList} />
				<GameRoomButtonBar buttons={buttons} />
			</div>
		</>
	);
}

export default Page;