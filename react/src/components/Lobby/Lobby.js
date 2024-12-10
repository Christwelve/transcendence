import React, { useState } from "react";
import List from "../List/List";
import RoomListItem from "../Room/RoomListItem";
import RoomListButtonBar from "../Room/RoomListButtonBar";
import { useDataContext } from "../DataContext/DataContext";
import scss from "./Lobby.module.scss";

const roomListLabels = ["Id", "Name", "Type", "Status", "Players"];

function Lobby() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const { getRoomList, joinRoom } = useDataContext();
  const roomList = getRoomList();

  const onClick = (roomId) => {
    setSelectedRoomId(roomId);
  };

  const onDoubleClick = (roomId) => {
    joinRoom(roomId);
  };

  const isSelected = (room) => {
    return room.id === selectedRoomId;
  };

  return (
    <div className={scss.lobby}>
      <h2>Available Rooms</h2>
      <div className={scss.listContainer}>
        <List
          columnNames={roomListLabels}
          component={RoomListItem}
          items={roomList}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          isSelected={isSelected}
        />
      </div>
      <RoomListButtonBar selectedRoomId={selectedRoomId} />
    </div>
  );
}

export default Lobby;
