import { withRemoteComponents } from "remote-components/next/proxy";

export const proxy = withRemoteComponents(undefined, {
  cors: {
    origin: "*",
    method: ["GET", "POST", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: false,
  },
});

export const config = {
  matcher: ["/remote-components/:path*"],
};

