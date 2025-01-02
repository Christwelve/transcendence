import React, { useState } from "react";
import ToastPresenter, { showToast } from "../Toast/ToastPresenter";
import styles from "./Register.module.scss";


const Register = ({ changeStatus }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [usernameValid, setUsernameValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  const _onEmailChange = (event) => {
    setEmail(event.target.value);
    setEmailError("");
  };

  const _onUsernameChange = (event) => {
    const value = event.target.value;
    setUsername(value);

    const regex = /^[a-zA-Z0-9_\-]+$/;
    if (value === "") {
      setUsernameError("Username is required.");
      setUsernameValid(false);
    } else if (!regex.test(value)) {
      setUsernameError(
        "Username can only contain letters, numbers, underscores, and hyphens."
      );
      setUsernameValid(false);
    } else {
      setUsernameError("");
      setUsernameValid(true);
    }
  };

  const _onPasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);

    const regex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    if (value === "") {
      setPasswordError("Password is required.");
      setPasswordValid(false);
    } else if (!regex.test(value)) {
      setPasswordError(
        "Your password must be 8-20 characters long, contain letters and numbers, and must not contain spaces, special characters, or emoji."
      );
      setPasswordValid(false);
    } else {
      setPasswordError("");
      setPasswordValid(true);
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

    if (!usernameValid || !passwordValid) {
      valid = false;
    }

    return valid;
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
          showToast({type: "error", title: "Error", message: `An unexpected error occured: ${response.status} ${response.statusText}`});

        }
      } else {
        showToast({type: "success", title: "Success", message: "User successfully registered."});
        changeStatus("login");
      }
    } catch (error) {
      showToast({type: "error", title: "Error", message: error.message});

    }
  };

  const _onFormSubmit = async (event) => {
    event.preventDefault();
    const isValid = validateFieldsOnSubmit();
    if (!isValid) return;

    let avatarFile = avatar;

    if (!avatarFile && username) {
      const robothashUrl = `https://robohash.org/${username}?200x200`;
      try {
        const response = await fetch(robothashUrl);
        const blob = await response.blob();
        avatarFile = new File([blob], `${username}.png`, { type: blob.type });
      } catch (error) {
        console.error("Error downloading Robohash avatar:", error);
        return;
      }
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    addUserToDatabase(formData);
  };

  return (
    <div className={styles.container}>
      <h1>Register</h1>
      <form className={styles.form} onSubmit={_onFormSubmit}>
        <div className={styles["form-group"]}>
          <label htmlFor="username" className={styles["form-label"]}>
            Username
          </label>
          <input
            type="text"
            className={`${styles["form-control"]} ${usernameError ? "is-invalid" : ""}`}
            id="username"
            placeholder="example"
            value={username}
            onChange={_onUsernameChange}
          />
          {usernameError && <div className="invalid-feedback">{usernameError}</div>}
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="email" className={styles["form-label"]}>
            Email address
          </label>
          <input
            type="email"
            className={`${styles["form-control"]} ${emailError ? "is-invalid" : ""}`}
            id="email"
            placeholder="name@example.com"
            value={email}
            onChange={_onEmailChange}
          />
          {emailError && <div className="invalid-feedback">{emailError}</div>}
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="password" className={styles["form-label"]}>
            Password
          </label>
          <input
            type="password"
            id="password"
            className={`${styles["form-control"]} ${passwordError ? "is-invalid" : ""}`}
            value={password}
            onChange={_onPasswordChange}
          />
          {passwordError && <div className="invalid-feedback">{passwordError}</div>}
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="avatar" className={styles["form-label"]}>
            Upload Avatar (optional)
          </label>
          <input
            type="file"
            className={`${styles["form-control"]} ${avatarError ? "is-invalid" : ""}`}
            id="avatar"
            accept="image/jpeg, image/png"
            onChange={_onAvatarChange}
          />
          {avatarError && <div className="invalid-feedback">{avatarError}</div>}
        </div>
        <div className={styles["form-group"]}>
          <button
            type="submit"
            className={styles["btn-primary"]}
          >
            Register
          </button>
        </div>
        <div className={styles["form-group"]}>
          <p>Do you have an account?{" "}</p>
          <span
            className={styles.link}
            onClick={() => {
              changeStatus("login");
            }}
          >
            <p>Login now</p>
          </span>
        </div>
      </form>
      <ToastPresenter />
    </div>
  );
};

export default Register;
