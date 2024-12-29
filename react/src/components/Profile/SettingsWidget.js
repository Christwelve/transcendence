import React, { useState } from 'react'
import styles from './Profile.module.scss'
import { protocol, hostname, djangoPort } from '../../utils/scheme'


const SettingsWidget = ({ avatar, setAvatar, onClose, twoFactor, setNewUsername }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(avatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [is2FAEnabled, setIs2FAEnabled] = useState(twoFactor);

  const enable2FA = () => {
    const formData = new FormData();
    const has_2fa = !is2FAEnabled;
    formData.append("has_2fa", has_2fa);
    fetch(`${protocol}//${hostname}:${djangoPort}/api/2fa/enable/`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setIs2FAEnabled(has_2fa);
        } else {
          alert("Failed to enable 2FA.");
        }
      })
      .catch((error) => console.error("Error updating profile:", error));

  };

  const handleSaveChanges = () => {
    const formData = new FormData();
    if (username) formData.append("username", username);
    if (email) formData.append("email", email);
    if (newPassword) formData.append("password", newPassword);
    if (avatarFile) formData.append("avatar", avatarFile);

    fetch(`${protocol}//${hostname}:${djangoPort}/api/user/update/`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
          setNewUsername(username);
          if (data.avatar) {
            setAvatar(data.avatar);
            setAvatarPreview(data.avatar);
          }
        } else {
          alert("Failed to update profile.");
        }
      })
      .catch((error) => console.error("Error updating profile:", error));
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
        <div className={styles.formGroup}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter new username"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter new email"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <div className={styles.toggleGroup}>
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
        </div>
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
