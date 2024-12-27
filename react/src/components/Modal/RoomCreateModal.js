import React, {useRef, useEffect} from 'react'
import Modal from './Modal'
import CardSection from '../Card/CardSection'
import SegmentedControl from '../SegmentedControl/SegmentedControl'
import scss from './RoomCreateModal.module.scss'

const playersMaxSingle = [2, 3, 4];
const playersMaxTournament = [4, 8, 16];

function RoomCreateModal(props) {
	const {data, updateModal, closeModal} = props;
	const {name, type, playersMax, ai} = data;

	const ref = useRef(null);

	useEffect(() => {
		ref.current.focus();
	}, []);

	const onChangeType = (property, value) => {
		updateModal(property, value);

		if(value === 0)
			updateModal('playersMax', playersMaxSingle[0]);
		else
			updateModal('playersMax', playersMaxTournament[0]);
	};

	return (
		<Modal title='Create Room' onClose={closeModal} onConfirm={closeModal.bind(null, 'confirm')} confirmLabel='Create'>
			<div>
				<CardSection title='Name'>
					<input className={scss.name} onChange={() => updateModal('name', ref.current.value)} ref={ref} defaultValue={name} />
				</CardSection>
				<CardSection title='Type'>
					<SegmentedControl labels={['Single', 'Tournament']} values={[0, 1]} property='type' selected={type} onChange={onChangeType} />
				</CardSection>
				<CardSection title='Players'>
					{getPlayerMaxSelect(type, playersMax, updateModal)}
				</CardSection>
				<CardSection title='AI'>
					<SegmentedControl labels={['Disabled', 'Enabled']} values={[false, true]} property='ai' selected={ai} onChange={updateModal} />
				</CardSection>
			</div>
		</Modal>
	);
}

// helper functions
function getPlayerMaxSelect(type, playersMax, updateModal) {
	const values = type === 0 ? playersMaxSingle : playersMaxTournament;
	const labels = values.map(value => `${value} Players`);

	return <SegmentedControl labels={labels} values={values} property='playersMax' selected={playersMax} onChange={updateModal} />
}

export default RoomCreateModal;