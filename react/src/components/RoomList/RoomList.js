import React, {useEffect} from 'react'
import {useDataContext} from '../DataContext/DataContext'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import RoomListItem from './RoomListItem'
import Icon from '../Icon/Icon'
import RoomCreateModal from '../Modal/RoomCreateModal'
import {showModal} from '../../utils/modal'
import scss from './RoomList.module.scss'

function RoomList() {
	const {getPlayer, getRoomList, createRoom, joinRoom, quickJoinRoom} = useDataContext();

	const player = getPlayer();
	const rooms = getRoomList();

	// const availableRooms = rooms.filter(room => room.status === 0 && room.players.length < room.playersMax);
	// const unavailableRooms = rooms.filter(room => room.status !== 0 || room.players.length >= room.playersMax);

	useEffect(() => {
		const onKeydown = event => {
			const {code} = event;

			if(code !== 'KeyQ')
				return;

			quickJoinRoom();
		};

		window.addEventListener('keydown', onKeydown);

		return () => {
			window.removeEventListener('keydown', onKeydown);
		}
	}, []);

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
		<Card title='Rooms' classes={scss.list} action={titleAction}>
			<CardSection title='Available'>
				{
					rooms.length === 0 ?
						<div className={scss.empty}>No available rooms.</div> :
						rooms.map(room => <RoomListItem key={room.id} {...room} selected={player.roomId === room.id} onClick={joinRoom.bind(null, room.id)} />)
				}
			</CardSection>
		</Card>

	);
}

export default RoomList;