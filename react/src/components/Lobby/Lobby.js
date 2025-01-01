import React, {useState} from 'react'
import RoomList from '../RoomList/RoomList'
import Room from '../Room/Room'
import Friends from '../Friends/Friends'
import Statistics from '../Statistics/Statistics'
import scss from './Lobby.module.scss'
import { showToast } from '../Toast/ToastPresenter'
import { useDataContext } from '../../context/DataContext'

const data = [
{
	"tournamentId": null,
	"matches": [
		{
			"matchId": 1,
			"started": "2024-12-31T17:56:46.716Z",
			"ended": "2024-12-31T17:57:03.298Z",
			"prematureEnd": false,
			"scores": [
				{
					"username": "gbohm",
					"scored": 0,
					"received": 2
				},
				{
					"username": "gbohm",
					"scored": 1,
					"received": 0,
					"won": true
				},
				{
					"username": "gbohm",
					"scored": 0,
					"received": 2,
				},
				{
					"username": "gbohm",
					"scored": 1,
					"received": 0,
					"left": "2024-12-31T17:56:03.298Z",

				}
			]
		}
	]
},
{
	"tournamentId": 1,
	"matches": [
		{
			"matchId": 2,
			"started": "2024-12-31T17:58:56.580Z",
			"ended": "2024-12-31T17:59:17.736Z",
			"prematureEnd": false,
			"scores": [
				{
					"username": "gbohm",
					"scored": 1,
					"received": 1
				},
				{
					"username": "gbohm",
					"scored": 1,
					"received": 1
				}
			]
		},
		{
			"matchId": 2,
			"started": "2024-12-31T17:58:56.580Z",
			"ended": "2024-12-31T17:59:17.736Z",
			"prematureEnd": false,
			"scores": [
				{
					"username": "gbohm",
					"scored": 1,
					"received": 1
				},
				{
					"username": "gbohm",
					"scored": 1,
					"received": 1
				}
			]
		},
		{
		"matchId": 2,
		"started": "2024-12-31T17:58:56.580Z",
		"ended": "2024-12-31T17:59:17.736Z",
		"prematureEnd": false,
		"scores": [
			{
				"username": "gbohm",
				"scored": 1,
				"received": 1
			},
			{
				"username": "gbohm",
				"scored": 1,
				"received": 1
			}
		]
	}
	]
},
{
	"tournamentId": null,
	"matches": [
		{
			"matchId": 1,
			"started": "2024-12-31T17:56:46.716Z",
			"ended": "2024-12-31T17:57:03.298Z",
			"prematureEnd": false,
			"scores": [
				{
					"username": "gbohm",
					"scored": 0,
					"received": 2
				},
				{
					"username": "gbohm",
					"scored": 1,
					"received": 0
				}
			]
		}
	]
},
{
	"tournamentId": 1,
	"matches": [
		{
			"matchId": 2,
			"started": "2024-12-31T17:58:56.580Z",
			"ended": "2024-12-31T17:59:17.736Z",
			"prematureEnd": false,
			"scores": [
				{
					"username": "gbohm",
					"scored": 1,
					"received": 1
				},
				{
					"username": "gbohm",
					"scored": 1,
					"received": 1
				}
			]
		}
	]
}
];

function Lobby() {
	const [selectedFriend, setSelectedFriend] = useState(null);

	const {getPlayer} = useDataContext();

	const player = getPlayer();

	const playerStats = useMemo(() => getStatistics(player.id), [player.id]);
	const friendStats = useMemo(() => getStatistics(selectedFriend), [selectedFriend]);

	return (
		<div className={scss.lobby}>
			<div className={scss.top}>
				<RoomList />
				<Room />
			</div>
			<div className={scss.bottom}>
					<Friends />
					<Statistics title='Friend' data={playerStats} />
					<Statistics title='You' data={friendStats} />
			</div>
		</div>
	)
}

// helper functions
async function getStatistics(tid) {
	try {
		const response = await fetch(`http://localhost:8000/api/statistics?userId=${tid}`);
		const data = await response.json();
		return data;
	}
	catch (error) {
		showToast({type: 'warning', title: 'Warning', message: 'Failed to get statistics.'});
	}
}

export default Lobby;
