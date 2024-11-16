import React, {useState} from 'react'
import scss from './ModalPresenter.module.scss'

let updateModalList = null;

function ModalPresenter() {
	const [modals, setModals] = useState([]);

	updateModalList = setModals;

	return (
		<div className={scss.modals}>
			{modals}
		</div>
	)
}

export default ModalPresenter;
export {updateModalList};