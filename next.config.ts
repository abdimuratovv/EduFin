import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // better-sqlite3 kabi native modullar serverda qoladi (3-bosqich)
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
