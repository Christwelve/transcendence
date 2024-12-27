import React, { useState } from "react";
import Cookies from 'js-cookie';
import styles from "./Header.module.scss";

const Header = ({ changeStatus, changeComponent, avatar }) => {
  const [homeIsActive, setHomeIsActive] = useState(true);
  const [gameIsActive, setGameIsActive] = useState(false);

  const activateTab = (tab) => {
    if (tab === "main") {
      setHomeIsActive(true);
      setGameIsActive(false);
    } else if (tab === "game") {
      setGameIsActive(true);
      setHomeIsActive(false);
    } else {
      setHomeIsActive(false);
      setGameIsActive(false);
    }
    changeComponent(tab);
  };

  const logout = async () => {
    const response = await fetch(`http://localhost:8000/api/logout/`, {
      method: "POST",
      // headers: {
      //   Authorization: `Token ${Cookies.get('authToken')}`
      // }
    });

    if (response.ok) {
      console.log("Logged out successfully");
      const authToken = Cookies.get('authToken');
      if (authToken) { //add this check just for safety
        Cookies.remove('authToken');
      }
      Cookies.remove('login');
      const url = new URL(window.location);
      url.searchParams.delete('logged_in'); // Remove the logged_in query parameter
      window.history.pushState({}, '', url); // Update the URL without reloading the page
      changeStatus("login");
    }
  }

  return (
    <header
      className={`navbar navbar-expand-lg navbar-dark ${styles.customNavbar}`}
    >
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

        <div id="navbarNav">
          <div className="btn-group dropstart">
            <button
              type="button"
              className={`btn dropdown-toggle ${styles.dropdownButton}`}
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img src={avatar} alt="profile" className={styles.profile} />
            </button>
            <ul className={`dropdown-menu ${styles.dropdownMenu}`}>
              <li>
                <button
                  className={`dropdown-item ${styles.dropdownItem}`}
                  onClick={() => {
                    activateTab("profile");
                  }}
                >
                  Settings
                </button>
              </li>
              <li>
                <button
                  className={`dropdown-item ${styles.dropdownItem}`}
                  onClick={() => {
                    activateTab("stats");
                  }}
                >
                  Statistics
                </button>
              </li>
              <li>
                <hr className={`dropdown-divider ${styles.dropdownDivider}`} />
              </li>
              <li>
                <button
                  className={`dropdown-item ${styles.dropdownItem}`}
                  onClick={() => {
                    logout();
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
