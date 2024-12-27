import React, { useState } from "react";
import Cookies from "js-cookie";
import { FaCog, FaSignOutAlt } from "react-icons/fa";
import styles from "./Header.module.scss";
import SettingsWidget from "../Profile/SettingsWidget";

const Header = ({ changeStatus, avatar, setAvatar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        {/* Brand Logo */}
        <div className={styles.navbarBrand} onClick={() => console.log("Go Home!")}>
          <img src="/logo.png" alt="Logo" className={styles.logo} />
          Transcendence
        </div>

        {/* Profile Section */}
        <div className={styles.profileContainer}>
          {/* Profile Avatar */}
          <img
            src={avatar}
            alt="profile"
            className={styles.profile}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
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
            avatar={avatar}
            setAvatar={(newAvatar) => {
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
