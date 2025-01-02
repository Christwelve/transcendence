import React, { useState } from 'react'
import styles from './Profile.module.scss'
import Cookies from 'js-cookie'
import { showToast } from '../Toast/ToastPresenter';

const SettingsWidget = ({ avatar, setAvatar, onClose, twoFactor, setNewUsername }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(avatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [is2FAEnabled, setIs2FAEnabled] = useState(twoFactor);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const emailValid = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const _onEmailChange = (event) => {
    const email = event.target.value;

    setEmail(email);
    if (!email || emailValid(email)) {
      setEmailError("");
    } else {
      setEmailError("Invalid email");
    }
  }

  const passwordValid = (password) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    return regex.test(password);
  };

  const _onPasswordChange = (event) => {
    const password = event.target.value;
    setNewPassword(password);

    if (!password || passwordValid(password)) {
      setPasswordError("");
    } else {
      setPasswordError("Your password must be 8-20 characters long, contain letters and numbers, and must not contain spaces, special characters, or emoji.");
    }
  }

  const usernameValid = (username) => {
    const regex = /^[a-zA-Z0-9_\-]+$/;
    return regex.test(username);
  };

  const _onUsernameChange = (event) => {
    const username = event.target.value;
    setUsername(username);

    if (!username || usernameValid(username)) {
      setUsernameError("");
    } else {
      setUsernameError("Username can only contain letters, numbers, underscores, and hyphens.");
    }
  };

  const enable2FA = () => {
    const formData = new FormData();
    const has_2fa = !is2FAEnabled;
    formData.append("has_2fa", has_2fa);
    fetch("http://localhost:8000/api/2fa/enable/", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setIs2FAEnabled(has_2fa);
        } else {
          showToast({ type: 'error', title: 'Error', message: 'Failed to toggle 2FA.' })
        }
      })
      .catch((error) => console.error("Error updating profile:", error));

  };

  const handleSaveChanges = () => {
    const formData = new FormData();
    if (username) {
      if (!usernameValid(username))
        return;
      formData.append("username", username);
    }
    if (email) {
      if (!emailValid(email))
        return;
      formData.append("email", email);
    }
    if (newPassword) {
      if (!passwordValid(newPassword))
        return;
      formData.append("password", newPassword);
    }
    if (avatarFile) formData.append("avatar", avatarFile);

    fetch("http://localhost:8000/api/user/update/", {
      method: "POST",
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${Cookies.get('jwtToken')}`,
      },
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          let errMsg = "An unexpected error occurred";
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errMsg = errorData.error;
            }
          } catch (parseError) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to update user.' })
          }
          throw new Error(errMsg);
        }
        return response.json();
      })
      .then((data) => {
        if (data.message) {
          showToast({ type: 'success', title: 'Success', message: 'Successfully updated user.' })
          if (username.length > 0)
            setNewUsername(username);
          if (data.avatar) {
            setAvatar(data.avatar);
            setAvatarPreview(data.avatar);
          }
        } else {
          showToast({ type: 'error', title: 'Error', message: 'Failed to update user.' })
        }
      })
      .catch((error) => {
        showToast({ type: 'error', title: 'Error', message: 'Failed to update user.' })
      });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    setFileName(file ? file.name : "No file chosen");
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className={`${styles.overlay} ${styles.fadeIn}`}>
      <div className={styles.widget}>
        <div className={styles.closeButton} onClick={onClose}>
          &times;
        </div>
        <img src={avatarPreview} alt="Avatar" className={styles.avatar} />
        <div className={styles.fileUpload}>
          <label htmlFor="avatarUpload" className={styles.fileLabel}>
            Choose File
          </label>
          <input
            type="file"
            id="avatarUpload"
            className={styles.fileInput}
            onChange={handleAvatarChange}
          />
          <span className={styles.fileName}>{fileName}</span>
        </div>
        {Cookies.get('login') === 'manual' && <div className={styles.formGroup}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={_onUsernameChange}
            className={`${styles["form-control"]} ${usernameError ? "is-invalid" : ""}`}
            placeholder="Enter new username"
          />
          {usernameError && <div className="invalid-feedback">{usernameError}</div>}
        </div>}
        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={_onEmailChange}
            className={`${styles["form-control"]} ${emailError ? "is-invalid" : ""}`}
            placeholder="Enter new email"
          />
          {emailError && <div className="invalid-feedback">{emailError}</div>}
        </div>
        <div className={styles.formGroup}>
          <label>Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={_onPasswordChange}
            className={`${styles["form-control"]} ${passwordError ? "is-invalid" : ""}`}
            placeholder="Enter new password"
          />
          {passwordError && <div className="invalid-feedback">{passwordError}</div>}
        </div>
        {Cookies.get('login') === 'manual' && <div className={styles.toggleGroup}>
          <label>Enable 2FA</label>
          <div className={styles.toggleContainer}>
            {/* Slider */}
            <div
              className={`${styles.slider} ${is2FAEnabled ? styles.enabled : styles.disabled
                }`}
              onClick={enable2FA}
            >
              <div
                className={`${styles.knob} ${is2FAEnabled ? styles.knobEnabled : styles.knobDisabled
                  }`}
              ></div>
            </div>

            {/* Lock Icon */}
            <div
              className={`${styles.lockIcon} ${is2FAEnabled ? styles.lockEnabled : styles.lockDisabled
                }`}
            >
              {is2FAEnabled ? "🔒" : "🔓"}
            </div>
          </div>
        </div>}
        <div className={styles.actions}>
          <button className={styles.saveButton} onClick={handleSaveChanges}>
            Save
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsWidget;
