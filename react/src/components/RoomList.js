import React from 'react'
import scss from './RoomList.module.scss'
import cls from '../utils/cls';

const TYPE_LABELS = ['Single', 'Tournament'];
const STATUS_LABELS = ['Waiting', 'Starting', 'In Game', 'Ending'];

function GameRoomListItem(props) {
	const {id, name, type, status, playersCurrent, playersMax} = props;

	const typeLabel = TYPE_LABELS[type];
	const statusLabel = STATUS_LABELS[status];

	const playersCurrentPadded = padPlayerCount(playersCurrent);
	const playersMaxPadded = padPlayerCount(playersMax);

	return (
		<tr className={cls(scss.row, scss.item)}>
			<td>{id}</td>
			<td>{name}</td>
			<td>{typeLabel}</td>
			<td>{statusLabel}</td>
			<td>{playersCurrentPadded}/{playersMaxPadded}</td>
		</tr>
	);
}

function GameRoomList(props) {

	return (
		<table className={cls(scss.list)}>
			<thead>
				<tr className={cls(scss.row, scss.header)}>
					<th>Id</th>
					<th>Name</th>
					<th>Type</th>
					<th>Status</th>
					<th>Players</th>
				</tr>
			</thead>
			<tbody>
				{
					props.list.map(room => <GameRoomListItem {...room} key={room.id} />)
				}
			</tbody>
		</table>
	);
}

// helper functions
function padPlayerCount(count) {
	return `${count}`.padStart(2, '0');
}

export default GameRoomList;