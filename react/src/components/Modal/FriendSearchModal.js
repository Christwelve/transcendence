import React, {useRef, useState, useEffect} from 'react'
import Modal from './Modal'
import CardSection from '../Card/CardSection'
import FriendList from '../Friends/FriendList'
import scss from './FriendSearchModal.module.scss'
import Cookies from 'js-cookie'

function FriendSearchModal(props) {
	const {data, updateModal, closeModal} = props;
	const {name} = data;

	const [users, setUsers] = useState([]);
	const [searchMessage, setSearchMessage] = useState("");

	const ref = useRef(null);

	const handleSearch = async searchQuery => {

		if(!searchQuery) {
			setSearchMessage("");
			setUsers([]);
			return;
		}

		try {
			const response = await fetchWithCredentials(`http://localhost:8000/api/user/search/?query=${searchQuery}`, "GET", {
							headers: {
								'Authorization': `Bearer ${Cookies.get('jwtToken')}`,
							},
						});
			const data = await response.json();

			if (data.detail) {
				setSearchMessage(data.detail);
				setUsers([]);
			} else {
				setSearchMessage("");
				setUsers(data.users || []);
			}
		} catch (error) {
			console.error("Error searching users:", error);
			setSearchMessage("An error occurred while searching. Please try again.");
			setUsers([]);
		}
	};

	const addFriend = async username => {

		console.log(username);

		try {
			const response = await fetchWithCredentials("http://localhost:8000/api/friend/add/", "POST", {
				headers: {
					"Content-Type": "application/json",
					'Authorization': `Bearer ${Cookies.get('jwtToken')}`,
				},
				body: JSON.stringify({ username }),
			});

			if (response.ok)
				closeModal('added');

		} catch (error) {
			console.error("Error adding friend:", error);
		}
	};

	useEffect(() => {
		handleSearch(name);
	}, [name]);

	useEffect(() => {
		ref.current.focus();
	}, []);

	const message = <div className={scss.message}>{searchMessage || "Enter username to search."}</div>;
	const content = users.length ? <FriendList friends={users} addFriend={addFriend} /> : message;

	return (
		<Modal title='Search Friends' onClose={closeModal}>
			<div>
				<CardSection title='Name'>
					<input className={scss.name} onChange={() => updateModal('name', ref.current.value)} ref={ref} defaultValue={name} />
				</CardSection>
				<CardSection title='Results'>
					{content}
				</CardSection>
			</div>
		</Modal>
	);
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

export default FriendSearchModal;
