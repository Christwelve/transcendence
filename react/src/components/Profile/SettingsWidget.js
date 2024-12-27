import React, { useState } from "react";
import styles from "./Profile.module.scss";

const SettingsWidget = ({ avatar, setAvatar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(avatar);
  const [avatarFile, setAvatarFile] = useState(null);

  const toggleWidget = () => setIsOpen(!isOpen);

  const handleSaveChanges = () => {
    const formData = new FormData();
    if (username) formData.append("username", username);
    if (email) formData.append("email", email);
    if (newPassword) formData.append("password", newPassword);
    if (avatarFile) formData.append("avatar", avatarFile);

    fetch("http://localhost:8000/api/user/update/", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
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
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.container}>
      {/* Toggle Button */}
      <button className={styles.toggleButton} onClick={toggleWidget}>
        ⚙️ Settings
      </button>

      {/* Settings Content */}
      {isOpen && (
        <div className={styles.widget}>
          <h3>Settings</h3>
          <img src={avatarPreview} alt="Avatar" className={styles.avatar} />
          <input type="file" onChange={handleAvatarChange} />

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

          <div className={styles.actions}>
            <button className={styles.saveButton} onClick={handleSaveChanges}>
              Save
            </button>
            <button className={styles.cancelButton} onClick={toggleWidget}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsWidget;
