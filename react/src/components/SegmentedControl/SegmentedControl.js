import React from 'react'
import cls from '../../utils/cls'
import scss from './SegmentedControl.module.scss'

function SegmentedControl(props) {
	const {labels, values, property, selected, onChange} = props;

	const buttons = labels.map((label, index) => {

		const value = values[index] ?? label
		const isSelected = value == selected;

		return (
			<button key={index} className={cls(scss.segment, isSelected && scss.active)} onClick={() => onChange(property, value)}>{label}</button>
		);
	});

	return (
		<div className={scss.control}>
			{buttons}
		</div>
	);
}

export default SegmentedControl;