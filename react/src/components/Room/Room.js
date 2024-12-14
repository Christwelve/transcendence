import React from 'react'
import PlayerList from './PlayerList'
import {useDataContext} from '../DataContext/DataContext'
import cls from '../../utils/cls'
import scss from './Room.module.scss'

function Room() {

	const {getPlayer, getRoom, getPlayerListForRoom, leaveRoom, toggleReady, gameStart} = useDataContext();
	const currentPlayer = getPlayer();
	const room = getRoom(currentPlayer.roomId);

	if(room == null)
		return null;

	const playerList = getPlayerListForRoom(room.id);

	const isMaster = currentPlayer.id === room.masterId;
	const canStart = playerList.filter(player => player.id !== room.masterId).every(player => player.ready);

	const readyButton = (<button className={cls(scss.primary, scss.ready, currentPlayer.ready && scss.highlight)} onClick={toggleReady}>Ready</button>);
	const startButton = (<button className={cls(scss.primary, scss.start, canStart && scss.highlight)} disabled={!canStart} onClick={gameStart}>Start</button>);

	return (
		<div className={scss.room}>
			<div className={scss.header}>
				<div className={scss.title}>
					<h2>{room.name}</h2>
				</div>
			</div>
			<div className={scss.body}>
				<div className={scss.players}>
					<PlayerList players={playerList} currentPlayer={currentPlayer} masterId={room.masterId} />
				</div>
				<div className={scss.controls}>
					<button onClick={leaveRoom}>Leave</button>
					{isMaster ? startButton : readyButton}
				</div>
			</div>
		</div>
	)
}


export default Room;