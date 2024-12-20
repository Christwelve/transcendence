const strings = [
	'USER_STAGE_LOBBY',
	'USER_STAGE_ROOM',
	'USER_STAGE_INGAME',
];

const ENUM = {};

strings.forEach((string, i) => createEnumProxy(ENUM, string, i));

function createEnumProxy(target, string, index) {
	const parts = string.split('_');
	const last = parts.pop();

	fillTarget(target, parts);

	target[last] = new Proxy(new Number(index), {
		get(target, property) {
			if (property === 'toJSON') {
				return () => `#${target}`;
			}
			if (property === 'toString') {
				return () => `ENUM_${string}`;
			}
			if (property === 'valueOf') {
				return () => target;
			}
			return target[property];
		},
	});
}

function fillTarget(target, parts) {
	for(const part of parts) {
		if(!Reflect.has(target, part))
			target[part] = {};

		target = target[part];
	}
}

export default ENUM;