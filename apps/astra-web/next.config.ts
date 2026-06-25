import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.95.71.62", "tony-m3", "127.0.0.1"],
  async headers() {
    if (process.env.NODE_ENV === "production") return [];

    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" }
        ]
      }
    ];
  },
  transpilePackages: ["@astra/contracts", "@astra/db", "@astra/testkit", "@astra/ui"]
};

export default nextConfig;
