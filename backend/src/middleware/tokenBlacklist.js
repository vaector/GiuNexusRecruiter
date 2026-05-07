const blacklist = new Set();

const addToBlacklist = (jti) => blacklist.add(jti);
const isBlacklisted = (jti) => blacklist.has(jti);

module.exports = { addToBlacklist, isBlacklisted };