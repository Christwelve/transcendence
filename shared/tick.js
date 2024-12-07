import sizes from 'shared/sizes'

const TICK_DEFAULT_OFFSET = 5;

const intervalTarget = 1000 / 60;
let timeSleep = intervalTarget;
let instanceId = 0;

let instances = [];

class Tick {
	constructor(callback) {
		this._id = instanceId++;
		this._positions = [0, 0, 0, 0];
		this._tick = 0;
		this._callback = callback;
		this._detached = false;

		instances.push(this);
	}

	_assertDetached() {
		if(this._detached)
			throw Error('Tick is detached.');
	}

	getTick() {
		return this._tick;
	}

	applyInput(input, playerIndex = this._playerIndex) {
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

	detach() {
		this._assertDetached();

		instances = instances.filter(instance => instance !== this);

		this._detached = true;
	}
}

class ClientTick extends Tick {
	constructor(playerIndex, callback) {
		super(callback);

		this._tickOffset = TICK_DEFAULT_OFFSET;

		this._playerIndex = playerIndex;

		this._eventId = 0;
		this._history = [];

		this._verifiedPosition = 0;
	}

	setTick(value) {
		this._tick = value + this._tickOffset;
	}

	adjustTick(value) {
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
		return this._positions;
	}

	handleDroppedPacket(id) {
		this._history = this._history.filter(([eventId]) => eventId !== id);

		this.reconcilePosition(this._verifiedPosition);
	}

	reconcilePosition(position) {
		// TODO: maybe give margin of error

		const currentPosition = this._positions[this._playerIndex];

		this._positions[this._playerIndex] = position;
		this._verifiedPosition = position;

		this._history.forEach(entry => {
			const input = entry[3];

			this.applyInput(input);
		});

		const reconciledPosition = this._positions[this._playerIndex];
		const difference = Math.abs(reconciledPosition - currentPosition);

		if(difference > 2)
			return console.log('rec', currentPosition, '->', this._positions[this._playerIndex]);

		this._positions[this._playerIndex] = currentPosition;
	}

	isPlayerIndex(index) {
		return this._playerIndex === index;
	}

	clearOldHistory(id) {
		const end = this._history.findIndex(([eventId]) => eventId === id) + 1;

		this._history.splice(0, end);
	}
}

class ServerTick extends Tick {
	constructor(players, callback) {
		super(callback);

		this._players = players;
		this._verifiedEventIds = [0, 0, 0, 0];

		this._queue = [];

		this._players.forEach((player, i) => player.index = i);
	}

	_getUpdateObject(playerIndex) {
		const verifiedEventId = this._verifiedEventIds[playerIndex];

		return [this._tick, verifiedEventId, this._positions];
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

		console.log('d', this._tick, tickClient, difference);

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