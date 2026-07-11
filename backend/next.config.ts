import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server (incl. HMR websocket) to be reached over the LAN IP,
  // not just localhost. Fixes the "_next/webpack-hmr ... WebSocket handshake failed"
  // errors when opening the admin at http://192.168.x.x:3000 during development.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.108",
    "192.168.*.*",
    "10.*.*.*",
  ],
};

export default nextConfig;
