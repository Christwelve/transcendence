import React from 'react'
import RoomListItem from './RoomListItem'
import {useDataContext} from '../DataContext/DataContext'
import scss from './RoomList.module.scss'

function RoomList() {
	const {getPlayer, getRoomList, joinRoom} = useDataContext();

	const player = getPlayer();
	const rooms = getRoomList();

	return (
		<div className={scss.list}>
			{
				rooms.map(room => <RoomListItem key={room.id} {...room} selected={player.roomId === room.id} onClick={joinRoom.bind(null, room.id)} />)
			}
		</div>
	);
}

export default RoomList;