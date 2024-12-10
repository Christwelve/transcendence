import React from "react";
import List from "../List/List";
import PlayerListItem from "../PlayerListItem/PlayerListItem";
import { useDataContext } from "../DataContext/DataContext";
import scss from "./Room.module.scss";

const playerListHeaders = ["Name", "Status"];

function Room() {
  const { getPlayer, getPlayerListForRoom, leaveRoom, toggleReady } = useDataContext();
  const player = getPlayer();
  const playerList = player ? getPlayerListForRoom(player.roomId) : [];

  return (
    <div className={scss.room}>
      <h2>Room Details</h2>
      <div className={scss.listContainer}>
        <List columnNames={playerListHeaders} component={PlayerListItem} items={playerList} />
      </div>
      <div className={scss.buttonBar}>
        <button onClick={leaveRoom}>Leave</button>
        <button onClick={toggleReady}>Ready</button>
      </div>
    </div>
  );
}

export default Room;
