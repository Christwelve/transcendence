// enums
const ENUM_SIDE_CLIENT = 0;
const ENUM_SIDE_SERVER = 1;

// defaults
const DEFAULT_TICK_ADJUSTMENT = 5;
const DEFAULT_TICK_RATE = 60;
const DEFAULT_STATS_CALLBACK = () => {};

function Game(side, options) {
	this._side = side;

	this._tickRate = options.tickRate ?? DEFAULT_TICK_RATE;
	this._tickCurrent = 0;
	this._tickAdjustment = options.tickAdjustment ?? DEFAULT_TICK_ADJUSTMENT;

	this._timeThen = performance.now();
	this._timeSleep = 0;
	this._intervalTarget = 0;

	this._statsUpdate = options.statsUpdate ?? DEFAULT_STATS_CALLBACK;

	this._timeSleep = this._intervalTarget = 1000 / this._tickRate;

	// this._tick_start = 0;
	// this._tick_time = performance.now();

	// setInterval(() => {
	// 	const tick = this._tickCurrent - this._tick_start;
	// 	const time = performance.now() - this._tick_time;
	// 	this._statsUpdate({tickRate: });
	// })

	// this._statsUpdate({tick: 5});


	this._tick();
}

Game.prototype._tick = function() {
	const timeNow = performance.now();

	const intervalActual = timeNow - this._timeThen;
	const drift = intervalActual - this._intervalTarget;
	this._timeSleep -= drift;

	setTimeout(this._tick.bind(this), Math.max(0, this._timeSleep));

	const fps = 1000 / intervalActual;

	// this._statsUpdate({tick: this._tickCurrent, fps});

	this._tickCurrent++;
	this._timeThen = timeNow;
}



export default Game;
export {ENUM_SIDE_CLIENT, ENUM_SIDE_SERVER};