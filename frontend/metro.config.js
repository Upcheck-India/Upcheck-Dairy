const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// WatermelonDB support
config.resolver.sourceExts.push('cjs');

module.exports = config;
