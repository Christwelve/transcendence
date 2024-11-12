import React from "react";
import "../genericStyles.css";

const Profile = ({changeComponent, avatar}) => {
  return (
    <div>
      <h1>Profile</h1>
	  <img src={avatar} alt="Avatar" width="100" height="100"/>
      <p className="link" onClick={() => {changeComponent("stats")}}>See game statistics</p>
    </div>
  );
};

export default Profile;
