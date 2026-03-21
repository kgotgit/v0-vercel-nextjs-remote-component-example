/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTE_PROVIDER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Module declaration for remote-components
declare module "remote-components/html/host" {
  import { ReactNode, ComponentType } from "react";

  export interface RemoteComponentProps {
    source: string;
    fallback?: ReactNode;
    [key: string]: unknown;
  }

  export const RemoteComponent: ComponentType<RemoteComponentProps>;
}
