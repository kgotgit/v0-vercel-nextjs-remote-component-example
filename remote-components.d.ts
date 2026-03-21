declare module "remote-components/next" {
  import type { NextConfig } from "next";
  export function withRemoteComponents(config: NextConfig): NextConfig;
}
