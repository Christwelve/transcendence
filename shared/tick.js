import sizes from 'shared/sizes'
import {getBoundingBoxes, resolveCollision} from 'shared/cuboids'

const TICK_SPEED = 60;
const TICK_DEFAULT_OFFSET = 5;

const intervalTarget = 1000 / TICK_SPEED;
let timeSleep = intervalTarget;
let instanceId = 0;

let instances = [];

class Tick {
	constructor(playerCount, callback) {
		this._id = instanceId++;

		this._tick = 0;
		this._tickNextAmount = 0;
		this._callback = callback;

		this._playerCount = playerCount;

		this._queue = [];
		this._positions = [0, 0, 0, 0];
		// [x, z, dx, dy, lastContactPlayerIndex]
		this._ballData = [0, 0, 0, 0, -1];
		this._countdown = 0;
		this._direction = [0, 0];
		this._starting = false;

		this._detached = false;

		instances.push(this);
	}

	_assertDetached() {
		if(this._detached)
			throw Error('Tick is detached.');
	}

	_calculateNewBallDirection(playerIndex) {
		if(playerIndex == null)
			return;

		const halfPi = Math.PI / 2;
		const rotations = [halfPi, -halfPi, 0,  Math.PI];

		const halfSize = sizes.boardSize / 2;
		const multiplier = (playerIndex % 2 === 0 ? -1 : 1);
		const fixed = halfSize * multiplier;
		const indexFixed = playerIndex < 2 ? 1 : 0
		const indexPosition = playerIndex < 2 ? 0 : 1;

		const paddlePosition = [0, 0];

		paddlePosition[indexFixed] = fixed;
		paddlePosition[indexPosition] = this._positions[playerIndex];

		const [px, pz] = paddlePosition;
		const [bx, bz] = this._ballData;

		let paddleVector = [0, 0];
		paddleVector[indexPosition] = playerIndex % 3 === 0 ? -1 : 1;

		const ballVector = [bx - px, bz - pz];

		const dot = dotVector(paddleVector, ballVector);

		const lerp = dot / (sizes.paddleSize / 2);

		const theta = rotations[playerIndex] + (Math.PI / 4) * lerp;

		this._ballData[2] = Math.cos(theta);
		this._ballData[3] = Math.sin(theta);
	}

	_setBallPosition(x, z) {
		this._ballData[0] = x;
		this._ballData[1] = z;
	}

	_setBallData(ballData) {
		this._ballData = ballData;
	}

	roundStart(countdown, direction) {
		this._countdown = countdown;
		this._direction = direction;
		this._starting = true;
	}

	kickoff() {
		this._starting = false;
		const [dx, dz] = this._direction;

		this._ballData[2] = dx;
		this._ballData[3] = dz;

		console.log('kickoff', this._direction, this._ballData);
	}

	getTick() {
		this._assertDetached();

		return this._tick;
	}

	applyInput(input, playerIndex = this.getPlayerIndex()) {
		this._assertDetached();

		const limit = (sizes.goalSize - sizes.paddleSize) / 2;
		const direction = playerIndex % 2 == 0 ? -1 : 1;

		const value = Math.sign(input) * direction;

		this._positions[playerIndex] += value;

		if(this._positions[playerIndex] > limit)
			this._positions[playerIndex] = limit;
		else if(this._positions[playerIndex] < -limit)
			this._positions[playerIndex] = -limit;
	}

	moveBall() {
		this._assertDetached();

		const [x, z, dx, dz] = this._ballData;

		const px = x + dx;
		const pz = z + dz;

		this._ballData[0] = px;
		this._ballData[1] = pz;

		const limit = sizes.boardSize / 2 + sizes.borderSize;

		if(Math.abs(px) > limit || Math.abs(pz) > limit)
			return this._setBallPosition(0, 0);

		const [boundingBoxesOther, boundingBoxBall] = getBoundingBoxes(this._playerCount, this._positions, this._ballData);

		for(const boundingBox of boundingBoxesOther) {

			const hit = resolveCollision(this._ballData, boundingBoxBall, boundingBox);

			if(!hit)
				continue;

			this._calculateNewBallDirection(boundingBox.playerIndex);

			if(boundingBox.playerIndex != null)
				this._ballData[4] = boundingBox.playerIndex;

			return true;
		}

		return false;
	}

	getBallData() {
		return this._ballData;
	}

	detach() {
		this._assertDetached();

		instances = instances.filter(instance => instance !== this);

		this._detached = true;
	}
}

class ClientTick extends Tick {
	constructor(player, playerCount, callback) {
		super(playerCount, callback);

		this._tickOffset = TICK_DEFAULT_OFFSET;

		this._player = player;

		this._eventId = 0;
		this._history = [];

		this._verifiedPosition = 0;
	}

	getPlayerIndex() {
		this._assertDetached();

		return this._player.index;
	}

	setTick(value) {
		this._assertDetached();

		this._tick = value + this._tickOffset;
	}

	adjustTick(value) {
		this._assertDetached();

		this._tickOffset += value;
		this._tickNextAmount += value;
	}

	createHistoryEvent(name, data) {
		this._assertDetached();

		const event = [
			this._eventId++,
			this._tick,
			name,
			data,
		];

		this._history.push(event);

		return event;
	}

	getPositions() {
		this._assertDetached();

		return this._positions;
	}

