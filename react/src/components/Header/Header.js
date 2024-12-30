import React, { useState } from 'react'
import Cookies from 'js-cookie'
import { FaCog, FaSignOutAlt } from 'react-icons/fa'
import styles from './Header.module.scss'
import SettingsWidget from '../Profile/SettingsWidget'

const Header = ({ changeStatus, avatar, setAvatar, username, setUsername, set2fa }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const updateDropdownData = async () => {
    fetch(`http://localhost:8000/api/users/${username}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.has_2fa) {
          setTwoFactor(data.has_2fa);
        }
      })
      .catch((error) => console.error("Error updating profile:", error));
    setIsDropdownOpen(!isDropdownOpen);
  };

  const logout = async () => {
    const response = await fetch(`http://localhost:8000/api/logout/`, {
      method: "POST",
    });

    if (response.ok) {
      console.log("Logged out successfully");
      const authToken = Cookies.get("authToken");
      if (authToken) {
        Cookies.remove("authToken");
      }
      Cookies.remove("login");
      const url = new URL(window.location);
      url.searchParams.delete("logged_in");
      window.history.pushState({}, "", url);
      changeStatus("login");
    }
  };

  return (
    <header className={`navbar navbar-expand-lg navbar-dark ${styles.customNavbar}`}>
      <div className={styles.inner}>
        <div
          className={styles.navbarBrand}
          onClick={() => {
            window.location.reload();
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            width="30"
            height="30"
            className="d-inline-block align-text-top"
          />
          Transcendence
        </div>

        {/* Profile Section */}
        <div className={styles.profileContainer}>
          {/* Profile Avatar */}
          <img
            src={avatar}
            alt="profile"
            className={styles.profile}
            onClick={updateDropdownData}
          />

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <button
                className={`disabled ${styles.username}`}>
                {username && username.trim() ? username : "Your Profile"}
              </button>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsDropdownOpen(false);
                }}
              >
                <FaCog /> Settings
              </button>
              <button className={styles.dropdownItem} onClick={logout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Widget */}
      {isSettingsOpen && (
        <div className={styles.settingsContainer}>
          <SettingsWidget
            set2fa={set2fa}
            avatar={avatar}
            twoFactor={twoFactor}
            setNewUsername={setUsername}
            setAvatar={(newAvatar) => {
              console.log("setAvatar in Header.js:", setAvatar);
              setAvatar(newAvatar);
              setIsSettingsOpen(false);
            }}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      )}
    </header>
  );
};

export default Header;
