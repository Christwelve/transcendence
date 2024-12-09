import React, {useRef, useEffect, forwardRef} from 'react'
import {Canvas, useThree, useFrame} from '@react-three/fiber'
import {Box3} from 'three';
import {useDataContext} from './DataContext'
import {ClientTick} from 'shared/tick'
import sizes from 'shared/sizes'
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

function CameraTurn() {
	const {camera} = useThree();

	useFrame(state => {
		const {clock} = state;

		const time = clock.getElapsedTime() * 0.1;
		const x = Math.sin(time) * 100;
		const z = Math.cos(time) * 100;

		// camera.position.set(x, camera.position.y, z);
		camera.position.set(0, camera.position.y, 0);
		// camera.position.set(0, 50, -100);

		const targetPosition = [0, 0, 0];
		camera.lookAt(...targetPosition);
	}, [camera]);

	return null;
}

function BallMover(props) {
	const {ball} = props;

	useFrame((state, delta) => {
		if(ball == null)
			return;

		const {position, velocity} = ball;
		const [dx, dz] = velocity;

		const limit = sizes.boardSize / 2 + sizes.borderSize;

		position.x += dx * delta * 75;
		position.z += dz * delta * 75;

		if(Math.abs(position.x) > limit || Math.abs(position.z) > limit)
			position.set(0, 0, 0);

		// position.set(sizes.boardSize / 2 - 2, 0, sizes.boardSize / 4);

		// changeDirection(position, velocity, limit, 'x');
		// changeDirection(position, velocity, limit, 'z');

	});

	return null;
}

function CollisionDetector(props) {
	const {borders, ball} = props;

	useFrame(() => {
		if(ball == null)
			return;

		const ballBox = new Box3();
		ballBox.setFromObject(ball);

		let i = -1;
		for(const border of borders) {
			i++;

			if(border == null)
				continue;

			const borderBox = new Box3();
			borderBox.setFromObject(border);

			if(!borderBox.intersectsBox(ballBox))
				continue;

			const overlapX = calculateMinOverlap(borderBox, ballBox, 'x');
			const overlapZ = calculateMinOverlap(borderBox, ballBox, 'z');

			const overlapMin = Math.min(overlapX, overlapZ);

			const diffA = borderBox.max.clone().sub(ballBox.min);
			const diffB = ballBox.max.clone().sub(borderBox.min);

			if(overlapMin === overlapX)
				resolveCollision(diffA, diffB, borderBox, border, ball, 'x');
			else if(overlapMin === overlapZ)
				resolveCollision(diffA, diffB, borderBox, border, ball, 'z');
		}
	});

	return null;
}

function calculateMinOverlap(boxA, boxB, axis) {
	const overlap = Math.min(
		boxA.max[axis] - boxB.min[axis],
		boxB.max[axis] - boxA.min[axis],
	);

	return overlap;
}

function resolveCollision(diffA, diffB, borderBox, border, ball, axis) {
	const axisIndex = {x: 0, z: 1}[axis];
	const collisionBottom = diffA[axis] < diffB[axis];
	const limit = collisionBottom ? borderBox.max[axis] : borderBox.min[axis];
	const offset = (collisionBottom ? sizes.borderSize : -sizes.borderSize) / 2;

	ball.position[axis] = limit + offset;
	ball.velocity[axisIndex] *= -1;
}

function TickHandler(props) {
	const {ballRef, paddleRefs, borderRefs, playerIndex} = props;

	const {getPlayer, useListener, requestServerTick, requestTickAdjust, sendPlayerEvent} = useDataContext();

	const tickRef = useRef(null);

	const callback = tick => {

		tick.moveBall();

		const entries = tick.getRelevantQueueEntries();

		entries.forEach(entry => {
			const {playerIndex, position} = entry;

			tick.setPositionFor(playerIndex, position);
		});

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

		const [x, z] = tick.getBallData();

		ball.position.set(x, 0, z);
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
				tick.queuePositionOther(position, i, tickServer);
			}
		});
	});
}

function updateBall(ballRef) {
	const ball = ballRef.current;

	if(ball == null)
		return;

	// ball.rotation.y -= 0.01;

	return;

	const {position, velocity} = ball;
	const [dx, dz] = velocity;

	const limit = sizes.boardSize / 2 + sizes.borderSize;

	position.x += dx * 1.25;
	position.z += dz * 1.25;

	if(Math.abs(position.x) > limit || Math.abs(position.z) > limit)
		position.set(0, 0, 0);
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
			{/* <CameraLookAt /> */}
			<CameraTurn />
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