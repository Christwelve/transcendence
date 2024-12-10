import React from "react";
import Lobby from "../Lobby/Lobby";
import Room from "../Room/Room";
import scss from "./Main.module.scss";

const Main = () => {
  return (
    <div className={scss.mainContainer}>
      <Lobby />
      <Room />
    </div>
  );
};

export default Main;
