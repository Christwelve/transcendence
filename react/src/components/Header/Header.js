import React, { useState } from "react";
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

  return (
    <header
      className={`navbar navbar-expand-lg navbar-dark ${styles.customNavbar}`}
    >
      <div className={styles.inner}>
        <div
          className={styles.navbarBrand}
          onClick={() => {
            activateTab("home");
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
                    changeStatus("login");
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
