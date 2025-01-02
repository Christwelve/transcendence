import React, {useState, useMemo} from 'react'
import RoomList from '../RoomList/RoomList'
import Room from '../Room/Room'
import Friends from '../Friends/Friends'
import Statistics from '../Statistics/Statistics'
import scss from './Lobby.module.scss'
import { showToast } from '../Toast/ToastPresenter'
import { useDataContext } from '../../context/DataContext'

function Lobby() {
	const [selectedFriend, setSelectedFriend] = useState(null);
	const [playerStats, setPlayerStats] = useState([]);
	const [friendStats, setFriendStats] = useState([]);

	const {getPlayer} = useDataContext();

	const player = getPlayer();

	useMemo(() => getStatistics(player.tid, setPlayerStats), [player.tid]);
	useMemo(() => getStatistics(selectedFriend, setFriendStats), [selectedFriend]);

	console.log('playerStats', playerStats);

	return (
		<div className={scss.lobby}>
			<div className={scss.top}>
				<RoomList />
				<Room />
			</div>
			<div className={scss.bottom}>
					<Friends selected={[selectedFriend, setSelectedFriend]} />
					<Statistics title='Friend' data={friendStats} tid={selectedFriend} />
					<Statistics title='You' data={playerStats} tid={player.tid} />
			</div>
		</div>
	)
}

// helper functions
async function getStatistics(tid, setStats) {
	if(tid == null)
		return setStats([]);

	try {
		const response = await fetch(`http://localhost:8000/api/statistics?userId=${tid}`);
		const data = await response.json();

		setStats(data);
	}
	catch (error) {
		showToast({type: 'warning', title: 'Warning', message: 'Failed to get statistics.'});
		setStats([]);
	}
}

export default Lobby;
