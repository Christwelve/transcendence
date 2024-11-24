import React, { useEffect, useState } from "react";
import "./App.css";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import Home from "./components/Home/Home";
import DataContextProvider from './components/DataContext'
import Page from './pages/Page'
import ModalPresenter from './components/ModalPresenter'
import {closeModalTop} from './utils/modal'

function App() {
  useEffect(() => {

		const onKeyDown = event => {
			if(event.code !== 'Escape')
				return;

			closeModalTop();
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
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
      if(!userData.avatar)
        setAvatar(`https://robohash.org/${userData.username}?200x200`);
      else {
        const avatarIcon = (userData.avatar).split('/').pop();
        setAvatar(`http://localhost:8000/media/${avatarIcon}`);
      }
      setUserStatus("logged");
      setErrorMessage(null);
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
