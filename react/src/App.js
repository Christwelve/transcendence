import React, {useEffect} from 'react'
import Page from './pages/Page'
import ModalPresenter from './components/ModalPresenter'
import './App.css'

function App() {
	// const fetchData = async () => {
	// 	const res = await fetch('http://localhost:8000/');
	// 	console.log(res);
	// };

	// useEffect(() => {
	// 	fetchData();
	// }, []);

	return (
		<>
			<Page />
			<ModalPresenter />
		</>
	);
}

export default App;
