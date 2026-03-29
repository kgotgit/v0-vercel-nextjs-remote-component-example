import type { NextConfig } from "next";
import { withRemoteComponents } from 'remote-components/next/config';

const nextConfig: NextConfig = withRemoteComponents({
  // Enable Cache Components (use cache directive)
  cacheComponents: true,
  
  // Enable Partial Prerendering (PPR)
  experimental: {
    ppr: true,
  },
});

export default nextConfig;
