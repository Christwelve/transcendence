import React from 'react'
import {useDataContext} from '../DataContext/DataContext'
import cls from '../../utils/cls'
import padNumber from '../../utils/padNumber'
import scss from './Brackets.module.scss'

function Player(props) {
	const {player, score, stage, won} = props;

	const {getPlayerById} = useDataContext();

	const playerData = getPlayerById(player) ?? {};

	const isWaiting = stage === 0;
	const isPlaying = stage === 1;
	const isFinished = stage === 2;

	return (
		<div className={cls(scss.player, isWaiting && scss.waiting, isPlaying && scss.playing, isFinished && scss.finished, won && scss.winner)}>
			<div className={scss.name}>{playerData.name ?? 'N/A'}</div>
			<div className={scss.score}>{padNumber(score, 2)}</div>
		</div>
	);
}

function Pairs(props) {
	const {stage, players, scores, winner} = props.pair;
	const [player1, player2] = players;
	const [score1, score2] = scores;

	return (
		<div className={scss.pair}>
			<Player player={player1} score={score1} stage={stage} won={player1 === winner} />
			<Player player={player2} score={score2} stage={stage} won={player2 === winner} />
		</div>
	);
}

function Groups(props) {
	const {groups} = props;

	return (
		<div className={scss.group}>
			{groups.map((pair, i) => <Pairs key={i} pair={pair} />)}
		</div>
	);
}

function Brackets(props) {
	const {brackets} = props;

	return (
		<div className={scss.brackets}>
			{brackets.map((groups, i) => <Groups key={i} groups={groups} />)}
		</div>
	);
}

export default Brackets;