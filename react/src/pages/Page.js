import React, {useState} from 'react'
import {useDataContext} from '../components/DataContext/DataContext'
import Header from '../components/Header/Header'
import Lobby from '../components/Lobby/Lobby'
import Game from '../components/Game/Game'

function Content(props) {
	const {player} = props;

	if(player == null)
		return null;

	return player.state === 2 ? <Game /> : <Lobby />;
}

function Page(props) {
	const {changeStatus, avatar} = props;
	const {getPlayer} = useDataContext();
	const player = getPlayer();

	return (
		<>
			<Header changeStatus={changeStatus} avatar={avatar} />
			<Content player={player} />
		</>
	);
}

export default Page;