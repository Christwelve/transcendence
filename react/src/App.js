import React, {useEffect} from 'react'
import DataContextProvider from './components/DataContext'
import Page from './pages/Page'
import ModalPresenter from './components/ModalPresenter'
import {closeModalTop} from './utils/modal'
import './App.css'

function App() {
	// const fetchData = async () => {
	// 	const res = await fetch('http://localhost:8000/');
	// 	console.log(res);
	// };

	useEffect(() => {
		// fetchData();

		const onKeyDown = event => {
			if(event.code !== 'Escape')
				return;

			closeModalTop();
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);

	return (
		<DataContextProvider>
			<Page />
			<ModalPresenter />
		</DataContextProvider>
	);
}

export default App;
