import React, {useState} from 'react'
import RoomList from '../RoomList/RoomList'
import Room from '../Room/Room'
import Friends from '../Friends/Friends'
import scss from './Lobby.module.scss'

function Lobby() {
  return (
    <div className={scss.lobby}>
      <div className={scss.top}>
        <RoomList />
        <Room />
      </div>
      <div className={scss.bottom}>
  			<Friends />
      </div>
    </div>
  )
}

export default Lobby;
