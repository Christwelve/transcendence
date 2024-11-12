import React from "react";
import { useState } from "react";
import Register from "../components/Register";
import Login from "../components/Login";
import Home from "../components/Home";

function HomePage() {
  const [userStatus, setUserStatus] = useState("register");
  const [errorMessage, setErrorMessage] = useState(null);
  const [database, setDatabase] = useState({});
  const [avatar, setAvatar] = useState(null);

  const changeStatus = (status) => {
    setUserStatus(status);
  };

  const addUserToDatabase = (user) => {
    if (!database[user.username]) {
      const updatedDatabase = {
        ...database,
        [user.username]: { email: user.email, password: user.password },
      };
      setDatabase(updatedDatabase);
      setUserStatus("login");
      setErrorMessage(null);
    } else {
      setErrorMessage("User already exists");
    }
  };

  const userLogin = (user) => {
    const dbUser = database[user.username];
    if (dbUser) {
      if (dbUser.password === user.password) {
        setUserStatus("logged");
        setAvatar(`https://robohash.org/${user.username}?200x200`);
        setErrorMessage(null);
      } else {
        setErrorMessage("Wrong credentials!");
      }
    } else {
      setErrorMessage("Wrong credentials!");
    }
  };

  console.log("state: ", userStatus);

  return (
    <>
      {userStatus === "register" ? (
        <Register
          changeStatus={changeStatus}
          addUserToDatabase={addUserToDatabase}
          errorMessage={errorMessage}
        />
      ) : userStatus === "login" ? (
        <Login
          changeStatus={changeStatus}
          userLogin={userLogin}
          errorMessage={errorMessage}
        />
      ) : (
        <Home changeStatus={changeStatus} avatar={avatar}/>
      )}
    </>
  );
}

export default HomePage;
