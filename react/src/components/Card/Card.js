import React from 'react'
import scss from './Card.module.scss'

function Card(props) {
	const {title, action, children} = props;

	return (
		<div className={scss.card}>
			<div className={scss.title}>
				<h2>{title}</h2>
				{action}
			</div>
			<div className={scss.body}>
				{children}
			</div>
		</div>
	);
}

export default Card;