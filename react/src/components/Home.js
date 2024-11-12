import Navbar from "./Navbar/Navbar";
import { useState } from "react";

const Home = ({changeStatus}) => {

  return (
    <div>
      <Navbar changeStatus={changeStatus}/>
    </div>
  );
};

export default Home;