	getBallPosition() {
		this._assertDetached();

		const [x, z] = this._ballData;

		return [x, z];
	}

	handleDroppedPacket(id) {
		this._assertDetached();

		this._history = this._history.filter(([eventId]) => eventId !== id);

		this.reconcilePosition(this._verifiedPosition);
	}

	reconcilePosition(position) {
		this._assertDetached();

		const playerIndex = this.getPlayerIndex();

		const currentPosition = this._positions[playerIndex];

		this._positions[playerIndex] = position;
		this._verifiedPosition = position;

		this._history.forEach(entry => {
			const type = entry[2];

			if(type !== 'input')
				return;

			const input = entry[3];

			this.applyInput(input);
		});

		const reconciledPosition = this._positions[playerIndex];
		const difference = Math.abs(reconciledPosition - currentPosition);

		if(difference > 2)
			return;

		this._positions[playerIndex] = currentPosition;
	}

	isPlayerIndex(index) {
		this._assertDetached();

		return index === this.getPlayerIndex();
	}

	clearOldHistory(id) {
		this._assertDetached();

		const end = this._history.findIndex(([eventId]) => eventId === id) + 1;

		this._history.splice(0, end);
	}

	queueUpdate(type, tickServer, data) {
		this._assertDetached();

		const applyAt = tickServer + this._tickOffset / 2;

		const entry = {
			type,
			applyAt,
			data
		};

		this._queue.push(entry);
	}

	extractQueueEntries(type) {
		this._assertDetached();

		if(this._queue.length === 0)
			return [];

		const entries = this._queue.filter(entry => type === entry.type && entry.applyAt <= this._tick);

		this._queue = this._queue.filter(entry => !entries.includes(entry));

		return entries;
	}

	setPositionFor(playerIndex, position) {
		this._assertDetached();

		this._positions[playerIndex] = position;
	}

	reconcileBall(tickServer, verifiedBallData) {
		const fastForwardAmount = this._tick - tickServer;
		const ballDataBefore = [...this._ballData];

		this._setBallData(verifiedBallData);

		for(let i = 0; i < fastForwardAmount; i++)
			this.moveBall();

		const keep = this._ballData.every((value, i) => Math.abs(value - ballDataBefore[i]) <= 0.1);

		if(keep)
			this._setBallData(ballDataBefore);
	}

	getCountdownSeconds() {
		return Math.ceil(this._countdown / TICK_SPEED);
	}
}

class ServerTick extends Tick {
	constructor(players, callback) {
		super(players.length, callback);

		console.log('players', players.length);

		this._players = players;
		this._verifiedEventIds = [0, 0, 0, 0];

		this._players.forEach((player, i) => player.index = i);
	}

	_getUpdateObject(playerIndex) {
		const verifiedEventId = this._verifiedEventIds[playerIndex];

		return [this._tick + 2, verifiedEventId, this._positions];
	}

	canQueueEvent(event) {
		this._assertDetached();

		const tickClient = event[1];

		return tickClient >= this._tick;
	}

	queueEvent(player, event) {
		this._assertDetached();

		const entry = {
			player,
			event,
		};

		this._queue.push(entry);
	}

	getQueueEntries() {
		return this._queue.splice(0, this._queue.length);
	}

	calculateOffsetDelta(tickClient) {
		const difference = tickClient - this._tick;

		if(difference < 1 || difference > 2)
			return -(difference - 2);

		return 0;
	}

	updateVerifiedEventId(id, playerIndex) {
		const current = this._verifiedEventIds[playerIndex];

		this._verifiedEventIds[playerIndex] = Math.max(current, id);
	}

	sendUpdateToPlayers(io) {
		this._players.forEach(player => {
			const update = this._getUpdateObject(player.index);

			io.sockets.sockets.get(player.id)?.emit('game.update', update);
		});
	}

	sendCollisionToPlayers(io) {
		this._players.forEach(player => {
			io.sockets.sockets.get(player.id)?.emit('ball.collision', this._tick, this._ballData);
		});
	}

	startGame(io) {
		const countdown = 3 * TICK_SPEED;
		const direction = randVector();

		this.roundStart(countdown, direction);

		this._players.forEach(player => {
			io.sockets.sockets.get(player.id)?.emit('round.start', countdown, direction);
		});
	}
}

function tick(timeThen) {
	const timeNow = performance.now();

	const intervalActual = timeNow - timeThen;
	const drift = intervalActual - intervalTarget;
	timeSleep -= drift;

	setTimeout(tick.bind(null, timeNow), Math.max(0, timeSleep));

	instances.forEach(instance => {
		instance._tickNextAmount++;

		while(instance._tickNextAmount > 0) {
			instance._callback(instance);

			if(instance._countdown > 0)
				instance._countdown--;
			else if(instance._starting)
				instance.kickoff();

			instance._tick++;
			instance._tickNextAmount--;
		}
	});
}

// helper functions
function dotVector(v1, v2) {
	return v1[0] * v2[0] + v1[1] * v2[1];
}

function randVector() {
	const v = [
		Math.random() * 2 - 1,
		Math.random() * 2 - 1,
	];

	return normalizeVector(v);
}

function normalizeVector(v) {
	const [x, z] = v;

	const length = Math.hypot(x, z);

	const n = [
		x / length,
		z / length,
	];

	return n;
}


setTimeout(tick.bind(null, performance.now()), Math.max(0, timeSleep));

export {
	ClientTick,
	ServerTick,
};