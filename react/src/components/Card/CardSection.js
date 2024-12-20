import React from 'react'
import scss from './CardSection.module.scss'

function CardSection(props) {
	const {title, children} = props;

	return (
		<div className={scss.section}>
			<div className={scss.title}>
				<h3>{title}</h3>
			</div>
			<div className={scss.body}>
				{children}
			</div>
		</div>
	);
}

export default CardSection;