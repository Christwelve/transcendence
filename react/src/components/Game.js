import React, {useRef, useEffect, forwardRef} from 'react'
import {Canvas, useThree, useFrame} from '@react-three/fiber'
import {Box3} from 'three';
import {useDataContext} from './DataContext'
import {ClientTick} from 'shared/tick'
import sizes from 'shared/sizes'

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

	const {useListener, requestServerTick, requestTickAdjust, sendPlayerEvent} = useDataContext();
	// const cont = useDataContext();

	// console.log(cont.useListener);

	// const useListener = () => {};

	const tickRef = useRef(null);

	console.log('ddd');

	const callback = (tick) => {

		updateBall(ballRef);

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
		const tick = new ClientTick(playerIndex, callback);

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
	});

	useListener('packet.dropped', (...args) => {
		console.log('packet dropped', ...args);
	});

	useListener('game.tick', (type, value) => {
		const tick = tickRef.current;
		const fn = type === 'set' ? tick.setTick : tick.adjustTick;

		console.log('before: t', type, 'st', value, 'ct', tick.getTick());

		fn.call(tick, value);

		console.log(' after: t', type, 'ad', value, 'ct', tick.getTick());
	});

	useListener('game.update', (payload) => {
		const [tickServer, verifiedEventId, verifiedPositions] = payload;

		const tick = tickRef.current;

		console.table(verifiedEventId, ...tick._history);

		verifiedPositions.forEach((position, i) => {
			if(tick.isPlayerIndex(i)) {
				tick.clearOldHistory(verifiedEventId);
				tick.reconcilePosition(position);
			}
		});

		console.log(payload);
	});
}

function updateBall(ballRef) {
	const ball = ballRef.current;

	if(ball == null)
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
	const {sendPlayerEvent} = useDataContext();

	const paddleRedRef = useRef(null);
	const paddleGreenRef = useRef(null);
	const paddleBlueRef = useRef(null);
	const paddleYellowRef = useRef(null);
	const ballRef = useRef(null);

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

	const halfSize = sizes.boardSize / 2;
	const cornerSize = [sizes.borderSize, sizes.borderSize / 2, sizes.borderSize];

	const borderLength = (sizes.boardSize - sizes.goalSize - sizes.borderSize) / 2;
	const borderCenter = (sizes.goalSize + borderLength) / 2;
	const borderSizeVertical = [borderLength, sizes.borderSize / 2, sizes.borderSize];
	const borderSizeHorizontal = [sizes.borderSize, sizes.borderSize / 2, borderLength];
	const paddleSizeVertical = [sizes.paddleSize, sizes.borderSize / 2, sizes.borderSize];
	const paddleSizeHorizontal = [sizes.borderSize, sizes.borderSize / 2, sizes.paddleSize];

	const cuboids = [
		// corners
		{position: [-halfSize, 0, -halfSize], size: cornerSize, ref: borderRefs[0]},
		{position: [halfSize, 0, -halfSize], size: cornerSize, ref: borderRefs[1]},
		{position: [halfSize, 0, halfSize], size: cornerSize, ref: borderRefs[2]},
		{position: [-halfSize, 0, halfSize], size: cornerSize, ref: borderRefs[3]},
		// top
		{position: [-borderCenter, 0, -halfSize], size: borderSizeVertical, ref: borderRefs[4]},
		{position: [borderCenter, 0, -halfSize], size: borderSizeVertical, ref: borderRefs[5]},
		// bottom
		{position: [-borderCenter, 0, halfSize], size: borderSizeVertical, ref: borderRefs[6]},
		{position: [borderCenter, 0, halfSize], size: borderSizeVertical, ref: borderRefs[7]},
		// left
		{position: [-halfSize, 0, -borderCenter], size: borderSizeHorizontal, ref: borderRefs[8]},
		{position: [-halfSize, 0, borderCenter], size: borderSizeHorizontal, ref: borderRefs[9]},
		// right
		{position: [halfSize, 0, -borderCenter], size: borderSizeHorizontal, ref: borderRefs[10]},
		{position: [halfSize, 0, borderCenter], size: borderSizeHorizontal, ref: borderRefs[11], color: '#f80'},
		// paddles
		{position: [0, 0, -halfSize], size: paddleSizeVertical, color: '#f00', axis: 'x', ref: paddleRedRef},
		{position: [0, 0, halfSize], size: paddleSizeVertical, color: '#0f0', axis: 'x', ref: paddleGreenRef},
		{position: [-halfSize, 0, 0], size: paddleSizeHorizontal, color: '#00f', axis: 'z', ref: paddleBlueRef},
		{position: [halfSize, 0, 0], size: paddleSizeHorizontal, color: '#ff0', axis: 'z', ref: paddleYellowRef},
		// ball
		{position: [0, 0, 0], size: cornerSize, ref: ballRef, velocity: [-1, 0.1], color: '#0ff'},
	];

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