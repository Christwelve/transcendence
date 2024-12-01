import React, { useState } from "react";
import "../genericStyles.css";
import "./Profile.css";

const Profile = ({ avatar }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(avatar);
  const [avatarFile, setAvatarFile] = useState(null);

  const handleSaveChanges = () => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    if (newPassword) {
      formData.append("password", newPassword);
    }
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    // Call API to save changes
    fetch("http://localhost:8000/api/user/update/", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          alert("Profile updated successfully!");
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