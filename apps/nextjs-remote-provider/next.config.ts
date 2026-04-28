import { withRemoteComponentsConfig } from 'remote-components/config/nextjs';

const nextConfig = withRemoteComponentsConfig({
  // Enable Cache Components (includes PPR - Partial Prerendering)
  // The "use cache" directive and PPR are both enabled via this single flag
  cacheComponents: true,
  
  // Enable verbose logging for cache operations
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
});

export default nextConfig;
