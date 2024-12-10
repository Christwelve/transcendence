import React, { useEffect, useState } from "react";
import "./App.css";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import Home from "./components/Home/Home";
import DataContextProvider from './components/DataContext/DataContext'
import Page from './pages/Page'
import ModalPresenter from './components/Modal/ModalPresenter'
import { closeModalTop } from './utils/modal'

function App() {
  useEffect(() => {

    const onKeyDown = event => {
      if (event.code !== 'Escape')
        return;

      closeModalTop();
    }

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    // Check for `logged_in=true` in the query string
    const params = new URLSearchParams(window.location.search);
    const loggedIn = params.get("logged_in");

    if (loggedIn === "true") {
      fetchUserData(); // Call the function to fetch user data
    }
  }, []);

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

  const userLogin = async (user) => {
    const response = await fetch(`http://localhost:8000/api/login/`, {
      method: "POST",
      body: user,
    });

    const userData = await response.json();

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        setErrorMessage("Wrong credentials!");
        console.log("hey");
      } else {
        console.error("An unexpected error occurred:", response.statusText);
      }
    } else {
      if (!userData.avatar)
        setAvatar(`https://robohash.org/${userData.username}?200x200`);
      else {
        const avatarIcon = (userData.avatar).split('/').pop();
        setAvatar(`http://localhost:8000/media/avatars/${avatarIcon}`);
      }
      setUserStatus("logged");
      setErrorMessage(null);
    }
  };

  const login_with_42 = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/42/login/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to get authorization URL:", response.statusText);
        setErrorMessage("An unexpected error occurred");
        return;
      }

      const data = await response.json();
      window.location.href = data.authorization_url; // Redirect the user
    } catch (error) {
      console.error("Network error:", error.message);
      setErrorMessage("An unexpected error occurred");
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user/data/", {
        method: "GET",
        credentials: "include", // Include cookies for session-based data
      });

      if (!response.ok) {
        console.error("Failed to fetch user data:", response.statusText);
        setErrorMessage("An unexpected error occurred");
        return;
      }

      const user = await response.json();
      setAvatar(user.avatar);
      setUserStatus("logged");
      setErrorMessage(null);
    } catch (error) {
      console.error("Network error:", error.message);
      setErrorMessage("An unexpected error occurred");
    }
  };

  return (
    <>
      {userStatus === "register" ? (
        <Register
          changeStatus={changeStatus}
          addUserToDatabase={addUserToDatabase}
          login_with_42={login_with_42}
          errorMessage={errorMessage}
        />
      ) : userStatus === "login" ? (
        <Login
          changeStatus={changeStatus}
          userLogin={userLogin}
          errorMessage={errorMessage}
        />
      ) : (

        <DataContextProvider>
          <Page />
          <ModalPresenter />
          <Home changeStatus={changeStatus} avatar={avatar} />
        </DataContextProvider>

      )}
    </>
  );
}

export default App;
