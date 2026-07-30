import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.95.71.62", "tony-m3", "127.0.0.1"],
  transpilePackages: ["@astra/contracts", "@astra/db", "@astra/testkit", "@astra/ui"]
};

export default nextConfig;
