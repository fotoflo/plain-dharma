// Expo SDK 56 auto-configures Metro for monorepos (watchFolders, nodeModulesPaths,
// autolinking module resolution) — do NOT add those here. The only customization
// is registering `.mdx`/`.md` as source extensions so sutta content can be
// inline-imported as raw strings (see babel.config.js → babel-plugin-inline-import).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("mdx", "md");

module.exports = config;
