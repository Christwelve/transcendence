import { useState } from 'react'
import Header from '../Header/Header'
import Statistics from '../Statistics/Statistics'
import Profile from '../Profile/Profile'
import Main from '../Main/Main'
import Game from '../Game/Game'
import FriendList from '../FriendList/FriendList'
import styles from './Home.module.scss';
// import Page from '../../pages/Page";

const Home = ({ changeStatus, avatar, setAvatar, set2fa }) => {
  const [mainComponent, setMainComponent] = useState("main");

  const changeComponent = (component) => {
    setMainComponent(component);
  };

  return (
    <div className={styles.homeContainer}>
      <Header
        changeStatus={changeStatus}
        changeComponent={changeComponent}
        avatar={avatar}
        setAvatar={setAvatar}
        set2fa={set2fa}
      />

      <div className={styles.mainContent}>
        {mainComponent === "stats" && <Statistics />}
        {mainComponent === "profile" && <Profile avatar={avatar} setAvatar={setAvatar} changeStatus={changeStatus} />}
        {mainComponent === "main" && <Main />}
        {mainComponent === "game" && <Game />}
        <div>
          <Statistics />
        </div>
      </div>
      <FriendList />
    </div>
  );
};

export default Home;
