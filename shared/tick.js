import sizes from 'shared/sizes'
import {getBoundingBoxes, resolveCollision} from 'shared/cuboids'

const TICK_DEFAULT_OFFSET = 5;

const intervalTarget = 1000 / 60;
let timeSleep = intervalTarget;
let instanceId = 0;

let instances = [];

class Tick {
	constructor(callback) {
		this._id = instanceId++;

		this._tick = 0;
		this._callback = callback;

		this._queue = [];
		this._positions = [0, 0, 0, 0];
		// [x, z, dx, dy, lastContactPlayerIndex]
		this._ballData = [0, 0, 0.2, -1, 0];

		this._detached = false;

		instances.push(this);
	}

	_assertDetached() {
		if(this._detached)
			throw Error('Tick is detached.');
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

		if(Math.abs(px) > limit || Math.abs(pz) > limit) {
			this._ballData[0] = 0;
			this._ballData[1] = 0;

			return;
		}

		const [boundingBoxesOther, boundingBoxBall] = getBoundingBoxes(this._positions, this._ballData);

		for(const boundingBox of boundingBoxesOther) {
			const hit = resolveCollision(this._ballData, boundingBoxBall, boundingBox);

			if(hit)
				break;
		}
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
	constructor(player, callback) {
		super(callback);

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
		this._tick += value;
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

	queuePositionOther(position, playerIndex, tickServer) {
		this._assertDetached();

		const applyAt = tickServer + this._tickOffset / 2;

		const entry = {
			applyAt,
			playerIndex,
			position
		};

		this._queue.push(entry);
	}

	getRelevantQueueEntries() {
		this._assertDetached();

		if(this._queue.length === 0)
			return [];

		const index = this._queue.findIndex(entry => entry.applyAt > this._tick);

		if(index !== -1)
			return this._queue.splice(0, index);

		const entries = [...this._queue];
		this._queue.length = 0;

		return entries;
	}

	setPositionFor(playerIndex, position) {
		this._assertDetached();

		this._positions[playerIndex] = position;
	}
}

class ServerTick extends Tick {
	constructor(players, callback) {
		super(callback);

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

			io.sockets.sockets.get(player.id).emit('game.update', update);
		});
	}
}

function tick(timeThen) {
	const timeNow = performance.now();

	const intervalActual = timeNow - timeThen;
	const drift = intervalActual - intervalTarget;
	timeSleep -= drift;

	setTimeout(tick.bind(null, timeNow), Math.max(0, timeSleep));

	const delta = intervalActual * 0.001;

	instances.forEach(instance => {
		instance._callback(instance, delta);
		instance._tick++;
	});
}

setTimeout(tick.bind(null, performance.now()), Math.max(0, timeSleep));

export {
	ClientTick,
	ServerTick,
};