import React from 'react'

const lookup = {
	plus: [
		<line key="plus_0" x1="12" y1="5" x2="12" y2="19" />,
		<line key="plus_1" x1="5" y1="12" x2="19" y2="12" />
	],
	check: [
		<polyline key="check_0" points="20 6 9 17 4 12" />
	],
	chevron_left: [
		<polyline key="chevron_left_0" points="15 18 9 12 15 6" />
	],
	award: [
		<circle key="award_0" cx="12" cy="8" r="7" />,
		<polyline key="award_1" points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
	],
	success: [
		<polyline key="success_0" points="20 6 9 17 4 12" />
	],
	warning: [
		<path key="warning_0" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>,
		<line key="warning_1" x1="12" y1="9" x2="12" y2="13"/>,
		<line key="warning_2" x1="12" y1="17" x2="12.01" y2="17"/>
	],
	error: [
		<circle key="error_0" cx="12" cy="12" r="10"/>,
		<line key="error_1" x1="15" y1="9" x2="9" y2="15"/>,
		<line key="error_2" x1="9" y1="9" x2="15" y2="15"/>
	],
};

function Icon(props) {
	const { type, size = 24, classes } = props;

	return (
		<svg xmlns="http://www.w3.org/2000/svg" className={classes || ''} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			{lookup[type]}
		</svg>
	);
}

export default Icon;