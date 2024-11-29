import React, { useState, useEffect } from 'react';
import './FriendList.module.scss';

const FriendList = () => {
  const [friends, setFriends] = useState([]); // Current friend list
  const [searchQuery, setSearchQuery] = useState(''); // Search input
  const [filteredUsers, setFilteredUsers] = useState([]); // Search results

  // Fetch the list of friends from the API
  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends/');
      const data = await response.json();
      setFriends(data.friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // Search for users by username
  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/users/search?query=${searchQuery}`);
      const data = await response.json();
      setFilteredUsers(data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Add a friend
  const handleAddFriend = async (username) => {
    try {
      const response = await fetch('/api/friends/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        alert(`${username} added successfully!`);
        fetchFriends(); // Refresh the friend list
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  // Remove a friend
  const handleRemoveFriend = async (username) => {
    try {
      const response = await fetch('/api/friends/remove/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        alert(`${username} removed successfully!`);
        fetchFriends(); // Refresh the friend list
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  // Fetch friends when component loads
  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div className="friend-list">
      <h2>Friend List</h2>
      <div className="friend-list__search">
        <input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <div className="friend-list__results">
        <h3>Search Results:</h3>
        {filteredUsers.map((user) => (
          <div key={user.id} className="friend-list__user">
            <span>{user.username}</span>
            <button onClick={() => handleAddFriend(user.username)}>Add</button>
          </div>
        ))}
      </div>
      <div className="friend-list__friends">
        <h3>Your Friends:</h3>
        {friends.map((friend) => (
          <div key={friend.id} className="friend-list__friend">
            <span>{friend.username}</span>
            <button onClick={() => handleRemoveFriend(friend.username)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendList;
