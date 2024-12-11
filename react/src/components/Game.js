import React, {useRef, useEffect, forwardRef} from 'react'
import {Canvas, useThree, useFrame} from '@react-three/fiber'
import {useDataContext} from './DataContext'
import {ClientTick} from 'shared/tick'
import sizes from 'shared/sizes'
import colors from 'shared/colors'
import {getCuboids} from 'shared/cuboids'

const keysDown = {};

const Cuboid = forwardRef((props, ref) => {
	const {size, color} = props;

	return (
		<mesh {...props} ref={ref} >
			<boxGeometry args={size} />
			<meshStandardMaterial color={color ?? '#fff'} />
		</mesh>
	);
});

function ResizeListener() {
	const {camera, gl} = useThree();

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

function CameraLookAt() {
	const {camera} = useThree();

	useEffect(() => {
		const targetPosition = [0, 0, 0];
		camera.lookAt(...targetPosition);
	}, [camera]);

	return null;
}

function TickHandler(props) {
	const {ballRef, paddleRefs} = props;

	const {getPlayer, useListener, requestServerTick, requestTickAdjust, sendPlayerEvent} = useDataContext();

	const tickRef = useRef(null);

	const callback = tick => {
		handleInput(tick, sendPlayerEvent);
		updateEnemyPositions(tick);
		tick.moveBall();
	};

	useEffect(() => {
		const player = getPlayer();

		const tick = new ClientTick(player, callback);

		tickRef.current = tick;

		const interval = setInterval(requestTickAdjust.bind(null, tick), 50);

		requestServerTick();

		return () => {
			tick.detach();

			clearInterval(interval);
		}
	}, []);

	useFrame(() => {
		const tick = tickRef.current;
		const positions = tick.getPositions();

		positions.forEach((value, i) => {
			const paddle = paddleRefs[i].current;

			if(paddle == null)
				return;

			const {position, axis} = paddle;

			position[axis] = value;
		});

		const ball = ballRef.current;

		if(ball == null)
			return;

		const [x, z, dx, dz, lastHitIndex] = tick.getBallData();

		ball.position.set(x, 0, z);

		if(lastHitIndex !== -1)
			ball.material.color.set(colors[lastHitIndex]);
	});

	useListener('player.index', index => {
		const tick = tickRef.current;

		tick.setPlayerIndex(index);
	});

	useListener('packet.dropped', id => {
		console.log('packet dropped', id);

		const tick = tickRef.current;

		tick.handleDroppedPacket(id);
	});

	useListener('game.tick', (type, value) => {
		const tick = tickRef.current;
		const fn = type === 'set' ? tick.setTick : tick.adjustTick;

		// TODO: add fast forward or wait if tick adjusted

		console.log('before: t', type, 'st', value, 'ct', tick.getTick());

		fn.call(tick, value);

		console.log(' after: t', type, 'ad', value, 'ct', tick.getTick());
	});

	useListener('game.update', payload => {
		const [tickServer, verifiedEventId, verifiedPositions] = payload;

		const tick = tickRef.current;

		verifiedPositions.forEach((position, i) => {
			if(tick.isPlayerIndex(i)) {
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

		console.log('collision', tickServer, verifiedBallData);

		tick.reconcileBall(tickServer, verifiedBallData);
	});
}

function handleInput(tick, sendPlayerEvent) {
	if(tick.getPlayerIndex() === -1)
		return;

	const left = isKeyDown('KeyA');
	const right = isKeyDown('KeyD');

	if(!(left || right))
		return;

	const input = right - left;

	tick.applyInput(input);

	const event = tick.createHistoryEvent('input', input);

	sendPlayerEvent(event);
}

function updateEnemyPositions(tick) {
	const entries = tick.extractQueueEntries('position');

	entries.forEach(entry => {
		const {playerIndex, position} = entry.data;

		tick.setPositionFor(playerIndex, position);
	});
}

function onKeyAction(event) {
	const {type, code} = event;

	keysDown[code] = type === 'keydown';
}

function isKeyDown(code) {
	return +!!keysDown[code];
}

function Game(props) {

	const border0Ref = useRef(null);
	const border1Ref = useRef(null);
	const border2Ref = useRef(null);
	const border3Ref = useRef(null);
	const border4Ref = useRef(null);
	const border5Ref = useRef(null);
	const border6Ref = useRef(null);
	const border7Ref = useRef(null);
	const border8Ref = useRef(null);
	const border9Ref = useRef(null);
	const border10Ref = useRef(null);
	const border11Ref = useRef(null);

	const paddleRedRef = useRef(null);
	const paddleGreenRef = useRef(null);
	const paddleBlueRef = useRef(null);
	const paddleYellowRef = useRef(null);

	const ballRef = useRef(null);

	const borderRefs = [
		border0Ref,
		border1Ref,
		border2Ref,
		border3Ref,
		border4Ref,
		border5Ref,
		border6Ref,
		border7Ref,
		border8Ref,
		border9Ref,
		border10Ref,
		border11Ref,
		paddleRedRef,
		paddleGreenRef,
		paddleBlueRef,
		paddleYellowRef
	];

	const paddleRefs = [
		paddleRedRef,
		paddleGreenRef,
		paddleBlueRef,
		paddleYellowRef,
	];

	const cuboids = getCuboids(borderRefs, paddleRefs, ballRef);

	useEffect(() => {

		window.addEventListener('keydown', onKeyAction);
		window.addEventListener('keyup', onKeyAction);

		return () => {
			window.removeEventListener('keydown', onKeyAction);
			window.removeEventListener('keyup', onKeyAction);
		};
	}, []);

	return (
		<Canvas camera={{
			fov: 75,
			near: 0.1,
			far: 1000,
			position: [0, sizes.boardSize, 0]
		}}>
			<ResizeListener />
			<CameraLookAt />
			<TickHandler ballRef={ballRef} paddleRefs={paddleRefs} borderRefs={borderRefs} playerIndex={0} />
			<ambientLight intensity={Math.PI / 2} />
			<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
			<pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
			{
				cuboids.map((cuboid, i) => <Cuboid key={i} {...cuboid} />)
			}
		</Canvas>
	);
}

export default Game;