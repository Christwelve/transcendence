import React, { useState, useEffect } from "react";
import styles from "./FriendList.module.scss";

const FriendList = () => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isFriendListOpen, setIsFriendListOpen] = useState(false);

  const fetchFriends = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/friend/");
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setFriends([]);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/user/search/?query=${searchQuery}`
      );
      const data = await response.json();
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setFilteredUsers([]);
    }
  };

  const handleAddFriend = async (username) => {
    try {
      const response = await fetch("http://localhost:8000/api/friend/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        alert(`${username} added successfully!`);
        fetchFriends();
      }
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const handleRemoveFriend = async (username) => {
    try {
      const response = await fetch("http://localhost:8000/api/friend/remove/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        alert(`${username} removed successfully!`);
        fetchFriends();
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div
      className={`${styles.friendList} ${
        isFriendListOpen ? styles.open : ""
      }`}
    >
      <button
        className={`${styles.friendList__toggle} ${
          isFriendListOpen ? styles.friendList__close : ""
        }`}
        onClick={() => setIsFriendListOpen((prev) => !prev)}
      >
        {isFriendListOpen ? "Close Friend List" : "Open Friend List"}
      </button>
      {isFriendListOpen && (
        <div className={styles.friendList__box}>
          <h2>Friend List</h2>
          <div>
            <input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          <div>
            <h3>Search Results:</h3>
            {filteredUsers.map((user) => (
              <div key={user.id}>
                <span>{user.username}</span>
                <button onClick={() => handleAddFriend(user.username)}>Add</button>
              </div>
            ))}
          </div>
          <div>
            <h3>Your Friends:</h3>
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div key={friend.id}>
                  <span>
                    {friend.friend.username} (Status:{" "}
                    {friend.friend.status ? "Online" : "Offline"})
                  </span>
                  <button
                    onClick={() => handleRemoveFriend(friend.friend.username)}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p>No friends found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendList;
