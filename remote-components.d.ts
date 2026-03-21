declare module "remote-components/next/config" {
  import type { NextConfig } from "next";
  interface RemoteComponentsOptions {
    shared?: string[];
  }
  export function withRemoteComponents(
    config: NextConfig,
    options?: RemoteComponentsOptions
  ): NextConfig;
}
