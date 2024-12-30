import React, { useRef, useEffect, useState, forwardRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
// import * as THREE from 'three'
// import {Text} from '@react-three/drei'
import { useDataContext } from '../../context/DataContext'
import { ClientTick } from 'shared/tick'
import sizes from 'shared/sizes'
import colors from 'shared/colors'
import { getCuboids } from 'shared/cuboids'
import cls from '../../utils/cls'
import padNumber from '../../utils/padNumber'
import scss from './Game.module.scss'

const keysDown = {};

const Cuboid = forwardRef((props, ref) => {
	const { size, color } = props;

	return (
		<mesh {...props} ref={ref} >
			<boxGeometry args={size} />
			<meshStandardMaterial color={color ?? '#fff'} />
		</mesh>
	);
});

function ResizeListener() {
	const { camera, gl } = useThree();

	useEffect(() => {
		const onResize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			camera.aspect = width / height;
			camera.updateProjectionMatrix();

			gl.setSize(width, height);
		};

		window.addEventListener('resize', onResize);

		onResize();

		return () => window.removeEventListener('resize', onResize);

	}, [camera, gl]);

	return null;
}

function CameraLookAt(props) {
	const { playerIndex } = props;
	const { camera } = useThree();

	useEffect(() => {
		const multiplier = playerIndex % 2 === 0 ? -1 : 1;
		const distance = sizes.boardSize * 1.5;
		const axis = playerIndex > 1 ? 'x' : 'z';
		const position = playerIndex === -1 ? 0 : distance * multiplier;

		camera.position.set(0, sizes.boardSize / 1.5, 0);
		camera.position[axis] = position;

		const targetPosition = [0, 0, 0];
		camera.lookAt(...targetPosition);

	}, [camera, playerIndex]);

	return null;
}

function TickHandler(props) {
	const { paddleRefs, ballRef, goalRef, timeRef, countdownState, setGoalScored, setWinners } = props;

	const {getPlayer, getRoom, useListener, requestServerTick, requestTickAdjust, sendPlayerEvent} = useDataContext();

	const tickRef = useRef(null);
	const roomRef = useRef(null);
	const lastRef = useRef(null);

	const player = getPlayer();
	const room = getRoom(player.roomId);

	roomRef.current = room;

	tickRef.current?.setPlayerIds(room.activePlayers);

	const callback = tick => {
		const room = roomRef.current;

		handleInput(tick, sendPlayerEvent);
		updateEnemyPositions(tick);
		tick.moveBall(room.activePlayers);

		const seconds = Math.ceil(room.timer / 60);
		const minutes = Math.floor(seconds / 60);

		if(timeRef.current)
			timeRef.current.textContent = room.timer ? `${padNumber(minutes, 2)}:${padNumber(seconds % 60, 2)}` : '';

		if (room.running && room.timer > 0)
			room.timer--;
	};

	useEffect(() => {
		// TODO: change to reflect actually playing players in tournament mode
		const tick = new ClientTick(player, callback);

		tickRef.current = tick;

		const interval = setInterval(requestTickAdjust.bind(null, tick), 50);

		requestServerTick();

		return () => {
			tick.detach();

			clearInterval(interval);
		}
	}, []);

	useFrame((state, delta) => {
		const tick = tickRef.current;
		const last = lastRef.current;

		const time = state.clock.getElapsedTime();

		if(last != null && time - last > 1000)
			requestServerTick();

		renderPaddles(tick, paddleRefs);
		renderBall(tick, ballRef);
		renderGoal(tick, goalRef, delta);
		renderCountdown(tick, countdownState);

		lastRef.current = time;
	});

	useListener('player.index', index => {
		const tick = tickRef.current;

		tick.setPlayerIndex(index);
	});

	useListener('packet.dropped', id => {
		const tick = tickRef.current;

		tick.handleDroppedPacket(id);
	});

	useListener('game.tick', (type, value) => {
		const tick = tickRef.current;
		const fn = type === 'set' ? tick.setTick : tick.adjustTick;

		fn.call(tick, value);
	});

	useListener('game.update', payload => {
		const [tickServer, verifiedEventId, verifiedPositions] = payload;

		const tick = tickRef.current;

		verifiedPositions.forEach((position, i) => {
			if (tick.isPlayerIndex(i)) {
				tick.clearOldHistory(verifiedEventId);
				tick.reconcilePosition(position);
			} else {
				const data = {
					playerIndex: i,
					position,
				};

				tick.queueUpdate('position', tickServer, data);
			}
		});
	});

	useListener('ball.collision', (tickServer, verifiedBallData) => {
		const tick = tickRef.current;

		tick.reconcileBall(tickServer, verifiedBallData);
	});

	useListener('round.start', (countdown, direction) => {
		const tick = tickRef.current;

		tick.roundStart(countdown, direction);
	});

	useListener('goal', payload => {
		const { goal, direction } = payload;
		const tick = tickRef.current;

		setGoalScored(goal);

		const mesh = goalRef.current;
		const [x, z] = tick.getBallPosition();
		mesh.position.set(x, 0, z);
		mesh.material.color.set(colors[goal.scorer + 1]);
		mesh.timer = 500;

		tick.stopBall();

		setTimeout(() => {
			setGoalScored(null);

			const room = roomRef.current;

			if(room.running)
				setTimeout(() => tick.roundStart(0, direction), 500);
			else {
				const maxScore = room.scores.reduce((acc, {scored}) => Math.max(acc, scored), 0);

				const winners = room.activePlayers.filter((_, i) => room.scores[i].scored === maxScore).filter(player => player);

				setWinners(winners);
			}

		}, 2500);
	});
}

