import React from 'react'
import { useDataContext } from '.../context/DataContext'
import RoomCreateModal from '../Modal/Modal'
import { showModal } from '../../utils/modal'
import cls from '../../utils/cls'
import scss from './RoomListButtonBar.module.scss'

function RoomListButton(props) {
	const { classes, label, action, disabled = false } = props;

	const className = cls(...classes.map(cls => scss[cls]));

	return (
		<button className={className} onClick={action} disabled={disabled}>{label}</button>
	);
}

function RoomListButtonBar(props) {
	const { selectedRoomId } = props;

	const { createRoom, joinRoom } = useDataContext();


	const createRoomButtonCallback = async () => {
		const defaultValues = {
			type: 0,
			playersMax: 2,
		};

		const [action, data] = await showModal(RoomCreateModal, defaultValues);

		if (action !== 'confirm')
			return;

		createRoom(data);
	}

	const buttons = [
		{
			classes: ['button', 'create'],
			label: 'Create Room',
			action: createRoomButtonCallback,
		},
		{
			classes: ['button', 'random'],
			label: 'Quick Join',
			// action: () => send('game.room.random'),
		},
		{
			classes: ['button', 'join'],
			label: 'Join Room',
			action: joinRoom.bind(null, selectedRoomId),
			disabled: selectedRoomId == null,
		},
	];

	return (
		<div className={cls(scss.bar)}>
			{
				buttons.map(button => <RoomListButton {...button} key={button.label} />)
			}
		</div>
	);
}

export default RoomListButtonBar;