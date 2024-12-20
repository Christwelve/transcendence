import React, {useRef, useEffect} from 'react'
import Modal from './Modal'
import CardSection from '../Card/CardSection'
import SegmentedControl from '../SegmentedControl/SegmentedControl'
import scss from './RoomCreateModal.module.scss'

function RoomCreateModal(props) {
	const {data, updateModal, closeModal} = props;
	const {type, playersMax} = data;

	const ref = useRef(null);

	useEffect(() => {
		ref.current.focus();
	}, []);

	return (
		<Modal title='Create Room' onClose={closeModal}>
			<div>
				<CardSection title='Name'>
					<input className={scss.name} onChange={() => updateModal('name', ref.current.value)} ref={ref} defaultValue={data.name} />
				</CardSection>
				<CardSection title='Type'>
					<SegmentedControl labels={['Single', 'Tournament']} values={[0, 1]} property='type' selected={type} onChange={updateModal} />
				</CardSection>
				<CardSection title='Players'>
					<SegmentedControl labels={['2 Players', '3 Players', '4 Players']} values={[2, 3, 4]} property='playersMax' selected={playersMax} onChange={updateModal} />
				</CardSection>
				<div className={scss.actions}>
					<button className={scss.cancel} onClick={() => closeModal()}>Cancel</button>
					<button className={scss.create} onClick={() => closeModal('confirm')}>Create</button>
				</div>
			</div>
		</Modal>
	);
}

export default RoomCreateModal;