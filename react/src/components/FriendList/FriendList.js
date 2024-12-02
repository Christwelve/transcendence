import React, { useState, useEffect } from 'react';
import styles from './FriendList.module.scss';

const FriendList = () => {
  const [friends, setFriends] = useState([]); // Current friend list
  const [searchQuery, setSearchQuery] = useState(''); // Search input
  const [filteredUsers, setFilteredUsers] = useState([]); // Search results
  const [isFriendListOpen, setIsFriendListOpen] = useState(false); // Friend list toggle

  // Fetch the list of friends from the API
  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/friend/');
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
			setFriends([]);
    }
  };

  // Search for users by username
  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/user/search/?query=${searchQuery}`);
      const data = await response.json();
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
			setFilteredUsers([]);
    }
  };

  // Add a friend
  const handleAddFriend = async (username) => {
    try {
      const response = await fetch('http://localhost:8000/api/friend/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        alert(`${username} added successfully!`);
        fetchFriends();
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  // Remove a friend
  const handleRemoveFriend = async (username) => {
    try {
      const response = await fetch('http://localhost:8000/api/friend/remove/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        alert(`${username} removed successfully!`);
        fetchFriends();
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
		<div className={styles.friendList}>
  		<button
    		className={styles.friendList__toggle}
    		onClick={() => setIsFriendListOpen((prev) => !prev)}
  		>
    		{isFriendListOpen ? 'Close Friend List' : 'Open Friend List'}
  		</button>
  		{isFriendListOpen && (
    		<div className={styles.friendList__box}>
      		<h2>Friend List</h2>
      		<div className={styles.friendList__search}>
        		<input
          		type="text"
          		placeholder="Search for users..."
          		value={searchQuery}
          		onChange={(e) => setSearchQuery(e.target.value)}
        		/>
        		<button onClick={handleSearch}>Search</button>
      		</div>
      		<div className={styles.friendList__results}>
        		<h3>Search Results:</h3>
        		{filteredUsers.map((user) => (
          		<div key={user.id} className={styles.friendList__user}>
            		<span>{user.username}</span>
            		<button onClick={() => handleAddFriend(user.username)}>Add</button>
          		</div>
        		))}
      		</div>
      		<div className={styles.friendList__friends}>
  					<h3>Your Friends:</h3>
  					{friends.length > 0 ? (
    					friends.map((friend) => (
      					<div key={friend.id} className={styles.friendList__friend}>
        					{}
        					<span>
          					{friend.friend.username} (Status: {friend.friend.status ? 'Online' : 'Offline'})
        					</span>
        					<button
          					onClick={() => handleRemoveFriend(friend.friend.username)}
          					className="remove"
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
