import React, {useRef} from 'react'
import Card from '../Card/Card'
import Icon from '../Icon/Icon'
import scss from './Modal.module.scss'

function Modal(props) {
	const {title, onClose, children} = props;

	const ref = useRef(null);

	const onClick = event => {
		if(event.target !== ref.current)
			return;

		onClose();
	}

	const closeAction = (
		<div className={scss.close} onClick={onClose}>
			<Icon type='plus' size='18' />
		</div>
	);

	return (
		<div className={scss.backdrop} onClick={onClick} ref={ref}>
			<div className={scss.modal}>
				<Card title={title} action={closeAction}>
					{children}
				</Card>
			</div>
		</div>
	)
}

export default Modal;