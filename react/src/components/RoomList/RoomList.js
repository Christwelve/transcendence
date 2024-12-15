import React from 'react'
import {useDataContext} from '../DataContext/DataContext'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import RoomListItem from './RoomListItem'
import Icon from '../Icon/Icon'
import RoomCreateModal from '../Modal/RoomCreateModal'
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

	const titleAction = (
		<div className={scss.create} onClick={createRoomButtonCallback}>
			<Icon type='plus' size='18' />
		</div>
	);

	return (
		<Card title='Rooms' action={titleAction}>
			<CardSection title='Available'>
				{
					rooms.map(room => <RoomListItem key={room.id} {...room} selected={player.roomId === room.id} onClick={joinRoom.bind(null, room.id)} />)
				}
			</CardSection>
		</Card>
	);
}

export default RoomList;