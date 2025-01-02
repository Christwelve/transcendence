import React, { useState, useEffect } from 'react'
import { useDataContext } from '../../context/DataContext'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import Icon from '../Icon/Icon'
import FriendList from './FriendList'
import FriendSearchModal from '../Modal/FriendSearchModal'
import scss from './Friends.module.scss'
import Cookies from 'js-cookie'
import { showModal } from '../../utils/modal'
import { showToast } from '../Toast/ToastPresenter'
import { protocol, hostname } from '../../utils/scheme'


function Friends(props) {
	const { selected } = props;
	const { getStateId } = useDataContext();

	const [friends, setFriends] = useState([]);

	const stateId = getStateId();

	const updateFriendsList = async () => {
		const friends = await fetchFriends();
		const restructured = friends.map(({ friend }) => friend);
		setFriends(restructured);
	};

	const onSearch = async () => {
		const [action] = await showModal(FriendSearchModal);

		if (action === "added")
			showToast({ type: "success", title: "Friend Added", message: "Friend has been added successfully." });

		updateFriendsList();
	};

	const removeFriend = async username => {
		try {
			const response = await fetchWithCredentials(`${protocol}//${hostname}/api/friend/remove/`, "POST", {
				headers: {
					"Content-Type": "application/json",
					'Authorization': `Bearer ${Cookies.get('jwtToken')}`,
				},
				body: JSON.stringify({ username }),
			});
			if (response.ok) {
				showToast({ type: "success", title: "Friend Removed", message: "Friend has been removed successfully." });
				updateFriendsList();
			}

		} catch (error) {
			showToast({ type: "error", title: "Error", message: "Friend could not be removed." });
		}
	};

	useEffect(() => {
		updateFriendsList();
	}, [stateId]);

	const titleAction = (
		<div className={scss.search} title='Search Friends' onClick={onSearch}>
			<Icon type='search' size='12' />
		</div>
	);

	const friendsOnline = friends.filter(friend => friend.status);
	const friendsOffline = friends.filter(friend => !friend.status);

	return (
		<Card title='Friends' classes={scss.friends} action={titleAction}>
			{getFriendsComponent(friendsOnline, "Online", selected, removeFriend)}
			{getFriendsComponent(friendsOffline, "Offline", selected, removeFriend)}
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
		const response = await fetchWithCredentials(`${protocol}//${hostname}/api/friend/`, "GET", {
			headers: {
				'Authorization': `Bearer ${Cookies.get('jwtToken')}`,
			},
		});
		const data = await response.json();
		return data.friends || [];
	} catch (error) {
		showToast({ type: "error", title: "Error", message: "Could not fetch friends." });
		return [];
	}
}

function getFriendsComponent(friends, title, selected, removeFriend) {
	if (friends.length === 0)
		return null;

	return (
		<CardSection title={title} classes={scss.list}>
			<FriendList friends={friends} selected={selected} removeFriend={removeFriend} />
		</CardSection>
	);;
}

export default Friends;
