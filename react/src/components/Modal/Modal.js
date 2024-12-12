import React, {useRef} from 'react'
import scss from './Modal.module.scss'

function Modal(props) {
	const {title, onClose, children} = props;

	const ref = useRef(null);

	const onClick = event => {
		if(event.target !== ref.current)
			return;

		onClose();
	}

	return (
		<div className={scss.backdrop} onClick={onClick} ref={ref}>
			<div className={scss.modal}>
				<div className={scss.header}>
					<div className={scss.title}>{title}</div>
					<div className={scss.close} onClick={onClose}>Close</div>
				</div>
				<div className={scss.body}>
					{children}
				</div>
			</div>
		</div>
	)
}

function RoomCreateModal(props) {
	const {data, updateModal, closeModal} = props;
	const {type, playersMax} = data;

	const ref = useRef(null);

	return (
		<Modal title='Create Room' onClose={closeModal}>
			<div>
				<div>
					<div>Name:</div>
					<input onChange={() => updateModal('name', ref.current.value)} ref={ref} defaultValue={data.name} />
				</div>
				<div>
					<button disabled={type === 0} onClick={() => updateModal('type', 0)}>Single</button>
					<button disabled={type === 1} onClick={() => updateModal('type', 1)}>Tournament</button>
				</div>
				<div>
					<button disabled={playersMax === 2} onClick={() => updateModal('playersMax', 2)}>2 Players</button>
					<button disabled={playersMax === 3} onClick={() => updateModal('playersMax', 3)}>3 Players</button>
					<button disabled={playersMax === 4} onClick={() => updateModal('playersMax', 4)}>4 Players</button>
				</div>
				<div>
					<button onClick={() => closeModal()}>Cancel</button>
					<button onClick={() => closeModal('confirm')}>Create</button>
				</div>
			</div>
		</Modal>
	);
}

export default RoomCreateModal;