import React from "react";
import "../genericStyles.css";
import "./Profile.css";

const Profile = ({ avatar }) => {
  return (
    <div className="container">
      <h1 className="page-title mb-5 mt-3">Profile</h1>
      <img src={avatar} alt="Avatar" className="profile-img" />
    </div>
  );
};

export default Profile;
