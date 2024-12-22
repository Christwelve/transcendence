import sizes from 'shared/sizes'
import colors from 'shared/colors'

const halfSize = sizes.boardSize / 2;
const cornerSize = [sizes.borderSize, sizes.borderSize / 2, sizes.borderSize];

const borderLengthClosed = sizes.boardSize - sizes.borderSize;
const borderLengthOpen = (sizes.boardSize - sizes.goalSize - sizes.borderSize) / 2;
const borderCenterOpen = (sizes.goalSize + borderLengthOpen) / 2;
const paddleSizeVertical = [sizes.paddleSize, sizes.borderSize / 2, sizes.borderSize];
const paddleSizeHorizontal = [sizes.borderSize, sizes.borderSize / 2, sizes.paddleSize];

function getBorders(playerIds) {

	const borders = [
		// corners
		{position: [-halfSize, 0, -halfSize], size: cornerSize},
		{position: [halfSize, 0, -halfSize], size: cornerSize},
		{position: [halfSize, 0, halfSize], size: cornerSize},
		{position: [-halfSize, 0, halfSize], size: cornerSize},

		...getBorderParts('top', playerIds[0]),
		...getBorderParts('bottom', playerIds[1]),
		...getBorderParts('left', playerIds[2]),
		...getBorderParts('right', playerIds[3]),
	];

	return borders;
}

function getBorderParts(side, open) {
	const sideIndex = ['top', 'bottom', 'left', 'right'].indexOf(side);

	if(sideIndex === -1)
		return [];

	return open ?
		[
			getBorderPart(sideIndex, 0),
			getBorderPart(sideIndex, 1),
		] :
		[
			getBorderPart(sideIndex),
		];
}

function getBorderPart(sideIndex, partIndex = null) {
	const position = getBorderPartPosition(sideIndex, partIndex);
	const size = getBorderPartSize(sideIndex, partIndex);

	return {position, size};
}

function getBorderPartPosition(sideIndex, partIndex) {
	const multiplierX = partIndex === 0 ? -1 : 1;
	const multiplierZ = sideIndex % 2 === 0 ? -1 : 1;
	const x = partIndex == null ? 0 : borderCenterOpen * multiplierX;
	const z = halfSize * multiplierZ;
	const position = [x, 0, z];

	if(sideIndex > 1)
		position.reverse();

	return position;
}

function getBorderPartSize(sideIndex, partIndex) {
	const borderLength = partIndex == null ? borderLengthClosed : borderLengthOpen;

	const size = [borderLength, sizes.borderSize / 2, sizes.borderSize];

	if(sideIndex > 1)
		size.reverse();

	return size;
}

function getPaddles(playerIds, paddleRefs = []) {
	const paddles = [];

	if(playerIds[0])
		paddles.push({position: [0, 0, -halfSize], size: paddleSizeVertical, color: colors[1], axis: 'x', playerIndex: 0, ref: paddleRefs[0]});
	if(playerIds[1])
		paddles.push({position: [0, 0, halfSize], size: paddleSizeVertical, color: colors[2], axis: 'x', playerIndex: 1, ref: paddleRefs[1]});
	if(playerIds[2])
		paddles.push({position: [-halfSize, 0, 0], size: paddleSizeHorizontal, color: colors[3], axis: 'z', playerIndex: 2, ref: paddleRefs[2]});
	if(playerIds[3])
		paddles.push({position: [halfSize, 0, 0], size: paddleSizeHorizontal, color: colors[4], axis: 'z', playerIndex: 3, ref: paddleRefs[3]});

	return paddles;
}

function getBall(ballRef) {
	const ball = {position: [0, 0, 0], size: cornerSize, ref: ballRef};

	return ball;
}

function getCuboids(playerIds, paddleRefs, ballRef) {
	const borders = getBorders(playerIds);
	const paddles = getPaddles(playerIds, paddleRefs);
	const ball = getBall(ballRef);

	return [...borders, ...paddles, ball];
}

function getBoundingBoxes(playerIds, playerPositions, ballData) {
	const boundingBoxesBorders = getBoundingBoxesBorders(playerIds);
	const boundingBoxesPaddles = getBoundingBoxesPaddles(playerIds, playerPositions);
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

function getBoundingBoxesBorders(playerIds) {
	const borders = getBorders(playerIds);
	const boundingBoxesBorders = borders.map(calculateBoundingBox);

	return boundingBoxesBorders;
}

function getBoundingBoxesPaddles(playerIds, playerPositions) {
	const paddles = getPaddles(playerIds);

	const boundingBoxesPaddles = paddles.map(paddle => {
		const {position, axis} = paddle;
		const playerIndex = paddle.playerIndex;
		const axisIndex = {x: 0, z: 2}[axis];
		const playerPosition = playerPositions[playerIndex];

		position[axisIndex] = playerPosition;

		const boundingBox = calculateBoundingBox(paddle);

		boundingBox.playerIndex = playerIndex;

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