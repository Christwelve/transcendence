import React, { useState } from "react";
import "./Navbar.css";

const Navbar = ({ changeStatus, changeComponent, avatar }) => {
  return (
    <nav className="navbar navbar-expand-lg bg-primary navbar-dark">
      <div className="container-fluid">
        <a className="navbar-brand" href="home">
          <img
            src="/logo.png"
            alt="Logo"
            width="30"
            height="30"
            class="d-inline-block align-text-top"
          />
          Transcendence
        </a>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="home">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="pong">
                Game
              </a>
            </li>
          </ul>
          <div class="btn-group dropstart">
            <button
              type="button"
              class="btn btn-primary dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img src={avatar} alt="profile" className="profile" />
            </button>
            <ul class="dropdown-menu">
              <li className="wd-25">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    changeComponent("profile");
                  }}
                >
                  Profile
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
