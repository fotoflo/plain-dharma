// babel-preset-expo handles JSX, TS, expo-router, and the react-native-worklets
// (Reanimated) plugin automatically. We only add inline-import so that
// `import text from '@plain-dharma/content/en/first-talk.mdx'` resolves to the
// file's raw string at build time (the .mdx is plain Markdown — no JSX).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [["babel-plugin-inline-import", { extensions: [".mdx", ".md"] }]],
  };
};
