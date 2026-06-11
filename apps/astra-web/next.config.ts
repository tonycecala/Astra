import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@astra/contracts", "@astra/db", "@astra/testkit", "@astra/ui"]
};

export default nextConfig;
