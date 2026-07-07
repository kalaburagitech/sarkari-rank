const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Block convex server source files in app/convex symlink (keep _generated only)
const convexDir = path.resolve(__dirname, "convex");
config.resolver.blockList = [
  new RegExp(`${convexDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(?!_generated).*`),
];

module.exports = withNativeWind(config, { input: "./global.css" });
