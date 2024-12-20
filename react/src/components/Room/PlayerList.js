import React from 'react'
import Icon from '../Icon/Icon'
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
					<Icon type='award' size='14' classes={scss.award} />
					<Icon type='check' size='18' classes={scss.check} />
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