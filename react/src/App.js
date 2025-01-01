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
import { UserProvider, useUserContext } from './context/UserContext'
import { closeModalTop } from './utils/modal'

import {
  fetchUserData as fetchUserDataService,
  userLogin as userLoginService,
  loginWith42 as loginWith42Service,
} from './services/userService';

const AppContent= () => {
  const {
    userStatus,
    setUserStatus,
    errorMessage,
    setErrorMessage,
    avatar,
    setAvatar,
    user,
    setUser,
    username,
    setUsername,
    loading,
    setLoading,
  } = useUserContext();



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
    } else {
      setLoading(false);
    }
  }, []);

  const changeStatus = (status) => {
    setUserStatus(status);
  };


  const userLogin = async (formData, authenticated) => {
    try {
      setErrorMessage(null);
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
      Cookies.set('jwtToken', userData.jwtToken);
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
      setErrorMessage("An unexpected error occurred");
    }
  };

  const fetchUserData = async () => {
    try {
      const userResponse = await fetchUserDataService();

      if (!userResponse) {
        throw new Error("No user data received");
      }

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

      if (userResponse.username)
        setUsername(userResponse.username);
      setUserStatus("logged");
      setErrorMessage(null);

    } catch (error) {
      if (error.status) {
        switch (error.status) {
          case 400:
            setErrorMessage(error.message);
            break;
          case 401:
            setUserStatus("login");
            setErrorMessage(error.message);
            break;
          case 404:
            setErrorMessage(error.message);
            break;
          default:
            setErrorMessage(error.message);
        }
      } else {
        setErrorMessage(error.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>; // Replace with a spinner or skeleton screen
  }

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
};

const App = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App;
