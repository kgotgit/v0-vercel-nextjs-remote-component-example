export function getComponentLabel(tab) {
  return `${tab.charAt(0).toUpperCase()}${tab.slice(1)} Component`;
}

export const APP_COPY = {
  title: "React SPA - Remote Component Consumer",
  subtitle: "Loading components from Next.js app via Vercel Remote Components"
};

export const PROVIDER_COPY = {
  componentsHeading: "Available Remote Components",
  usageHeading: "Usage",
  usageIntro: "Consume these components in your React SPA using:"
};

export const PROVIDER_COMPONENTS = [
  {
    id: "counter",
    description: "Interactive counter with increment/decrement buttons"
  },
  {
    id: "card",
    description: "Reusable card component with title and content"
  },
  {
    id: "header",
    description: "Shared header with navigation links"
  }
];

export const REMOTE_COMPONENT_USAGE_SNIPPET = `import { RemoteComponent } from 'remote-components/html/host';

<RemoteComponent
  source="http://localhost:3000/remote-components/counter"
  fallback={<Loading />}
/>`;
