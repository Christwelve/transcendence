import React, { useState } from "react";
import "./genericStyles.css";

const Register = ({ changeStatus, addUserToDatabase, errorMessage }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const _onEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const _onUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const _onPasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const createUser = () => {
    return { email, username, password };
  };

  const _onFormSubmit = (event) => {
    event.preventDefault();
    const user = createUser();
    addUserToDatabase(user);
  };

  return (
    <div className="container">
      <h1>Register</h1>
      <form className="wd-25 pd-3">
        <div className="mb-3">
          <label for="username" className="form-label">
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
          <label for="email" className="form-label">
            Email address
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="name@example.com"
            onChange={_onEmailChange}
          />
        </div>
        <div className="mb-3">
          <label for="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            aria-describedby="passwordHelpBlock"
            onChange={_onPasswordChange}
          />
          <div id="passwordHelpBlock" className="form-text">
            Your password must be 8-20 characters long, contain letters and
            numbers, and must not contain spaces, special characters, or emoji.
          </div>
        </div>
        <div class="mb-3">
          <button
            type="submit"
            class="btn btn-primary mb-3"
            onClick={_onFormSubmit}
          >
            Register
          </button>
        </div>
        <div className="mb-3">
          <p>
            Do you have an account?{" "}
            <span
              className="link"
              onClick={() => {
                changeStatus("login");
              }}
            >
              Login now
            </span>
          </p>
        </div>
      </form>
	  <p className="error">{errorMessage}</p>
    </div>
  );
};

export default Register;