function handleInput(tick, sendPlayerEvent) {
	if (tick.getPlayerIndex() === -1)
		return;

	const left = isKeyDown('KeyA');
	const right = isKeyDown('KeyD');

	if (!(left || right))
		return;

	const input = right - left;

	tick.applyInput(input);

	const event = tick.createHistoryEvent('input', input);

	sendPlayerEvent(event);
}

function updateEnemyPositions(tick) {
	const entries = tick.extractQueueEntries('position');

	entries.forEach(entry => {
		const { playerIndex, position } = entry.data;

		tick.setPositionFor(playerIndex, position);
	});
}

function renderPaddles(tick, paddleRefs) {
	const positions = tick.getPositions();

	positions.forEach((value, i) => {
		const paddle = paddleRefs[i].current;

		if (paddle == null)
			return;

		const { position, axis } = paddle;

		position[axis] = value;
	});
}

function renderBall(tick, ballRef) {
	const ball = ballRef.current;

	if (ball == null)
		return;

	const [x, z, dx, dz, lastHitIndex] = tick.getBallData();

	ball.position.set(x, 0, z);
	ball.material.color.set(colors[lastHitIndex + 1]);
}

function renderGoal(tick, goalRef, delta) {
	const goal = goalRef.current;

	if (goal == null)
		return;

	if (goal.timer <= 0) {
		goal.scale.set(0, 0, 0);
		goal.timer = 0;
		return;
	}

	const maxTimer = 500;
	const t = (maxTimer - goal.timer) / maxTimer;
	const scale = 50 * t;

	goal.scale.set(scale, 1, scale);
	goal.material.opacity = 1 - t;

	goal.timer -= delta * 1000;
}

function renderCountdown(tick, countdownState) {
	const [countdown, setCountdown] = countdownState;
	const seconds = tick.getCountdownSeconds();

	if (countdown === seconds)
		return;

	setCountdown(seconds);
}

function onKeyAction(event) {
	const { type, code } = event;

	keysDown[code] = type === 'keydown';
}

function isKeyDown(code) {
	return +!!keysDown[code];
}

