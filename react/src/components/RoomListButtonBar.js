import React from 'react'
import cls from '../utils/cls'
import scss from './RoomListButtonBar.module.scss'

function GameRoomButton(props) {
	const {classes, label, action} = props;

	const className = cls(...classes.map(cls => scss[cls]));

	return (
		<button className={className} onClick={action}>{label}</button>
	);
}

function GameRoomButtonBar(props) {
	const {buttons} = props;

	return (
		<div className={cls(scss.bar)}>
			{
				buttons.map(button => <GameRoomButton {...button} key={button.label} />)
			}
		</div>
	);
}

export default GameRoomButtonBar;