import React, { useEffect } from 'react'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import PlayerList from './PlayerList'
import Icon from '../Icon/Icon'
import { useDataContext } from '../../context/DataContext'
import cls from '../../utils/cls'
import scss from './Room.module.scss'

function Room() {

	const { getPlayer, getRoom, getPlayerListForRoom, leaveRoom, toggleReady, gameStart } = useDataContext();
	const currentPlayer = getPlayer();
	const room = getRoom(currentPlayer.roomId);

	useEffect(() => {
		const onKeydown = event => {
			const { target, code } = event;

			if (target !== document.body)
				return;

			const isMaster = currentPlayer.id === room?.masterId;

			if (code !== 'KeyR')
				return;

			if (isMaster)
				gameStart();
			else
				toggleReady();
		};

		window.addEventListener('keydown', onKeydown);

		return () => {
			window.removeEventListener('keydown', onKeydown);
		}

	}, [room]);

	if (room == null) {
		return (
			<Card title='Room'>
				<p className={scss.empty}>Create a room or click on an existing one to join it.</p>
			</Card>
		);
	}

	const playerList = getPlayerListForRoom(room.id);

	const isMaster = currentPlayer.id === room.masterId;
	const canStart = playerList.length >= 2 && playerList.filter(player => player.id !== room.masterId).every(player => player.ready);

	const readyButton = (<button className={cls(scss.primary, scss.ready, currentPlayer.ready && scss.highlight)} onClick={toggleReady}>Ready</button>);
	const startButton = (<button className={cls(scss.primary, scss.start, canStart && scss.highlight)} disabled={!canStart} onClick={gameStart}>Start</button>);

	return (
		<Card title={`Room · ${room.name}`}>
			<CardSection title='Players'>
				<PlayerList players={playerList} currentPlayer={currentPlayer} masterId={room.masterId} />
			</CardSection>
			<CardSection title='Controls'>
				<div className={scss.controls}>
					<div className={scss.leave} title='Leave Room' onClick={leaveRoom}>
						<Icon type='chevron_left' size='18' />
					</div>
					{isMaster ? startButton : readyButton}
				</div>
			</CardSection>
		</Card>
	);
}


export default Room;