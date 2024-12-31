import React, { useState } from 'react'
import '../genericStyles.css'
import './Profile.module.scss'
import { protocol, hostname, djangoPort } from '../../utils/scheme'


const Profile = ({ avatar, setAvatar }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(avatar);
  const [avatarFile, setAvatarFile] = useState(null);

  const handleSaveChanges = () => {
    const formData = new FormData();
    if (username) formData.append("username", username);
    if (email) formData.append("email", email);
    if (newPassword) formData.append("password", newPassword);
    if (avatarFile) formData.append("avatar", avatarFile);

    // fetch(`${protocol}//${hostname}:${djangoPort}/api/user/update/`, {
    fetch(`${protocol}//${hostname}/api/user/update/`, {
      method: "POST",
      credentials: "include",
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
    console.log(file)
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="container">
      <h1 className="page-title mb-5 mt-3">Profile</h1>
      <img src={avatarPreview} alt="Avatar" className="profile-img mb-3" />
      <input type="file" onChange={handleAvatarChange} />

      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-control"
          placeholder="Enter new username"
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control"
          placeholder="Enter new email"
        />
      </div>

      <div className="form-group">
        <label>Change Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="form-control"
          placeholder="Enter new password"
        />
      </div>

      <button
        className="btn btn-primary mt-3"
        onClick={handleSaveChanges}
      >
        Save Changes
      </button>
    </div>
  );
};

export default Profile;