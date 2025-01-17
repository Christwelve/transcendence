import React from 'react'
import { useDataContext } from '../context/DataContext'
import Header from '../components/Header/Header'
import Lobby from '../components/Lobby/Lobby'
import Game from '../components/Game/Game'
import Brackets from '../components/Brackets/Brackets'

function Content(props) {
	const {player} = props;

  const {getTournament} = useDataContext();

  const tournament = getTournament();

	if (player == null)
		return null;

	if(player.state === 2)
		return <Game />;
	else if(player.state === 3)
    return <Brackets tournament={tournament} />;

	return <Lobby />;
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
