import React from "react";
import "./Register.css";

const Register = ({ changeStatus }) => {
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
          />
          <div id="passwordHelpBlock" className="form-text">
            Your password must be 8-20 characters long, contain letters and
            numbers, and must not contain spaces, special characters, or emoji.
          </div>
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
    </div>
  );
};

export default Register;
