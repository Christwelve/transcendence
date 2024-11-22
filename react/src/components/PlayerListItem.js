import React from 'react'

function PlayerListItem(props) {
	const {name, ready, baseClasses} = props;

	return (
		<tr className={baseClasses}>
			<td>{name}</td>
			<td>{ready ? 'Ready' : ''}</td>
		</tr>
	);
}

export default PlayerListItem;