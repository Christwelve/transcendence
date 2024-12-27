import React from 'react'
import cls from '../../utils/cls'
import scss from './RoomListItem.module.scss'

const TYPE_LABELS = ['Single', 'Tournament'];
const STATUS_LABELS = ['Waiting', 'Starting', 'In Game', 'Ending'];

function RoomListItem(props) {
	const {id, name, type, status, players, playersMax, selected, onClick} = props;

	const typeLabel = TYPE_LABELS[type];
	const statusLabel = STATUS_LABELS[status];
	const playerCount = players.length;
	const progress = playerCount / playersMax * 100;

	const idPadded = padNumber(id, 3);
	const playersCurrentPadded = padNumber(playerCount, 2);
	const playersMaxPadded = padNumber(playersMax, 2);

	const isFull = playerCount >= playersMax;
	const isStarted = status !== 0;
	const isDisabled = (isFull || isStarted) && !selected;

	return (
		<div className={cls(scss.wrapper)}>
			<div className={cls(scss.room, selected && scss.selected, isDisabled && scss.disabled)} onClick={onClick}>
				<div className={scss.info}>
					<div className={scss.name}>{name}</div>
					<div className={scss.meta}>
						<span>#{idPadded}</span>
						<span>&nbsp;&#183;&nbsp;</span>
						<span>{typeLabel}</span>
						<span>&nbsp;&#183;&nbsp;</span>
						<span>{statusLabel}</span>
					</div>
				</div>
				<div className={scss.players}>
					<div className={scss.count}>
						<span className={scss.current}>{playersCurrentPadded}</span>
						<span className={scss.max}>/{playersMaxPadded}</span>
					</div>
					<div className={scss.progress}>
						<div className={scss.track}></div>
						<div className={scss.value} style={{width: `${progress}%`}}></div>
					</div>
				</div>
			</div>
		</div>
	)

	// return (
	// 	<tr className={baseClasses} onClick={onClick.bind(null, id)} onDoubleClick={onDoubleClick.bind(null, id)}>
	// 		<td>{id}</td>
	// 		<td>{name}</td>
	// 		<td>{typeLabel}</td>
	// 		<td>{statusLabel}</td>
	// 		<td>{playersCurrentPadded}/{playersMaxPadded}</td>
	// 	</tr>
	// );
}

// helper functions
function padNumber(count, padding) {
	return `${count}`.padStart(padding, '0');
}

export default RoomListItem;