import React, { useState } from "react";
import "../genericStyles.css";

const Register = ({ changeStatus, login_with_42 }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const _onEmailChange = (event) => {
    setEmail(event.target.value);
    setEmailError("");
  };

  const _onUsernameChange = (event) => {
    setUsername(event.target.value);
    setUsernameError("");
  };

  const _onPasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);

    const regex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    if (value === "") {
      setPasswordError("Password is required.");
    } else if (!regex.test(value)) {
      setPasswordError(
        "Your password must be 8-20 characters long, contain letters and numbers, and must not contain spaces, special characters, or emoji."
      );
    } else {
      setPasswordError("");
    }
  };

  const _onAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAvatarError("File size must be less than 2MB.");
        setAvatar(null);
        return;
      }
      setAvatarError("");
      setAvatar(file);
    }
  };

  const validateFieldsOnSubmit = () => {
    let valid = true;

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }

    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    }

    if (!username) {
      setUsernameError("Username is required.");
      valid = false;
    }

    return valid;
  };

  const createUser = () => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);
    if (avatar) {
      formData.append("avatar", avatar);
    }
    return formData;
  };

  const addUserToDatabase = async (formData) => {
    try {
      const response = await fetch("http://localhost:8000/api/users/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setEmailError(errorData.email ? errorData.email.join(", ") : "");
          setUsernameError(errorData.username ? errorData.username.join(", ") : "");
        } else {
          console.error("An unexpected error occurred:", response.statusText);
        }
      } else {
        console.log("User successfully registered.");
        changeStatus("login");
      }
    } catch (error) {
      console.error("Network error:", error.message);
    }
  };

  const _onFormSubmit = (event) => {
    event.preventDefault();
    const isValid = validateFieldsOnSubmit();
    if (!isValid) return;

    const user = createUser();
    addUserToDatabase(user);
  };


  return (
    <div className="container">
      <h1>Register</h1>
      <form className="wd-25 pd-3">
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            className={`form-control ${usernameError ? "is-invalid" : ""}`}
            id="username"
            placeholder="example"
            value={username}
            onChange={_onUsernameChange}
          />
          {usernameError && <div className="invalid-feedback">{usernameError}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            type="email"
            className={`form-control ${emailError ? "is-invalid" : ""}`}
            id="email"
            placeholder="name@example.com"
            value={email}
            onChange={_onEmailChange}
          />
          {emailError && <div className="invalid-feedback">{emailError}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className={`form-control ${passwordError ? "is-invalid" : ""}`}
            value={password}
            onChange={_onPasswordChange}
          />
          {passwordError && <div className="invalid-feedback">{passwordError}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="avatar" className="form-label">
            Upload Avatar (optional)
          </label>
          <input
            type="file"
            className={`form-control ${avatarError ? "is-invalid" : ""}`}
            id="avatar"
            accept="image/jpeg, image/png"
            onChange={_onAvatarChange}
          />
          {avatarError && <div className="invalid-feedback">{avatarError}</div>}
        </div>
        <div className="mb-3">
          <button
            type="submit"
            className="btn btn-primary mb-3"
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
          <br />
          <p>--or--</p>
          <br />
          <button
            type="button"
            className="btn btn-primary"
            onClick={login_with_42}
            >Login with 42</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
