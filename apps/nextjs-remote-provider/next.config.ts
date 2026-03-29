import type { NextConfig } from "next";
import { withRemoteComponents } from 'remote-components/next/config';

const nextConfig: NextConfig = withRemoteComponents({
  // Enable Cache Components (includes PPR - Partial Prerendering)
  // The "use cache" directive and PPR are both enabled via this single flag
  cacheComponents: true,
});

export default nextConfig;
