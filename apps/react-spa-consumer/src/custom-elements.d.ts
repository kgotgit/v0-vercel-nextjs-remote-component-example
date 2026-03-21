import type * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "remote-component": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        name?: string;
      };
    }
  }
}
