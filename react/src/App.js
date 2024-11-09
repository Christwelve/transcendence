import React, {useEffect} from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import HomePage from './pages/HomePage'
import PongPage from './pages/PongPage'
import './App.css'

function App() {
	const fetchData = async () => {
		const res = await fetch('http://localhost:8000/');
		console.log(res);
	};

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<Router>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/pong" element={<PongPage />} />
			</Routes>
		</Router>
	);
}

export default App;
