import React, { useEffect, useState } from 'react'
import './App.css'
import Register from './components/Register/Register'
import Login from './components/Login/Login'
import Page from './pages/Page'
import Cookies from 'js-cookie'
import TwoFactor from './components/TwoFactor/TwoFactor'
import DataContextProvider from './context/DataContext'
import ModalPresenter from './components/Modal/ModalPresenter'
import ToastPresenter from './components/Toast/ToastPresenter'
import { closeModalTop } from './utils/modal'

import {
  fetchUserData as fetchUserDataService,
  userLogin as userLoginService,
  loginWith42 as loginWith42Service,
} from './services/userService';

function App() {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== 'Escape') return;
      closeModalTop();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (Cookies.get('login')) {
      fetchUserData(); // Call the function to fetch user data
    }
  }, []);

  const [userStatus, setUserStatus] = useState("login");
  const [errorMessage, setErrorMessage] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  const changeStatus = (status) => {
    setUserStatus(status);
  };

  const userLogin = async (formData, authenticated) => {
    try {
      const userData = await userLoginService(formData, authenticated);

      Cookies.set('login', 'manual');
      if (userData.user.avatar) {
        const avatarUrl = userData.user.avatar;
        if (avatarUrl.startsWith('http')) {
          setAvatar(avatarUrl);
        } else {
          setAvatar(`http://localhost:8000${avatarUrl}`);
        }
      } else {
        setAvatar(`https://robohash.org/${userData.username}?200x200`);
      }

      Cookies.set('authToken', userData.token);
      setUserStatus("logged");
      setErrorMessage(null);
      setUser(userData.user);
      setUsername(userData.user.username);

    } catch (error) {
      if (error.message === "Wrong credentials!") {
        setErrorMessage("Wrong credentials!");
      } else if (error.message === "2fa") {
        setUserStatus("2fa");
        setErrorMessage(null);
        const userObject = Object.fromEntries(formData.entries());
        setUser(userObject);
        setUsername(userObject.username);
      } else if (error.message === "Unable to authenticate!") {
        setErrorMessage("Unable to authenticate!");
      } else {
        console.error("An unexpected error occurred:", error.message);
        setErrorMessage("An unexpected error occurred");
      }
    }
  };

  const login_with_42 = async () => {
    try {
      const data = await loginWith42Service();
      Cookies.set('login', '42');
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Network error:", error.message);
      setErrorMessage("An unexpected error occurred");
    }
  };

  const fetchUserData = async () => {
    try {
      const userResponse = await fetchUserDataService();

      const authToken = Cookies.get('authToken');
      if (!authToken) {
        Cookies.set('authToken', userResponse.token);
      }

      console.log("Avatar URL received:", userResponse.avatar);
      if (userResponse.avatar) {
        const avatarUrl = userResponse.avatar;
        if (avatarUrl.startsWith('http')) {
          setAvatar(avatarUrl);
        } else {
          setAvatar(`http://localhost:8000${avatarUrl}`);
        }
      } else {
        setAvatar(`https://robohash.org/${userResponse.username}?200x200`);
        console.log("TODO: ADD FILE TO BACKEND AND STORE PATH: ", userResponse.avatar);
      }

      setUsername(userResponse.username);
      setUserStatus("logged");
      setErrorMessage(null);

    } catch (error) {
      console.error("Failed to fetch user data:", error.message);
      setErrorMessage("An unexpected error occurred");
    }
  };

  return (
    <>
      {userStatus === "register" ? (
        <Register
          changeStatus={changeStatus}
        />
      ) : userStatus === "login" ? (
        <Login
          changeStatus={changeStatus}
          userLogin={userLogin}
          login_with_42={login_with_42}
          errorMessage={errorMessage}
        />
      ) : userStatus === "2fa" ? (
        <TwoFactor
          changeStatus={changeStatus}
          userLogin={userLogin}
          errorMessage={errorMessage}
          user={user}
        />
      ) : (
        <DataContextProvider>
          <Page
            changeStatus={changeStatus}
            avatar={avatar}
            setAvatar={setAvatar}
            username={username}
            setUsername={setUsername}
          />
          <ModalPresenter />
          <ToastPresenter />
        </DataContextProvider>
      )}
    </>
  );
}

export default App;
