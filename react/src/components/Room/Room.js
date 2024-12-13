import React from 'react'
import List from '../List/List'
import PlayerListItem from '../PlayerListItem/PlayerListItem'
import {useDataContext} from '../DataContext/DataContext'
import cls from '../../utils/cls'
import scss from './Room.module.scss'

const playerListLabels = ['Name', 'Status'];

function Room() {

	const {getPlayer, getRoom, getPlayerListForRoom, leaveRoom, toggleReady, gameStart} = useDataContext();
	const currentPlayer = getPlayer();
	const room = getRoom(currentPlayer.roomId);

	const playerList = getPlayerListForRoom(room.id);

	const isMaster = room.masterId === currentPlayer.id;
	const canStart = playerList.filter(player => player.id !== currentPlayer.id).every(player => player.ready);

	const rowClasses = player => {
		const isPlayer = player.id === currentPlayer.id;
		const isMaster = room.masterId === player.id;

		return cls(isPlayer && scss.player, isMaster && scss.master);
	};

	return (
		<div className={scss.room}>
			<List columnNames={playerListLabels} component={PlayerListItem} items={playerList} rowClasses={rowClasses} />
			<button onClick={leaveRoom}>Leave</button>
			{
				isMaster ?
					<button disabled={!canStart} onClick={gameStart}>Start</button>
				:
					<button onClick={toggleReady}>Ready</button>
			}
		</div>
	)
}

export default Room;