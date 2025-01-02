import React, { createContext, useContext, useState } from 'react'

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userStatus, setUserStatus] = useState("login");
  const [errorMessage, setErrorMessage] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  const value = {
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
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  return useContext(UserContext);
};
