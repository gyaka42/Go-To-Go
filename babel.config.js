module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // déze móet als laatste staan:
      "react-native-reanimated/plugin",
    ],
  };
};
