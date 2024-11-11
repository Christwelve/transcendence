import React from "react";
import { useState } from "react";
import Register from "../components/Register";
import Login from "../components/Login";

function HomePage() {
  const [userStatus, setUserStatus] = useState("register");
  const [errorMessage, setErrorMessage] = useState(null);
  const [database, setDatabase] = useState({});

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

  return (
    <>
      {userStatus === "register" ? (
        <Register
          changeStatus={changeStatus}
          addUserToDatabase={addUserToDatabase}
          errorMessage={errorMessage}
        />
      ) : userStatus === "login" ? (
        <Login changeStatus={changeStatus} />
      ) : (
        <Register changeStatus={changeStatus} />
      )}
    </>
  );
}

export default HomePage;
