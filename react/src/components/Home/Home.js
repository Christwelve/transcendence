import { useState } from "react";
import Navbar from "../Navbar/Navbar";
import Statistics from "../Statistics/Statistics";
import Profile from "../Profile/Profile";
import Main from "../Main/Main";
import Game from "../Game/Game";
import FriendList from "../FriendList/FriendList";
import styles from "./Home.module.scss";
import Page from "../../pages/Page";

const Home = ({ changeStatus, avatar, setAvatar }) => {
  const [mainComponent, setMainComponent] = useState("main");

  const changeComponent = (component) => {
    setMainComponent(component);
  };

  return (
    <div className={styles.homeContainer}>
      <Navbar
        changeStatus={changeStatus}
        changeComponent={changeComponent}
        avatar={avatar}
      />

      <div className={styles.mainContent}>
        {mainComponent === "stats" && <Statistics />}
        {mainComponent === "profile" && <Profile avatar={avatar} setAvatar={setAvatar} />}
        {mainComponent === "main" && <Main />}
        {mainComponent === "game" && <Game />}
      </div>
      <FriendList />
    </div>
  );
};

export default Home;