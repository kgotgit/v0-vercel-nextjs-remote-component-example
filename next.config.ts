import type { NextConfig } from "next";
import { withRemoteComponents } from "remote-components/next/config";

const nextConfig: NextConfig = {
  // Enable CORS for remote component consumption
  async headers() {
    return [
      {
        source: "/remote-components/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default withRemoteComponents(nextConfig);
