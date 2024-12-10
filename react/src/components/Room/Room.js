import React from 'react';
import List from '../List/List';
import PlayerListItem from '../PlayerListItem/PlayerListItem';
import { useDataContext } from '../DataContext/DataContext';
import scss from './Room.module.scss';

const playerListLabels = ['Name', 'Status'];

function Room() {
  const { getPlayer, getPlayerListForRoom, leaveRoom, toggleReady } = useDataContext();
  const player = getPlayer();
  const playerList = getPlayerListForRoom(player.roomId);

  return (
    <div className={scss.room}>
      <h1>Room Details</h1>
      <List columnNames={playerListLabels} component={PlayerListItem} items={playerList} />
      <div className={scss.buttons}>
        <button onClick={leaveRoom}>Leave</button>
        <button onClick={toggleReady}>Ready</button>
      </div>
    </div>
  );
}

export default Room;
