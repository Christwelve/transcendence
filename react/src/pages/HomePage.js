import React from "react";
import { useState } from "react";
import Register from "../components/Register";
import Login from "../components/Login";

function HomePage() {
  const [userStatus, setUserStatus] = useState("register");

  const changeStatus = (status) => {
    setUserStatus(status);
  };

  return (
    <>
      {userStatus === "register" ? (
        <Register changeStatus={changeStatus} />
      ) : userStatus === "login" ? (
        <Login changeStatus={changeStatus} />
      ) : (
        <Register changeStatus={changeStatus} />
      )}
    </>
  );
}

export default HomePage;
