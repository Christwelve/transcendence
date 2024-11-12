import React from "react";

const Statistics = ({ changeComponent }) => {
  return (
    <div>
      <h1>Statistics</h1>
      <p
        className="link"
        onClick={() => {
          changeComponent("profile");
        }}
      >
        back to profile
      </p>
    </div>
  );
};

export default Statistics;
