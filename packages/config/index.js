export const REMOTE_PROVIDER_FALLBACK_URL = "http://localhost:3000";

export const PROVIDER_APP_META = {
  title: "Next.js Remote Component Provider",
  description:
    "Provides remote components for consumption by other apps using Vercel Remote Components"
};

export function getRemoteProviderUrl(envUrl) {
  return envUrl || REMOTE_PROVIDER_FALLBACK_URL;
}
