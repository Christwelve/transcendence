import React from 'react'
import { useDataContext } from '../context/DataContext'
import Header from '../components/Header/Header'
import Lobby from '../components/Lobby/Lobby'
import Game from '../components/Game/Game'

function Content(props) {
	const { player } = props;

	if (player == null)
		return null;

	return player.state === 2 ? <Game /> : <Lobby />;
}

function Page(props) {
	const { changeStatus, avatar, setAvatar, username, setUsername } = props;
	const { getPlayer } = useDataContext();
	const player = getPlayer();

	return (
		<>
			<Header changeStatus={changeStatus} avatar={avatar} setAvatar={setAvatar} username={username} setUsername={setUsername} />
			<Content player={player} />
		</>
	);
}

export default Page;
