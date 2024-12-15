import React, {useState} from 'react'
import RoomList from '../RoomList/RoomList'
import Room from '../Room/Room'
import cls from '../../utils/cls'
import scss from './Lobby.module.scss'

function Lobby() {
  return (
    <div className={scss.lobby}>
      <RoomList />
      <Room />
    </div>
  )
}


// const roomListLabels = ["Id", "Name", "Type", "Status", "Players"];



// function Lobby() {
//   const [selectedRoomId, setSelectedRoomId] = useState(null);

// 	const {getPlayer, getRoomList, getPlayerList, joinRoom} = useDataContext();
// 	const roomList = getRoomList();
// 	const currentPlayer = getPlayer();

//   const onClick = (roomId) => {
//     setSelectedRoomId(roomId);
//   };

//   const onDoubleClick = (roomId) => {
//     joinRoom(roomId);
//   };

//   const isSelected = (room) => {
//     return room.id === selectedRoomId;
//   };

//   return (
//     <div className={scss.lobby}>
//       <h2>Available Rooms</h2>
//       <div className={scss.listContainer}>
//         <List
//           columnNames={roomListLabels}
//           component={RoomListItem}
//           items={roomList}
//           onClick={onClick}
//           onDoubleClick={onDoubleClick}
//           isSelected={isSelected}
//         />
//       </div>
//       <RoomListButtonBar selectedRoomId={selectedRoomId} />
//       <div>
// 				<div>Players</div>
// 				{
// 					getPlayerList().map(player => (
// 						<div key={player.id} className={cls(player.id === currentPlayer.id ? scss.player : null)}>
// 							<span>id({player.id})</span>
// 							<span> | </span>
// 							<span>name({player.name})</span>
// 							<span> | </span>
// 							<span>state({player.state})</span>
// 						</div>
// 					))
// 				}
// 			</div>
//     </div>
//   );
// }

export default Lobby;
