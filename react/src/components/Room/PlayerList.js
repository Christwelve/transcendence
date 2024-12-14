import React from 'react'
import cls from '../../utils/cls'
import scss from './PlayerList.module.scss'

function Player(props) {
	const {name, ready, isPlayer, isMaster} = props;

	return (
		<div className={cls(scss.player, ready && scss.ready, isPlayer && scss.current, isMaster && scss.master)}>
			<div className={scss.inner}>
				<div className={scss.name}>
					{name}
				</div>
				<div className={scss.icon}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check">
						<polyline className={scss.out} points="20 6 9 17 4 12" />
						<polyline className={scss.in} points="20 6 9 17 4 12" />
					</svg>
				</div>

			</div>
		</div>
	);
}

function PlayerList(props) {
	const {players, currentPlayer, masterId} = props;

	return (
		<div>
			{
				players.map(player => {

					const {id} = player;

					const isPlayer = id === currentPlayer.id;
					const isMaster = id === masterId;

					return (<Player key={id} {...player} isPlayer={isPlayer} isMaster={isMaster} />);
				})
			}
		</div>
	)
}

export default PlayerList;