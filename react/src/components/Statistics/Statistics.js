import React from 'react'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import cls from '../../utils/cls'
import scss from './Statistics.module.scss'
import Icon from '../Icon/Icon'

function DateTime(props) {
	const {iso} = props;

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
	const {start, end} = props;

	const startDate = new Date(start).getTime();
	const endDate = new Date(end).getTime();
	const duration = formatDuration(endDate - startDate);

	return (
		<div className={scss.duration}>{duration}</div>
	);
}

function Player(props) {
	const {username, scored, received, left, won, matchEnd} = props;

	const endTime = new Date(matchEnd).getTime();
	const leftTime = new Date(left).getTime();

	const leftEarly = endTime - leftTime > 3000;

	console.log(endTime - leftTime);


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
	const {matchId, started, ended, prematureEnd, scores} = props;

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
			<div className={cls(scss.players, scss.body)}>
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
	const {children} = props;

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
	const {tournamentId, matches} = props;

	return (
		<div className={scss.tournament}>
			<div className={scss.header}>
				<div className={scss.name}>Tournament</div>
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
	const {data} = props;

	return (
		<div className={scss.history}>
			<div className={scss.scroll}>
				{
					data.map(({tournamentId, matches}, i) => (
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
	const {title, data} = props;

	return (
		<Card title={title} classes={scss.statistics}>
			<CardSection title='Wins/Losses'>

			</CardSection>
			<CardSection title='Match History'>
				<MatchHistory data={data} />
			</CardSection>
		</Card>
	);
};

// helper functions
function getComponent(tournamentId, matches) {
	if(tournamentId == null)
		return <Match {...matches[0]} />;

	return <Tournament tournamentId={tournamentId} matches={matches} />;
}

function formatDuration(duration) {
	const totalSeconds = Math.floor(duration / 1000);

	if(totalSeconds < 60)
		return `${totalSeconds}s`;

	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m${seconds}s`;
}


export default Statistics;
