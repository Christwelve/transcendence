import { useState } from "react";
import Navbar from "../Navbar/Navbar";
import Statistics from "../Statistics/Statistics";
import Profile from "../Profile/Profile";
import Main from "../Main/Main";
import Game from "../Game/Game";

const Home = ({ changeStatus, avatar, setAvatar }) => {
  const [mainComponent, setMainComponent] = useState("main");

  const changeComponent = (component) => {
    setMainComponent(component);
  };

  return (
    <div>
      <Navbar
        changeStatus={changeStatus}
        changeComponent={changeComponent}
        avatar={avatar}
      />
      {mainComponent === "stats" && <Statistics />}
      {mainComponent === "profile" && <Profile avatar={avatar} setAvatar={setAvatar} />}
      {mainComponent === "main" && <Main />}
      {mainComponent === "game" && <Game />}
    </div>
  );
};

export default Home;
