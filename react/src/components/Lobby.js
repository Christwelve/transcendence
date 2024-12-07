import React, {useState} from 'react'
import List from './List'
import RoomListItem from './RoomListItem'
import RoomListButtonBar from './RoomListButtonBar'
import {useDataContext} from './DataContext'
import cls from '../utils/cls'
import scss from './Lobby.module.scss'

const roomListLabels = ['Id', 'Name', 'Type', 'Status', 'Players'];

function Lobby() {

	const [selectedRoomId, setSelectedRoomId] = useState(null);

	const {getPlayer, getRoomList, getPlayerList, joinRoom} = useDataContext();
	const roomList = getRoomList();
	const currentPlayer = getPlayer();


	const onClick = roomId => {
		setSelectedRoomId(roomId);
	}

	const onDoubleClick = roomId => {
		joinRoom(roomId)
	}

	const isSelected = room => {
		return room.id === selectedRoomId;
	}

	return (
		<div className={scss.lobby}>
			<List columnNames={roomListLabels} component={RoomListItem} items={roomList} onClick={onClick} onDoubleClick={onDoubleClick} isSelected={isSelected} />
			<RoomListButtonBar selectedRoomId={selectedRoomId} />
			<div>
				<div>Players</div>
				{
					getPlayerList().map(player => (
						<div key={player.id} className={cls(player.id === currentPlayer.id ? scss.player : null)}>
							<span>{player.id}</span>
							<span> | </span>
							<span>{player.name}</span>
						</div>
					))
				}
			</div>
		</div>
	)
}

export default Lobby;