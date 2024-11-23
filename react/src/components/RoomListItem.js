import React from 'react'

const TYPE_LABELS = ['Single', 'Tournament'];
const STATUS_LABELS = ['Waiting', 'Starting', 'In Game', 'Ending'];

function RoomListItem(props) {
	const {id, name, type, status, players, playersMax, baseClasses, onClick, onDoubleClick} = props;

	const typeLabel = TYPE_LABELS[type];
	const statusLabel = STATUS_LABELS[status];

	const playersCurrentPadded = padPlayerCount(players.length);
	const playersMaxPadded = padPlayerCount(playersMax);

	return (
		<tr className={baseClasses} onClick={onClick.bind(null, id)} onDoubleClick={onDoubleClick.bind(null, id)}>
			<td>{id}</td>
			<td>{name}</td>
			<td>{typeLabel}</td>
			<td>{statusLabel}</td>
			<td>{playersCurrentPadded}/{playersMaxPadded}</td>
		</tr>
	);
}

// helper functions
function padPlayerCount(count) {
	return `${count}`.padStart(2, '0');
}

export default RoomListItem;