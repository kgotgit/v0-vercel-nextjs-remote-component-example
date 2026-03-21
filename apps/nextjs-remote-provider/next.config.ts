import type { NextConfig } from "next";
import { withRemoteComponents } from 'remote-components/next/config';

const nextConfig: NextConfig = withRemoteComponents({});

export default nextConfig;