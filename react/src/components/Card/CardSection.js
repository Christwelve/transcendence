import React from 'react'
import cls from '../../utils/cls'
import scss from './CardSection.module.scss'

function CardSection(props) {
	const {title, classes, children} = props;

	return (
		<div className={scss.section}>
			<div className={scss.title}>
				<h3>{title}</h3>
			</div>
			<div className={cls(scss.body, classes)}>
				{children}
			</div>
		</div>
	);
}

export default CardSection;