import React from "react";
import FriendList from "../FriendList/FriendList";
import Room from '../Room/Room';
import Lobby from "../Lobby/Lobby";

const Main = () => {
	return (
		<div>
		<h1>PONGY PONG</h1>
		<FriendList />
		<Room />
		<Lobby />
		</div>
	);
};

export default Main;
