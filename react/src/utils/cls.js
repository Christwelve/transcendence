const cls = (...clss) => clss.filter(cls => cls != null).join(' ');

export default cls;