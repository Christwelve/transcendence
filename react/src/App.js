import React, { useEffect, useState } from 'react'
import './App.css'
import Register from './components/Register/Register'
import Login from './components/Login/Login'
import Page from './pages/Page'
import Cookies from 'js-cookie'
import TwoFactor from './components/TwoFactor/TwoFactor'
import DataContextProvider from './components/DataContext/DataContext'
import ModalPresenter from './components/Modal/ModalPresenter'
import ToastPresenter from './components/Toast/ToastPresenter'
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

  // const addUserToDatabase = (user) => {
  //   if (!database[user.username]) {
  //     const updatedDatabase = {
  //       ...database,
  //       [user.username]: { email: user.email, password: user.password },
  //     };
  //     setDatabase(updatedDatabase);
  //     setUserStatus("login");
  //     setErrorMessage(null);
  //   } else {
  //     setErrorMessage("User already exists");
  //   }
  // };

  const userLogin = async (user, authenticated) => {
    if (authenticated) {
      const response = await fetch(`http://localhost:8000/api/login/`, {
        method: "POST",
        credentials: 'include',
        body: user,
      });

      const userData = await response.json();

      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          setErrorMessage("Wrong credentials!");
        } else if (response.status === 401) {
          setErrorMessage("Unable to authenticate!");
        } else {
          console.error("An unexpected error occurred:", response.statusText);
        }
      } else {
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

        //when we change the domain to a secure one we must add { secure: true } as 3rd parameter
        setUserStatus("logged");
        setErrorMessage(null);
        setUser(userData.user);
        Cookies.set('authToken', userData.token);
        setUsername(userData.user.username);
      }
    } else {
      try {
        const response = await fetch(`http://localhost:8000/api/login/`, {
          method: "POST",
          credentials: 'include',
          body: user,
        });

        if (response.status === 400 || response.status === 404) {
          setErrorMessage("Wrong credentials!");
          return;
        } else if (response.status === 401) {
        } else if (response.status === 401) {
          setUserStatus("2fa");
          setErrorMessage(null);
          const userObject = Object.fromEntries(user.entries());
          setUser(userObject);
          setUsername(userObject.username);
        } else if (response.status === 200) {
          const userData = await response.json();
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
          setUserStatus("logged");
          setErrorMessage(null);
          setUser(userData.user);
          setUsername(userData.user.username);
          Cookies.set('authToken', userData.access_token);
        } else {
          setErrorMessage("An unexpected error occurred");
        }
      } catch (error) {
        console.error("Network error:", error.message);
      }

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
      } else {
        setErrorMessage(null);
      }

      const data = await response.json();
      Cookies.set('login', '42');
      window.location.href = data.authorization_url; // Redirect the user
    } catch (error) {
      console.error("Network error:", error.message);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user/data/", {
        method: "GET",
        credentials: "include", // Include cookies for session-based data
        headers: {
          'Authorization': `Bearer ${Cookies.get('authToken')}`,
        }
      });

      if (!response.ok) {
        console.error("Failed to fetch user data:", response.statusText);
        setErrorMessage("An unexpected error occurred");
        return;
      }

      const user = await response.json();
      // console.log("User: ", user);
      const authToken = Cookies.get('authToken');
      if (!authToken) {
        Cookies.set('authToken', user.token);
      }

      console.log("Avatar URL received:", user.avatar);
      if (user.avatar) {
        const avatarUrl = user.avatar;
        if (avatarUrl.startsWith('http')) {
          setAvatar(avatarUrl); // Absolute URL, use directly
        } else {
          setAvatar(`http://localhost:8000${avatarUrl}`);
        }
      } else {
        setAvatar(`https://robohash.org/${user.username}?200x200`);
        console.log("TODO: ADD FILE TO BACKEND AND STORE PATH: ", user.avatar);
      }

      setUsername(user.username);
      setUserStatus("logged");
      setErrorMessage(null);

    } catch (error) {
      console.error("Network error:", error.message);
    }
  };
  // return (
  //   <DataContextProvider>
  //     <Home changeStatus={changeStatus} avatar={avatar} />
  //     <ModalPresenter />
  //     <ToastPresenter />
  //   </DataContextProvider>
  // );

  return (
    <>
      {userStatus === "register" ? (
        <Register
          changeStatus={changeStatus}
        // addUserToDatabase={addUserToDatabase}
        // errorMessage={errorMessage}
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
          <Page changeStatus={changeStatus} avatar={avatar} setAvatar={setAvatar} username={username} setUsername={setUsername}/>
          <ModalPresenter />
          <ToastPresenter />
        </DataContextProvider>

      )}
    </>
  );
}

export default App;
