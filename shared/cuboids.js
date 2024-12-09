import sizes from 'shared/sizes'

const halfSize = sizes.boardSize / 2;
const cornerSize = [sizes.borderSize, sizes.borderSize / 2, sizes.borderSize];

const borderLength = (sizes.boardSize - sizes.goalSize - sizes.borderSize) / 2;
const borderCenter = (sizes.goalSize + borderLength) / 2;
const borderSizeVertical = [borderLength, sizes.borderSize / 2, sizes.borderSize];
const borderSizeHorizontal = [sizes.borderSize, sizes.borderSize / 2, borderLength];
const paddleSizeVertical = [sizes.paddleSize, sizes.borderSize / 2, sizes.borderSize];
const paddleSizeHorizontal = [sizes.borderSize, sizes.borderSize / 2, sizes.paddleSize];

let boundingBoxesBorders = null;

function getBorders(borderRefs = []) {

	const borders = [
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
		{position: [halfSize, 0, borderCenter], size: borderSizeHorizontal, ref: borderRefs[11]},
	];

	return borders;
}

function getPaddles(paddleRefs = []) {
	const paddles = [
		{position: [0, 0, -halfSize], size: paddleSizeVertical, color: '#f00', axis: 'x', ref: paddleRefs[0]},
		{position: [0, 0, halfSize], size: paddleSizeVertical, color: '#0f0', axis: 'x', ref: paddleRefs[1]},
		{position: [-halfSize, 0, 0], size: paddleSizeHorizontal, color: '#00f', axis: 'z', ref: paddleRefs[2]},
		{position: [halfSize, 0, 0], size: paddleSizeHorizontal, color: '#ff0', axis: 'z', ref: paddleRefs[3]},
	];

	return paddles;
}

function getBall(ballRef) {
	const ball = {position: [0, 0, 0], size: cornerSize, ref: ballRef};

	return ball;
}

function getCuboids(borderRefs, paddleRefs, ballRef) {
	const borders = getBorders(borderRefs);
	const paddles = getPaddles(paddleRefs);
	const ball = getBall(ballRef);

	return [...borders, ...paddles, ball];
}

function getBoundingBoxes(playerPositions, ballData) {
	const boundingBoxesBorders = getBoundingBoxesBorders();
	const boundingBoxesPaddles = getBoundingBoxesPaddles(playerPositions);
	const boundingBoxBall = getBoundingBoxBall(ballData);

	const boundingBoxesAll = [[...boundingBoxesBorders, ...boundingBoxesPaddles], boundingBoxBall];

	return boundingBoxesAll;
}

function resolveCollision(ballData, ballBox, otherBox) {
	const overlap = calculateBoundingBoxOverlap(ballBox, otherBox);

	if(overlap == null)
		return false;

	const overlapSize = {
		x: overlap.max.x - overlap.min.x,
		z: overlap.max.z - overlap.min.z
	};

	const resolutionAxis = overlapSize.x <= overlapSize.z ? 'x' : 'z';

	const resolution = {x: 0, z: 0};
	if(ballBox.min[resolutionAxis] < otherBox.min[resolutionAxis])
		resolution[resolutionAxis] = -overlapSize[resolutionAxis];
	else
		resolution[resolutionAxis] = overlapSize[resolutionAxis];

	ballData[0] += resolution.x;
	ballData[1] += resolution.z;

	resolutionAxis === 'x' && (ballData[2] *= -1);
	resolutionAxis === 'z' && (ballData[3] *= -1);

	return true;
}

// helper functions
function calculateBoundingBoxOverlap(box1, box2) {
	// console.log(box1, box2);

	if(
		box1.max.x < box2.min.x || box2.max.x < box1.min.x ||
		box1.max.z < box2.min.z || box2.max.z < box1.min.z
	)
		return null;

	const overlapBox = {
		min: {
			x: Math.max(box1.min.x, box2.min.x),
			z: Math.max(box1.min.z, box2.min.z),
		},
		max: {
			x: Math.min(box1.max.x, box2.max.x),
			z: Math.min(box1.max.z, box2.max.z),
		}
	};

	return overlapBox;
}

function getBoundingBoxesBorders() {
	if(boundingBoxesBorders == null)
		boundingBoxesBorders = getBorders().map(calculateBoundingBox);

	return boundingBoxesBorders;
}

function getBoundingBoxesPaddles(playerPositions) {
	const paddles = getPaddles();

	const boundingBoxesPaddles = paddles.map((paddle, i) => {
		const {position, axis} = paddle;
		const axisIndex = {x: 0, z: 2}[axis];
		const playerPosition = playerPositions[i];

		position[axisIndex] = playerPosition;

		const boundingBox = calculateBoundingBox(paddle);

		boundingBox.playerIndex = i;

		return boundingBox;
	});

	return boundingBoxesPaddles;
}

function getBoundingBoxBall(ballData) {
	const [x, z] = ballData;

	const ball = getBall();

	ball.position[0] = x;
	ball.position[2] = z;

	const boundingBoxBall = calculateBoundingBox(ball);

	return boundingBoxBall;
}

function calculateBoundingBox(object) {
	const {position, size} = object;

	const [px, py, pz] = position;
	const [sx, sy, sz] = size;

	const halfSX = sx * 0.5;
	const halfSZ = sz * 0.5;

	const minX = px - halfSX;
	const minZ = pz - halfSZ;

	const maxX = px + halfSX;
	const maxZ = pz + halfSZ;

	const min = {x: minX, z: minZ};
	const max = {x: maxX, z: maxZ};

	return {min, max};
}

export {
	getCuboids,
	getBoundingBoxes,
	resolveCollision,
};