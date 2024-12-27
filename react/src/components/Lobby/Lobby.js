import React, {useState} from 'react'
import RoomList from '../RoomList/RoomList'
import Room from '../Room/Room'
import Brackets from '../Brackets/Brackets'
import scss from './Lobby.module.scss'

function Lobby() {

  const brackets = [
    [
      {
        stage: 2,
        players: [
          'asdasd',
          'asdaasdsd',
        ],
        winner: 'asdasd',
        scores: [1, 0]
      },
      {
        stage: 0,
        players: [
          'aasdsd',
          'daasdsd',
        ],
        scores: [0, 0]
      },
      {
        stage: 0,
        players: [
          'asdasdw',
          'asdasdr',
        ],
        scores: [0, 0]
      }
    ],
    [
      {
        stage: 0,
        players: [
          'asdasd',
          'asdaasdsd',
        ],
        scores: [1, 0]
      }
    ]
  ]

  return (
    <div className={scss.lobby}>
      <RoomList />
      <Room />
      <Brackets brackets={brackets} />
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
