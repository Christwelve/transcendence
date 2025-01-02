import React from 'react'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import cls from '../../utils/cls'
import scss from './Statistics.module.scss'
import Icon from '../Icon/Icon'

function DateTime(props) {
	const { iso } = props;

	const date = new Date(iso);
	const time = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		timeZone: 'CET'
	}).format(date);

	return (
		<div className={scss.datetime}>{time}</div>
	);
}

function Duration(props) {
	const { start, end } = props;

	const startDate = new Date(start).getTime();
	const endDate = new Date(end).getTime();
	const duration = formatDuration(endDate - startDate);

	return (
		<div className={scss.duration}>{duration}</div>
	);
}

function Player(props) {
	const { username, scored, received, left, won, matchEnd } = props;

	const endTime = new Date(matchEnd).getTime();
	const leftTime = new Date(left).getTime();

	const leftEarly = endTime - leftTime > 3000;

	return (
		<div className={cls(scss.player, leftEarly && scss.left, won && scss.won)}>
			<div className={scss.username}>{username}</div>
			<div className={scss.score}>
				<div className={scss.scored}>{scored}</div>
				<div className={scss.divider}>/</div>
				<div className={scss.received}>{received}</div>
			</div>
		</div>
	);
}

function Match(props) {
	const { matchId, started, ended, prematureEnd, scores } = props;

	return (
		<div className={scss.match} key={matchId}>
			<div className={scss.header}>
				<div className={scss.name}>Match</div>
				<div className={scss.time}>
					<Icon type='time' size={12} classes={scss.started} />
					<DateTime iso={started} />
					<Icon type='play' size={12} classes={scss.played} />
					<Duration start={started} end={ended} />
				</div>
			</div>
			<div className={cls(scss.players, scss.body, prematureEnd && scss.premature)}>
				{
					scores.map((player, i) => (
						<Player key={i} {...player} matchEnd={ended} />
					))
				}
			</div>
		</div>
	);
}

function Entry(props) {
	const { children } = props;

	return (
		<div className={scss.entry}>
			<div className={scss.segment}>
				<div className={cls(scss.line, scss.top)} />
				<div className={scss.dot} />
				<div className={cls(scss.line, scss.bottom)} />
			</div>
			<div className={scss.content}>
				{children}
			</div>
		</div>
	);
}

function Tournament(props) {
	const { tournamentId, matches } = props;

	// const started = matches[0].started;
	// const ended = matches[matches.length - 1].ended;

	return (
		<div className={scss.tournament}>
			<div className={scss.header}>
				<div className={scss.name}>Tournament</div>
				{/* <div className={scss.time}>
					<Icon type='time' size={12} classes={scss.started} />
					<DateTime iso={started} />
					<Icon type='play' size={12} classes={scss.played} />
					<Duration start={started} end={ended} />
				</div> */}
			</div>
			<div className={cls(scss.matches, scss.body)}>
				{
					matches.map((match, i) => (
						<Entry key={`${tournamentId}_${i}`}>
							<Match {...match} />
						</Entry>
					))
				}
			</div>
		</div>
	);
}


function MatchHistory(props) {
	const { data } = props;

	if (data.length === 0)
		return <div className={scss.nomatch}>No matches played yet.</div>;

	return (
		<div className={scss.history}>
			<div className={scss.scroll}>
				{
					data.map(({ tournamentId, matches }, i) => (
						<Entry key={i}>
							{getComponent(tournamentId, matches)}
						</Entry>
					))
				}
			</div>
		</div>
	);
}


function Statistics(props) {
	const { title, data, tid } = props;

	const { wins, losses } = getWinsAndLosses(data, tid);
	const total = wins + losses;

	return (
		<Card title={title} classes={scss.statistics}>
			{
				tid == null ?
					<div className={scss.empty}>Select a friend to view their statistics.</div> :
					<>
						<CardSection title='Wins/Losses'>
							<div className={scss.winloss}>
								<div className={scss.wins}>
									<div className={scss.label}>Wins</div>
									<div className={scss.value}>{wins}</div>
								</div>
								<div className={scss.track}>
									<div className={scss.progress} style={{ width: `${wins / total * 100}%` }}></div>
								</div>
								<div className={scss.losses}>
									<div className={scss.label}>Losses</div>
									<div className={scss.value}>{losses}</div>
								</div>
							</div>
						</CardSection>
						<CardSection title='Match History'>
							<MatchHistory data={data} />
						</CardSection>
					</>
			}
		</Card>
	);
};


// helper functions
function getComponent(tournamentId, matches) {
	if (tournamentId == null)
		return <Match {...matches[0]} />;

	return <Tournament tournamentId={tournamentId} matches={matches} />;
}

function formatDuration(duration) {
	const totalSeconds = Math.floor(duration / 1000);

	if (totalSeconds < 60)
		return `${totalSeconds}s`;

	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m${seconds}s`;
}

function getWinsAndLosses(data, tid) {
	const matches = data.flatMap(entry => entry.matches).filter(match => !match.prematureEnd);
	const scores = matches.flatMap(match => match.scores);
	const playerScores = scores.filter(score => score.tid === tid);

	const wins = playerScores.reduce((acc, score) => acc + +score.won, 0);
	const losses = playerScores.length - wins;

	return { wins, losses };
}


export default Statistics;
