const instructions = [];

function createProxy(target, basePath = '') {

	if(target == null)
		return target;
	if(Array.isArray(target))
		return createProxyArray(target, basePath);
	if(typeof target === 'object')
		return createProxyObject(target, basePath);

	return target;
}

function createProxyArray(target, basePath) {
	return new Proxy(target, getProxyArrayHandler(basePath));
}

function createProxyObject(target, basePath) {
	return new Proxy(target, getProxyObjectHandler(basePath));
}

// function createProxyArray(target, basePath) {
// 	const array = target.map((element, i) => createProxy(element, joinPath(basePath, i)));

// 	return new Proxy(array, getProxyArrayHandler(basePath));
// }

// function createProxyObject(target, basePath) {
// 	const entries = Object.entries(target).map(([key, value]) => [key, createProxy(value, joinPath(basePath, key))]);
// 	const object = Object.fromEntries(entries);

// 	// console.log(entries, console.log(emit));

// 	return new Proxy(object, getProxyObjectHandler(basePath));
// }

// handlers
function getProxyArrayHandler(basePath) {
	return {
		get(target, property, receiver) {
			if(typeof target[property] === 'function')
				return getProxyArrayHandlerFunction(target, property, basePath);

			const index = new Number(property);

			if(isNaN(index))
				return Reflect.get(target, property, receiver);

			const path = joinPath(basePath, index);
			return createProxy(target[index], path);
		},

		set(target, property, value) {
			const path = joinPath(basePath, property);

			const instruction = {type: 'array', action: 'set', path, value};

			instructions.push(instruction);

			target[property] = value;

			return true;
		},

		deleteProperty(target, property) {
			const path = joinPath(basePath, property);

			const instruction = {type: 'array', action: 'unset', path};

			instructions.push(instruction);

			delete target[property];

			return true;
		},
	}
}

function getProxyArrayHandlerFunction(target, property, basePath) {
	return function(...args) {
		switch(property) {
			case 'push': {
				const value = args[0];
				const instruction = {type: 'array', action: 'push', path: basePath, value};

				instructions.push(instruction);

				const result = target[property](...args);

				return result;
			}
			case 'pop': {
				if(target.length === 0)
					return;

				const instruction = {type: 'array', action: 'pop', path: basePath};

				instructions.push(instruction);

				const result = target[property](...args);

				return result;
			}
			case 'splice': {
				const instruction = {type: 'array', action: 'splice', path: basePath, value: args};

				instructions.push(instruction);

				const result = target[property](...args);

				return result;
			}
			default: {
				const result = target[property](...args);

				return result;
			}
		}
	};
}

function getProxyObjectHandler(basePath) {
	return {
		get(target, property) {
			const value = target[property];

			if(typeof target === 'object' && target !== null && Reflect.has(target, property)) {
				// console.log(basePath, property);
				const path = joinPath(basePath, property);
				return createProxy(value, path);
			}

			return value;
		},
		set(target, property, value) {
			const path = joinPath(basePath, property);
			const instruction = {type: 'object', action: 'set', path, value};

			if(value !== target[property])
				instructions.push(instruction);

			target[property] = value;

			return true;
		},
		deleteProperty(target, property) {
			// console.log(target, property);
			const path = joinPath(basePath, property);
			const instruction = {type: 'object', action: 'unset', path};

			if(!(property in target))
				return false;

			instructions.push(instruction);

			delete target[property];

			return true;
		},
	};
}

function sendInstructions(emit) {
	if(instructions.length === 0)
		return;

	emit(instructions);

	instructions.length = 0;
}

// helper functions
function joinPath(...parts) {
	if(parts.length === 1)
		return basePath;

	const [basePath, ...rest] = parts;

	if(basePath === '')
		return rest.join('.');

	// console.log('-----', parts, basePath, rest);

	return parts.join('.');
}

export {
	createProxy,
	sendInstructions,
};