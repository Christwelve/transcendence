import {useEffect} from 'react'
import {applyInput} from 'shared/shared'

const DEFAULT_TICK_ADJUSTMENT = 5;
const DEFAULT_TICK_RATE = 60;

let tickCallbacks = [];

function GameManager(sizes, playerIndex, send, options = {}) {
	this._running = true;

	this._history = [];
	this._eventId = 0;

	this._keysDown = {};

	this._sizes = sizes;
	this._playerIndex = playerIndex;
	this._send = send;

	this._positions = [0, 0, 0, 0];
	this._sendPositionUpdate = null;

	this._tickRate = DEFAULT_TICK_RATE;
	this._tickCurrent = 0;
	this._tickAdjustment = options.tickAdjustment ?? DEFAULT_TICK_ADJUSTMENT;

	this._timeSleep = this._intervalTarget = 1000 / this._tickRate;
	this._timeThen = performance.now();

	setTimeout(this._tick.bind(this), Math.max(0, this._timeSleep));

	this._onKeyActionCallback = this._onKeyAction.bind(this);

	window.addEventListener('keydown', this._onKeyActionCallback);
	window.addEventListener('keyup', this._onKeyActionCallback);
}

GameManager.prototype._onKeyAction = function(event) {
	const {type, code} = event;

	this._keysDown[code] = type === 'keydown';
}

GameManager.prototype._sendEvent = function(name, data) {
	const event = {id: this._eventId++, n: name, t: this._tickCurrent, d: data};

	this._history.push(event);

	this._send(event);
}

GameManager.prototype._tick = function() {
	if(!this._running)
		return;

	const timeNow = performance.now();

	const intervalActual = timeNow - this._timeThen;
	const drift = intervalActual - this._intervalTarget;
	this._timeSleep -= drift;

	setTimeout(this._tick.bind(this), Math.max(0, this._timeSleep));

	const fps = 1000 / intervalActual;


	// this._statsUpdate({tick: this._tickCurrent, fps});

	tickCallbacks.forEach(fn => fn(fps));

	this._tickCurrent++;
	this._timeThen = timeNow;
}

GameManager.prototype.isKeyDown = function(code) {
	return !!this._keysDown[code];
}

GameManager.prototype.recordInput = function(input) {
	applyInput(this._sizes, this._positions, this._playerIndex, input);

	this._sendPositionUpdate(this._positions);

	this._sendEvent('move', input);
}

GameManager.prototype.onPositionUpdate = function(callback) {
	this._sendPositionUpdate = callback;
}

GameManager.prototype.end = function() {
	this._running = false;

	window.removeEventListener('keydown', this._onKeyActionCallback);
	window.removeEventListener('keyup', this._onKeyActionCallback);
}

const useTick = callback => {
	useEffect(() => {

		tickCallbacks.push(callback);

		return () => tickCallbacks = tickCallbacks.filter(fn => fn !== callback);

	}, [callback]);
};

export default GameManager;
export {
	useTick
};
