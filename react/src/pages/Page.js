import React, {useState} from 'react'
import {useDataContext} from '../components/DataContext/DataContext'
import Lobby from '../components/Lobby/Lobby'
import Game from '../components/Game/Game'
import cls from '../utils/cls'
import scss from './Page.module.scss'

function Page() {

	const [stats, statsUpdate] = useState({});
	const {getPlayer} = useDataContext();

	const player = getPlayer();

	if(player == null)
		return (<div>nix da</div>);

	const playerState = player.state;

	if(playerState === 2)
		return <Game />;

	return <Lobby />;
}

export default Page;