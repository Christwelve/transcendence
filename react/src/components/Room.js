import React, {useState} from 'react'
import List from './List'
import PlayerListItem from './PlayerListItem'
import {useDataContext} from './DataContext'
import scss from './Room.module.scss'

const playerListLabels = ['Name', 'Status'];

function Room() {

	const {getPlayer, getPlayerListForRoom, leaveRoom, toggleReady} = useDataContext();
	const player = getPlayer();
	const playerList = getPlayerListForRoom(player.roomId);

	return (
		<div className={scss.room}>
			<List columnNames={playerListLabels} component={PlayerListItem} items={playerList} />
			<button onClick={leaveRoom}>Leave</button>
			<button onClick={toggleReady}>Ready</button>
		</div>
	)
}

export default Room;