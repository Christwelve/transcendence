import React from 'react'
import RoomListItem from './RoomListItem'
import {useDataContext} from '../DataContext/DataContext'
import scss from './RoomList.module.scss'

function RoomList() {
	const {getPlayer, getRoomList, joinRoom} = useDataContext();

	const player = getPlayer();
	const rooms = getRoomList();

	return (
		<div className={scss.rooms}>
			<div className={scss.header}>
				<h2 className={scss.title}>Rooms</h2>
				<p className={scss.description}>Click on a room to join it.</p>
			</div>
			<div className={scss.list}>
				{
					rooms.map(room => <RoomListItem key={room.id} {...room} selected={player.roomId === room.id} onClick={joinRoom.bind(null, room.id)} />)
				}
			</div>
		</div>
	);
}

export default RoomList;