import React, {useState} from 'react'
import {useDataContext} from '../components/DataContext/DataContext'
import Lobby from '../components/Lobby/Lobby'
import Room from '../components/Room/Room'
import Game from '../components/Game/Game'
import cls from '../utils/cls'
import scss from './Page.module.scss'

function Page() {

	const [stats, statsUpdate] = useState({});
	const {getPlayer} = useDataContext();

	const player = getPlayer();

	if(player == null)
		return (<div>nix da</div>);

	const screens = [
		<Lobby />,
		<Lobby />,
		// <Room />,
		<Game />,
	];

	const screen = screens[player.state];

	return (
		<>
			{/* <div id="stats">
				<span>tick: {stats.tick}</span>
				<span>fps: {stats.fps?.toFixed(2)}</span>
			</div> */}
			<div className={cls(scss.ui)}>
				{screen}
				{/* <Game /> */}
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