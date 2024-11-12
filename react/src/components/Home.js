import Navbar from "./Navbar/Navbar";
import { useState } from "react";
import Statistics from "./Statistics/Statistics";
import Profile from "./Profile/Profile";
import Main from "./Main/Main";

const Home = ({ changeStatus, avatar }) => {
  const [mainComponent, setMainComponent] = useState("main");

  const changeComponent = (component) => {
    setMainComponent(component);
  };

  return (
    <div>
      <Navbar changeStatus={changeStatus} changeComponent={changeComponent} avatar={avatar}/>
      {mainComponent === "stats" && <Statistics changeComponent={changeComponent}/>}
      {mainComponent === "profile" && <Profile changeComponent={changeComponent} avatar={avatar}/>}
      {mainComponent === "main" && <Main />}
    </div>
  );
};

export default Home;
