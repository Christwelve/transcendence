import React from 'react'
import {useDataContext} from '../DataContext/DataContext'
import RoomListItem from './RoomListItem'
import RoomCreateModal from '../Modal/Modal'
import {showModal} from '../../utils/modal'
import scss from './RoomList.module.scss'

function RoomList() {
	const {getPlayer, getRoomList, createRoom, joinRoom} = useDataContext();

	const player = getPlayer();
	const rooms = getRoomList();

	const createRoomButtonCallback = async () => {
		const defaultValues = {
			type: 0,
			playersMax: 2,
			ai: false,
		};

		const [action, data] = await showModal(RoomCreateModal, defaultValues);

		if(action !== 'confirm')
			return;

		createRoom(data);
	}

	return (
		<div className={scss.rooms}>
			<div className={scss.header}>
				<h2 className={scss.title}>Rooms</h2>
				<div className={scss.create} onClick={createRoomButtonCallback}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"/>
						<line x1="5" y1="12" x2="19" y2="12"/>
					</svg>
				</div>
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