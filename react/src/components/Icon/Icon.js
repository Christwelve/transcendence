import React from 'react'

const lookup = {
	plus: [
		<line x1="12" y1="5" x2="12" y2="19" />,
		<line x1="5" y1="12" x2="19" y2="12" />
	],
	check: [
		<polyline points="20 6 9 17 4 12" />
	],
	chevron_left: [
		<polyline points="15 18 9 12 15 6" />
	],
	award: [
		<circle cx="12" cy="8" r="7" />,
		<polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
	]
};

function Icon(props) {
	const {type, size = 24, classes} = props;

	return (
		<svg xmlns="http://www.w3.org/2000/svg" className={classes || ''} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			{lookup[type]}
		</svg>
	);
}

export default Icon;