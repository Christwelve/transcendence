import React, { useState } from "react";
import "./Navbar.css";

const Navbar = ({ changeStatus, changeComponent, avatar }) => {
  const [homeIsActive, setHomeIsActive] = useState(true);
  const [gameIsActive, setGameIsActive] = useState(false);
  const activateTab = (tab) => {
    console.log(tab, homeIsActive, gameIsActive);
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
    <nav className="navbar navbar-expand-lg bg-primary navbar-dark">
      <div className="container-fluid">
        <p
          className="navbar-brand navbar-link"
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
        </p>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <p
                className={`nav-link navbar-link ${
                  homeIsActive ? "active" : ""
                }`}
                onClick={() => {
                  activateTab("main");
                }}
              >
                Home
              </p>
            </li>
            <li className="nav-item">
              <p
                className={`nav-link navbar-link ${
                  gameIsActive ? "active" : ""
                }`}
                onClick={() => {
                  activateTab("game");
                }}
              >
                Game
              </p>
            </li>
          </ul>
          <div className="btn-group dropstart">
            <button
              type="button"
              className="btn btn-primary dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img src={avatar} alt="profile" className="profile" />
            </button>
            <ul className="dropdown-menu">
              <li className="wd-25">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    activateTab("profile");
                  }}
                >
                  Settings
                </button>
              </li>
              <li className="wd-25">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    activateTab("stats");
                  }}
                >
                  Statistics
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item"
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
    </nav>
  );
};

export default Navbar;