function getScoreDisplay(room, getPlayerById, highlightWinners) {
	const { activePlayers } = room;

	const maxScore = highlightWinners ? room.scores.reduce((acc, { scored }) => Math.max(acc, scored), 0) : -1;

	return activePlayers.reduce((acc, id, i) => {
		if (id == null)
			return acc;

		const player = getPlayerById(id);
		const colorClass = scss[`c${i + 1}`];
		const { scored, received } = room.scores[i];
		const fade = scored < maxScore;

		return [
			...acc,
			<div key={i} className={cls(scss.score, colorClass, highlightWinners && scss.highlight, fade && scss.fade)}>
				<div className={scss.name}>{player.name}</div>
				<div className={scss.value}>
					<span className={scss.scored}>{padNumber(scored, 2)}</span>
					<span className={scss.divider}>/</span>
					<span className={scss.received}>{padNumber(received, 2)}</span>
				</div>
			</div>
		];

	}, []);
}

function Game(props) {

	const [countdown, setCountdown] = useState(0);
	const [goalScored, setGoalScored] = useState(null);
	const [winners, setWinners] = useState(null);

	const { getPlayer, getPlayerById, getRoom } = useDataContext();

	const player = getPlayer();
	const room = getRoom(player.roomId);

	const paddleRefs = [
		useRef(null),
		useRef(null),
		useRef(null),
		useRef(null),
	];

	const ballRef = useRef(null);
	const goalRef = useRef(null);

	const timeRef = useRef(null);

	const scorerIndex = goalScored ? goalScored.scorer : null;
	const scorerName = goalScored ? getPlayerById(room.activePlayers[scorerIndex])?.name : null;
	const scorerColorClass = scss[`c${scorerIndex + 1}`];
	const targetIndex = goalScored ? goalScored.target : null;
	const targetName = goalScored ? getPlayerById(room.activePlayers[targetIndex])?.name : null;
	const targetColorClass = scss[`c${targetIndex + 1}`];

	const messageFumbled = (
		<>
			<span className={targetColorClass}>{targetName}</span>
			<span> fumbled the ball</span>
		</>
	);

	const messageScored = (
		<>
			<span className={scorerColorClass}>{scorerName}</span>
			<span> scored on </span>
			<span className={targetColorClass}>{targetName}</span>
		</>
	);

	const cuboids = getCuboids(room.activePlayers, paddleRefs, ballRef);

	const scores = getScoreDisplay(room, getPlayerById, !!winners);

	useEffect(() => {

		window.addEventListener('keydown', onKeyAction);
		window.addEventListener('keyup', onKeyAction);

		return () => {
			window.removeEventListener('keydown', onKeyAction);
			window.removeEventListener('keyup', onKeyAction);
		};
	}, []);

	return (
		<div className={scss.wrapper}>
			<Canvas
				className={scss.canvas}
				camera={{
					fov: 75,
					near: 0.1,
					far: 1000,
					position: [0, sizes.boardSize * 2, 0]
				}
				}>
				<ResizeListener />
				<CameraLookAt playerIndex={player.index} />
				<TickHandler paddleRefs={paddleRefs} ballRef={ballRef} goalRef={goalRef} timeRef={timeRef} countdownState={[countdown, setCountdown]} setGoalScored={setGoalScored} setWinners={setWinners} />
				<ambientLight intensity={Math.PI / 2} />
				<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
				<pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
				<mesh position={[0, -sizes.borderSize / 2, 0]} timer={0} ref={goalRef}>
					<cylinderGeometry args={[1, 1, 0.01, 128]} />
					<meshStandardMaterial transparent={true} />
				</mesh>
				{
					cuboids.map((cuboid, i) => <Cuboid key={i} {...cuboid} />)
				}
			</Canvas>
			<div className={cls(scss.ui, (countdown > 0 || goalScored || winners) && scss.darken)}>
				<div className={cls(scss.countdown, scss[`n${countdown}`])}>{countdown}</div>
				<div className={cls(scss.goal, goalScored && scss.show)}>
					<div className={cls(scss.title, scorerColorClass)}>GOAL!</div>
					<div className={scss.message}>{scorerIndex === -1 ? messageFumbled : messageScored}</div>
				</div>
				<div className={scss.time} ref={timeRef}></div>
				<div className={scss.scores}>
					{scores}
				</div>
				<div className={cls(scss.gameover, !winners && scss.hide)}>GAME OVER!</div>
			</div>
		</div>
	);
}

export default Game;