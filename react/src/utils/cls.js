const cls = (...classes) => classes.flat(Infinity).filter(cls => cls).join(' ');

export default cls;