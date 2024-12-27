import React, { useState, useEffect } from 'react'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import Icon from '../Icon/Icon'
import FriendList from './FriendList'
import FriendSearchModal from '../Modal/FriendSearchModal'
import scss from './Friends.module.scss'
import {showModal} from '../../utils/modal'
import {showToast} from '../Toast/ToastPresenter'

const FriendListOld = () => {
	const [friends, setFriends] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [searchMessage, setSearchMessage] = useState("");

	const fetchFriends = async () => {
		try {
			const response = await fetchWithCredentials("http://localhost:8000/api/friend/", "GET");
			const data = await response.json();
			setFriends(data.friends || []);
		} catch (error) {
			console.error("Error fetching friends:", error);
			setFriends([]);
		}
	};

	const adjustLastOnline = (lastOnline) => {
		const now = new Date();
		const lastOnlineDate = new Date(lastOnline);
		const difference = now - lastOnlineDate;

		if (difference < 60 * 1000) return "<1 min ago";
		if (difference < 60 * 60 * 1000) return `${Math.floor(difference / (60 * 1000))} m ago`;
		if (difference < 24 * 60 * 60 * 1000) return `${Math.floor(difference / (60 * 60 * 1000))} h ago`;
		if (difference < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(difference / (24 * 60 * 60 * 1000))} d ago`;
		if (difference < 365 * 24 * 60 * 60 * 1000) return `${Math.floor(difference / (7 * 24 * 60 * 60 * 1000))} w ago`;
		return `${Math.floor(difference / (365 * 24 * 60 * 60 * 1000))} y ago`;
	};

	const handleSearch = async () => {
		try {
			const response = await fetchWithCredentials(`http://localhost:8000/api/user/search/?query=${searchQuery}`, "GET");
			const data = await response.json();

			if (data.detail) {
				setSearchMessage(data.detail);
				setFilteredUsers([]);
			} else {
				setSearchMessage("");
				setFilteredUsers(data.users || []);
			}
		} catch (error) {
			console.error("Error searching users:", error);
			setSearchMessage("An error occurred while searching. Please try again.");
			setFilteredUsers([]);
		}
	};

	const handleAddFriend = async (username) => {
		try {
			const response = await fetchWithCredentials("http://localhost:8000/api/friend/add/", "POST", {
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username }),
			});

			if (response.ok) {
				fetchFriends();
				setSearchQuery("");
				setFilteredUsers([]);
			}
		} catch (error) {
			console.error("Error adding friend:", error);
		}
	};

	const handleRemoveFriend = async (username) => {
		try {
			const response = await fetchWithCredentials("http://localhost:8000/api/friend/remove/", "POST", {
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username }),
			});
			if (response.ok) {
				fetchFriends();
				setFilteredUsers((prevFilteredUsers) => [
					...prevFilteredUsers,
					{ username },
				]);
			}
		} catch (error) {
			console.error("Error removing friend:", error);
		}
	};

	useEffect(() => {
		fetchFriends();
	}, []);

	return (
		<div className={scss.friendList}>
				<div className={scss.friendList__box}>
					<h2>Friend List</h2>
					<div>
						<input
							type="text"
							placeholder="Search for users..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(event) => event.code === "Enter" && handleSearch()}
						/>
						<button onClick={handleSearch}>Search</button>
						{searchMessage && <p className={scss.searchMessage}>{searchMessage}</p>}
					</div>
					<div>
						<h3>Search Results:</h3>
						{filteredUsers.map((user) => (
							<div key={user.id || user.username}>
								<span>{user.username}</span>
								<button
									onClick={() => handleAddFriend(user.username)}
									disabled={friends.some((friend) => friend.friend.username === user.username)}
								>
									Add
								</button>
							</div>
						))}
					</div>
					<div>
						<h3>Your Friends:</h3>
						{friends.length > 0 ? (
							friends.map((friend) => (
								<div key={friend.id || friend.friend.username}>
									<span>
										{friend.friend.username} ({""}
										{friend.friend.status ? "Online" : `Last seen ${adjustLastOnline(friend.friend.last_online)}`})
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
		</div>
	);
};

function Friends() {
	const [friends, setFriends] = useState([]);

	const updateFriendsList = async () => {
		const friends = await fetchFriends();
		const restructured = friends.map(({id, friend}) => ({id, ...friend}));
		setFriends(restructured);
	};

	const onSearch = async () => {
		const [action] = await showModal(FriendSearchModal);

		if(action === "added")
			showToast({type: "success", title: "Friend Added", message: "Friend has been added successfully."});

		updateFriendsList();
	};

	const removeFriend = async username => {
		try {
			const response = await fetchWithCredentials("http://localhost:8000/api/friend/remove/", "POST", {
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username }),
			});
			if(response.ok) {
				showToast({type: "success", title: "Friend Removed", message: "Friend has been removed successfully."});
				updateFriendsList();
			}

		} catch (error) {
			console.error("Error removing friend:", error);
		}
	};

	useEffect(() => {
		updateFriendsList();
	}, []);

	const titleAction = (
		<div className={scss.search} title='Search Friends' onClick={onSearch}>
			<Icon type='search' size='12' />
		</div>
	);

	const friendsOnline = friends.filter(friend => friend.status);
	const friendsOffline = friends.filter(friend => !friend.status);

	return (
		<Card title='Friends' classes={scss.friends} action={titleAction}>
			{getFriendsComponent(friendsOnline, "Online", removeFriend)}
			{getFriendsComponent(friendsOffline, "Offline", removeFriend)}
			{friends.length === 0 && <div className={scss.mof}>No friends.. :(</div>}
		</Card>
	)
}

// helper functions
function fetchWithCredentials(path, method, extraOptions = {}) {
	const options = {
		method,
		credentials: "include",
		...extraOptions,
	};

	return fetch(path, options);
}

async function fetchFriends() {
	try {
		const response = await fetchWithCredentials("http://localhost:8000/api/friend/", "GET");
		const data = await response.json();
		return data.friends || [];
	} catch(error) {
		console.error("Error fetching friends:", error);
		return [];
	}
}

function getFriendsComponent(friends, title, removeFriend) {
	if(friends.length === 0)
		return null;

	return (
		<CardSection title={title} classes={scss.list}>
			<FriendList friends={friends} removeFriend={removeFriend} />
		</CardSection>
	);;
}

export default Friends;
