import React from 'react'
import {updateModalList} from '../components/ModalPresenter';

let modalIdCounter = 0;
const modals = new Map();

async function showModal(Component, defaultValues = {}) {
	return new Promise(resolve => {
		const id = modalIdCounter++;
		const data = {...defaultValues};

		const modal = {
			Component,
			data,
			resolve,
			element: null,
		};

		modals.set(id, modal);

		createModalElement(id);
		pushModalList();
	});
}

// helper functions
function createModalElement(id) {
	const modal = modals.get(id);
	const {Component, data} = modal;

	const element = <Component key={id} data={data} updateModal={updateModal.bind(null, id)} closeModal={closeModal.bind(null, id)} />

	modal.element = element;
}

function updateModal(id, key, value) {
	const {data} = modals.get(id);

	data[key] = value;

	createModalElement(id);
	pushModalList();
}

function closeModal(id, action = 'close') {
	const {data, resolve} = modals.get(id);

	modals.delete(id);

	pushModalList();

	resolve([action, data]);
}

function pushModalList() {
	const modalList = [...modals.values()].map(({element}) => element);

	updateModalList(modalList);
}

export default showModal;