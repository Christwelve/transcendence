import React, { useEffect, useState, useReducer, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import Game, { ENUM_SIDE_CLIENT } from '../game'
import { useDataContext } from '../components/DataContext/DataContext'
import List from '../components/List/List'
import Lobby from '../components/Lobby/Lobby'
import Room from '../components/Room/Room'
import PlayerListItem from '../components/PlayerListItem/PlayerListItem'
import ENUM from '../data/enum'
import cls from '../utils/cls'
import scss from './Page.module.scss'


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

function Page() {

	const [stats, statsUpdate] = useState({});
	const { getPlayer } = useDataContext();

	const player = getPlayer();

	if (player == null)
		return (<div>nix da</div>);

	const screens = [
		<Lobby />,
		<Room />,
	];

	const screen = screens[player.state];

	return (
		<>
			{/* <Canvas>
				<ambientLight intensity={Math.PI / 2} />
				<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
				<pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
				<Box position={[-1.2, 0, 0]} />
				<Box position={[1.2, 0, 0]} />
			</Canvas> */}
			{/* <div id="stats">
				<span>tick: {stats.tick}</span>
				<span>fps: {stats.fps?.toFixed(2)}</span>
			</div> */}
			<div className={cls(scss.ui)}>
				{screen}
			</div>
		</>
	);
}

// helper function
// function getScreen(state) {
// 	switch(state) {
// 		case ENUM.STATE.LOBBY:
// 			return getStateScreenLobby();
// 		case ENUM.STATE.ROOM:
// 			return getStateScreenRoom();
// 		case ENUM.STATE.INGAME:
// 			return getStateScreenIngame();
// 		default:
// 			return null;
// 	}
// }

export default Page;