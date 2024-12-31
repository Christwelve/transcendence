import React from 'react'
import Card from '../Card/Card'
import CardSection from '../Card/CardSection'
import cls from '../../utils/cls'
import scss from './Statistics.module.scss'


function Statistics(props) {
	const {title, data} = props;

	return (
		<Card title={title}>
			<CardSection title='Wins/Losses'>

			</CardSection>
			<CardSection title='Match History'>

			</CardSection>
		</Card>
	);
};

export default Statistics;
