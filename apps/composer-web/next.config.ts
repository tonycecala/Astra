import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@astra/contracts", "@astra/ui"]
};

export default nextConfig;
