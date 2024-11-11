import React from "react";
import "./Login.css";

const Login = ({ changeStatus }) => {
  return (
    <div className="container">
      <h1>Login</h1>
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
          <label for="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
          />
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
    </div>
  );
};

export default Login;
