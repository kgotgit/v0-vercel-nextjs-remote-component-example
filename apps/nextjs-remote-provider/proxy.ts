import { withExposeRemoteComponents } from "remote-components/remote/middleware";

export const proxy = withExposeRemoteComponents(undefined, {
  cors: {
    origin: "*",
    method: ["GET", "POST", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: false,
  },
});

export const config = {
  matcher: ["/remote-components/:path*", "/_next/static/:path*"],
};
