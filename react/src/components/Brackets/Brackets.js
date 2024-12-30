import React from 'react'
import { useDataContext } from '../../context/DataContext'
import cls from '../../utils/cls'
import padNumber from '../../utils/padNumber'
import scss from './Brackets.module.scss'

function Player(props) {
	const { player, score, stage, won } = props;

	const { getPlayerById } = useDataContext();

	const playerData = getPlayerById(player) ?? {};

	const isWaiting = stage === 0;
	const isPlaying = stage === 1;
	const isFinished = stage === 2;

	return (
		<div className={cls(scss.player, isWaiting && scss.waiting, isPlaying && scss.playing, isFinished && scss.finished, won && scss.winner)}>
			<div className={scss.name}>{playerData.name ?? 'N/A'}</div>
			<div className={scss.score}>{padNumber(score.scored, 2)}</div>
		</div>
	);
}

function Pairs(props) {
	const { stage, players, scores, winner } = props.pair;
	const [player1, player2] = players;
	const [score1, score2] = scores;

	return (
		<div className={cls(scss.pair, stage === 1 && scss.pulse)}>
			<Player player={player1} score={score1} stage={stage} won={player1 === winner} />
			<Player player={player2} score={score2} stage={stage} won={player2 === winner} />
		</div>
	);
}

function Groups(props) {
	const { groups } = props;

	return (
		<div className={scss.group}>
			{groups.map((pair, i) => <Pairs key={i} pair={pair} />)}
		</div>
	);
}

function Brackets(props) {
	const {tournament} = props;
	const {getPlayerById} = useDataContext();

	if(tournament == null)
		return null;

	const {brackets, bracketIndex, matchIndex, announceNext, winner} = tournament;

	const bracket = brackets[bracketIndex];
	const match = bracket[matchIndex];
	const player1 = getPlayerById(match.players[0]);
	const player2 = getPlayerById(match.players[1]);

	const winningPlayer = getPlayerById(winner);

	return (
		<div className={scss.wrapper}>
			<div className={cls(scss.banner, announceNext && scss.show)}>
				<div className={scss.title}>Next Match</div>
				<div className={scss.message}>
					<div className={cls(scss.name, scss.red)}>{player1?.name || 'N/A'}</div>
					<div className={scss.vs}>vs</div>
					<div className={cls(scss.name, scss.green)}>{player2?.name || 'N/A'}</div>
				</div>
			</div>
			<div className={cls(scss.banner, winner && scss.show)}>
				<div className={scss.title}>Winner</div>
				<div className={scss.message}>
					<div className={cls(scss.name, scss.primary)}>{winningPlayer?.name || 'N/A'}</div>
				</div>
			</div>
			<div className={scss.brackets}>
				{brackets.map((groups, i) => <Groups key={i} groups={groups} />)}
			</div>
		</div>
	);
}

export default Brackets;