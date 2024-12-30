import React from 'react'
import Icon from '../Icon/Icon'
import cls from '../../utils/cls'
import scss from './FriendList.module.scss'

function FriendList(props) {
	const {friends, addFriend, removeFriend} = props;

	return (
		friends.map(friend => (
			<div key={friend.id || friend.username} className={scss.friend}>
				<div className={scss.info}>
					<div className={scss.name}>{friend.username}</div>
					{friend.status != null && <div className={scss.status}>{friend.status ? "Online" : `Last seen ${adjustLastOnline(friend.last_online)}`}</div>}
				</div>
				<div className={cls(scss.icon, scss.add, addFriend && scss.show)}>
					<Icon type='plus' size='18' title='Add Friend' onClick={() => addFriend(friend.username)} />
				</div>
				<div className={cls(scss.icon, scss.remove, removeFriend && scss.show)}>
					<Icon type='remove' size='18' title='Remove Friend' onClick={() => removeFriend(friend.username)} />
				</div>
			</div>
		))
	);
}

// helper functions
function adjustLastOnline(lastOnline) {
	const now = new Date();
	const lastOnlineDate = new Date(lastOnline);
	const difference = now - lastOnlineDate;

	if (difference < 60 * 1000) return "<1m ago";
	if (difference < 60 * 60 * 1000) return `${Math.floor(difference / (60 * 1000))}m ago`;
	if (difference < 24 * 60 * 60 * 1000) return `${Math.floor(difference / (60 * 60 * 1000))}h ago`;
	if (difference < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(difference / (24 * 60 * 60 * 1000))}d ago`;
	if (difference < 365 * 24 * 60 * 60 * 1000) return `${Math.floor(difference / (7 * 24 * 60 * 60 * 1000))}w ago`;
	return `${Math.floor(difference / (365 * 24 * 60 * 60 * 1000))}y ago`;
};

export default FriendList;