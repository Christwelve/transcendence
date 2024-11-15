import React, { useState } from "react";
import "../genericStyles.css";

const Login = ({ changeStatus, userLogin, errorMessage }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const _onUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const _onPasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const createUser = () => {
    return { username, password };
  };

  const _onFormSubmit = (event) => {
    event.preventDefault();
    const user = createUser();
    userLogin(user);
  };
  return (
    <div className="container">
      <h1>Login</h1>
      <form className="wd-25 pd-3">
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="username"
            className="form-control"
            id="username"
            placeholder="example"
            onChange={_onUsernameChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            onChange={_onPasswordChange}
          />
        </div>
        <div className="mb-3">
          <button
            type="submit"
            className="btn btn-primary mb-3"
            onClick={_onFormSubmit}
          >
            Login
          </button>
        </div>
        <div className="mb-3">
          <p>
            Don't you have an account?{" "}
            <span
              className="link"
              onClick={() => {
                changeStatus("register");
              }}
            >
              Register now
            </span>
          </p>
        </div>
      </form>
      <p className="error">{errorMessage}</p>
    </div>
  );
};

export default Login;
