import React from 'react'
import cls from '../../utils/cls'
import scss from './Card.module.scss'

function Card(props) {
	const {title, action, classes, children} = props;

	return (
		<div className={cls(scss.card, classes)}>
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